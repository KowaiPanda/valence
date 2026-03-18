#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod decay_math {
    use ink::prelude::vec::Vec;
    use core::convert::TryFrom;

    const SCALE: u128 = 1_000_000_000_000;
    const SCALE_I128: i128 = 1_000_000_000_000;
    const NEG_SCALE_I128: i128 = -1_000_000_000_000;

    const LN2: u128 = 693_147_180_560;

    const HALF_LIFE: u128 = 30 * 86_400;

    #[derive(scale::Decode, scale::Encode, Clone)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    // Interactions: 1 = x402 Payment, 2 = Positive Feedback, 3 = Negative Feedback
    pub struct Interaction {
        pub interaction_type: u8,
        pub timestamp: u64,
    }

    #[ink(storage)]
    pub struct DecayMath {}

    impl Default for DecayMath {
        fn default() -> Self {
            Self::new()
        }
    }

    impl DecayMath {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {}
        }

        /// Calculates and returns the reputation score using a 30-day exponential decay.
        ///
        /// Decay model: weight * 2^(-t / HALF_LIFE)
        /// The fractional part of 2^(-f) is approximated via a Taylor series for e^(-f * ln2).
        /// The integer part of the shift is applied via right-shift (>> i).
        ///
        /// Returns a score in the range [0, i32::MAX], scaled so that a raw 1.0 = 100.
        #[ink(message)]
        pub fn calculate_reputation(
            &self,
            interactions: Vec<Interaction>,
            current_time: u64,
        ) -> i32 {
            // Base reputation: 10.0 represented as fixed-point (10 * SCALE)
            let mut score: i128 = 10_i128.saturating_mul(SCALE_I128);

            for interaction in interactions {
                // --- 1. Time delta (saturate to 0 if timestamp is in the future) ---
                let time_diff =
                    u128::from(current_time.saturating_sub(interaction.timestamp));

                // --- 2. Split time_diff into integer half-lives (i) and remainder (f_sec) ---
                // i = floor(time_diff / HALF_LIFE)
                let i_u128 = time_diff / HALF_LIFE;
                // Clamp to u32 for the shift; anything >= 128 decays to zero anyway.
                let i = u32::try_from(i_u128).unwrap_or(128_u32);

                // f_sec = time_diff mod HALF_LIFE  (safe: HALF_LIFE != 0)
                let f_sec = time_diff % HALF_LIFE;

                // --- 3. Normalise f_sec into fixed-point [0, SCALE) ---
                // f = f_sec / HALF_LIFE  (fixed-point, SCALE == 1.0)
                let f = f_sec
                    .saturating_mul(SCALE)
                    .saturating_div(HALF_LIFE);

                // --- 4. Taylor series for 2^(-f) = e^(-f * ln2) ---
                // Let u = f * ln2
                // e^(-u) ≈ 1 - u + u²/2 - u³/6
                let u = f.saturating_mul(LN2).saturating_div(SCALE);
                let u2 = u.saturating_mul(u).saturating_div(SCALE); // u²
                let u3 = u2.saturating_mul(u).saturating_div(SCALE); // u³

                let term1 = SCALE;       // 1
                let term2 = u;           // u
                let term3 = u2 / 2;      // u²/2
                let term4 = u3 / 6;      // u³/6

                // e^(-u) ≈ 1 - u + u²/2 - u³/6
                let pos = term1.saturating_add(term3);
                let neg = term2.saturating_add(term4);
                let frac_approx = pos.saturating_sub(neg);

                // --- 5. Apply the integer part of the decay via right-shift ---
                // Full decay = frac_approx >> i  (== frac_approx / 2^i)
                let decay_fraction: u128 = if i >= 128 {
                    0
                } else {
                    frac_approx >> i
                };

                // --- 6. Interaction weights (fixed-point) ---
                let weight: i128 = match interaction.interaction_type {
                    1 => 2_i128.saturating_mul(SCALE_I128),                     // +2.0  (payment)
                    2 => 12_i128.saturating_mul(SCALE_I128).saturating_div(10), // +1.2  (positive)
                    3 => NEG_SCALE_I128,                                         // -1.0  (negative)
                    _ => 0,
                };

                // --- 7. impact = weight * decay_fraction 2---
                let decay_i128 = i128::try_from(decay_fraction).unwrap_or(0);
                let impact = weight
                    .saturating_mul(decay_i128)
                    .saturating_div(SCALE_I128);

                score = score.saturating_add(impact);
            }

            // --- 8. Clamp to [0, ∞) then rescale to a human-readable integer ---
            if score < 0 {
                score = 0;
            }

            // scale back: score was stored as (value * SCALE), multiply by 100
            // so that a raw 1.0 → 100, a base score of 10.0 → 1000, etc.
            let scaled_score = score
                .saturating_mul(100)
                .saturating_div(SCALE_I128);

            i32::try_from(scaled_score).unwrap_or(i32::MAX)
        }
    }

    // -------------------------------------------------------------------------
    // Unit tests
    // -------------------------------------------------------------------------
    #[cfg(test)]
    mod tests {
        use super::*;

        fn contract() -> DecayMath {
            DecayMath::new()
        }

        /// No interactions → base score of 10.0 → returns 1000
        #[test]
        fn base_score_no_interactions() {
            let c = contract();
            let score = c.calculate_reputation(vec![], 1_000_000);
            assert_eq!(score, 1000, "base score should be 1000 (10.0 × 100)");
        }

        /// A very recent payment (+2.0) should push the score above base.
        #[test]
        fn recent_payment_increases_score() {
            let c = contract();
            let now: u64 = 1_000_000;
            let interactions = vec![Interaction { interaction_type: 1, timestamp: now - 10 }];
            let score = c.calculate_reputation(interactions, now);
            // base=1000, recent +2.0 ≈ +200, total ≈ 1200
            assert!(score > 1000, "score should exceed base after a recent payment");
        }

        /// An ancient interaction (>> 30 days) decays to near zero.
        #[test]
        fn old_interaction_fully_decayed() {
            let c = contract();
            let now: u64 = 10_000_000;
            let old_ts: u64 = 0; // ~115 days ago at now=10_000_000s, many half-lives
            let interactions = vec![Interaction { interaction_type: 1, timestamp: old_ts }];
            let score = c.calculate_reputation(interactions, now);
            // Should be very close to base (1000)
            assert!(
                (score - 1000).abs() < 5,
                "ancient interaction should contribute ~0; got {score}"
            );
        }

        /// Negative feedback should lower the score.
        #[test]
        fn negative_feedback_lowers_score() {
            let c = contract();
            let now: u64 = 1_000_000;
            let interactions = vec![Interaction { interaction_type: 3, timestamp: now - 10 }];
            let score = c.calculate_reputation(interactions, now);
            assert!(score < 1000, "negative feedback should lower score below base");
        }

        /// Score never goes below 0.
        #[test]
        fn score_never_negative() {
            let c = contract();
            let now: u64 = 1_000_000;
            let interactions: Vec<Interaction> = (0..200)
                .map(|_| Interaction { interaction_type: 3, timestamp: now - 10 })
                .collect();
            let score = c.calculate_reputation(interactions, now);
            assert!(score >= 0, "score must never be negative");
        }

        /// Future timestamps are treated as zero time-diff (no panic, no underflow).
        #[test]
        fn future_timestamp_safe() {
            let c = contract();
            let now: u64 = 1_000;
            let interactions = vec![Interaction { interaction_type: 1, timestamp: now + 9999 }];
            let score = c.calculate_reputation(interactions, now);
            // future timestamp → time_diff = 0 → full weight applied (no decay)
            assert!(score >= 1000);
        }
    }
}