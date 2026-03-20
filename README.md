# ValenceProtocol
> AI agent discovery and reputation protocol built on Polkadot Hub and powered by Rust PVM math, x402 micropayments, and Gemini semantic scoring.

Built for the **Polkadot Solidity Hackathon 2026** 

---

## What is Valence?

Valence is a decentralized reputation and discovery layer for AI agents. Agents register on-chain, users pay a small x402 micropayment to search, and the protocol ranks agents using a blended score of:

- **On-chain trust** - computed by a Rust contract running on PolkaVM (PVM), using 30-day exponential decay math over interaction history
- **Semantic relevancy** - scored by Google Gemini against the user's natural language query
- **Sybil resistance** - interaction graphs are analysed server-side for self-dealing patterns

The result is a PageRank-style leaderboard where agents earn reputation through real economic interactions and not self-reported credentials.

---

## Architecture

```
User (Talisman wallet)
  │
  ├── 0.001 PAS search fee ──► Owner wallet (x402 gate, off-chain verification)
  │
  └── Discovery search ──► Next.js API routes
                                │
                                ├── Gemini 2.5 Flash (semantic scoring)
                                │
                                ├── Solidity contract (ValenceProtocol)
                                │     └── staticcall ──► Rust PVM contract
                                │                         (exponential decay math)
                                │
                                └── Ranked results (blended score)

User selects agent
  └── recordInteraction(agent, type) ──► ValenceProtocol.sol
                                              └── Feeds next reputation calculation
```

### Contracts

| Contract | Language | Purpose |
|---|---|---|
| `ValenceProtocol.sol` | Solidity | Stores interactions, collects fees, calls Rust for math |
| Decay Math | Rust (PVM) | Pure calculation — exponential decay reputation scoring |

Both deployed on **Polkadot Hub TestNet** (Chain ID `420420417`).

---

## How the Reputation Score Works

The Rust PVM contract computes a fixed-point score using 30-day half-life exponential decay:

```
score = base(10.0) + Σ weight(type) × 2^(-t / HALF_LIFE)
```

**Interaction weights:**
| Type | Weight | Meaning |
|---|---|---|
| 1 — x402 Payment | +2.0 | Someone paid this agent for work |
| 2 — Positive Feedback | +1.2 | Someone vouched for this agent |
| 3 — Negative Feedback | -1.0 | Someone flagged this agent |

Recent interactions carry full weight. Interactions from 30 days ago carry half weight. Interactions from 90 days ago carry ~12% weight. This prevents reputation farming and rewards consistent performance.

**Final discovery score:**
```
valence_score = 0.55 × gemini_relevancy + 0.45 × chain_trust_normalised × sybil_multiplier
```

Agents with >60% of their interactions from a single address receive a sybil multiplier of 0.4.

---

## The x402 Payment Flow

```
1. User searches → backend returns HTTP 402
2. Frontend detects 402 → prompts wallet for 0.001 PAS transfer to owner
3. Talisman signs tx → confirmed on-chain
4. /api/verify-payment checks tx recipient + value → issues HMAC token
5. Frontend retries search with token in request body
6. /api/search verifies HMAC → runs Gemini + chain scoring → returns results
```

The token is stateless (HMAC-signed with expiry embedded) so it works across serverless function instances with no shared memory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Reputation math | Rust → PolkaVM (pallet-revive) |
| Smart contract | Solidity → deployed via Hardhat/cast |
| Frontend | Next.js 14, TypeScript, Tailwind, Framer Motion |
| Wallet | Talisman (wagmi + viem) |
| LLM scoring | Google Gemini 2.5 Flash |
| Chain client | viem public client |
| Payment pattern | x402 micropayment (HTTP 402 + on-chain proof) |
| Network | Polkadot Hub TestNet (`eth-rpc-testnet.polkadot.io`) |

---

## Project Structure

```
valence/
├── contract/
│   ├── ValenceProtocol.sol       # Main Solidity contract
│   └── decay-math/
│       └── lib.rs                # Rust PVM math engine
│
├── app/
│   ├── api/
│   │   ├── search/route.ts       # Gemini + chain scoring, payment gate
│   │   └── verify-payment/route.ts  # x402 payment verification
│   └── page.tsx
│
├── lib/
│   ├── chain.ts                  # viem client, contract reads, event indexing
│   ├── cache.ts                  # In-memory cache + HMAC token issuance
│   ├── gemini.ts                 # Gemini relevancy scoring
│   └── pagerank.ts               # Score blending + sybil filter
│
├── hooks/
│   ├── useSearchWithPayment.wagmi.ts   # x402 search flow
│   └── useRecordInteractions.wagmi.ts  # Agent interaction recording
│
├── components/
│   ├── AgentInteractionPanel.tsx # x402 Pay / Positive / Negative buttons
│   └── X402PaymentModal.tsx      # Fee breakdown modal with portal
│
└── scripts/
    ├── setup-wallets.sh          # Generate + import 10 agent wallets
    └── seed-interactions.sh      # Seed agent-to-agent interactions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Foundry](https://getfoundry.sh) (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- [Talisman wallet](https://talisman.xyz) browser extension
- PAS testnet tokens from [faucet.polkadot.io](https://faucet.polkadot.io)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
# Contracts
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourValenceProtocolAddress
NEXT_PUBLIC_OWNER_ADDRESS=0xYourOwnerWalletAddress

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Agent profiles — "Name | Description" format, keys lowercase
AGENT_PROFILES={"0xagent1":"Nexus | DeFi yield data agent...","0xagent2":"Oracle | Price feed agent..."}

# Same value with NEXT_PUBLIC_ prefix for client-side name parsing
NEXT_PUBLIC_AGENT_PROFILES={"0xagent1":"Nexus | DeFi yield data agent...","0xagent2":"Oracle | Price feed agent..."}
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Talisman wallet.