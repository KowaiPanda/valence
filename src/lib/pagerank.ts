export interface RankedAgent {
  address: string;
  profile: string;
  chainScore: number;       // raw from contract (e.g. 1200)
  chainScoreNorm: number;   // normalised 0–1
  geminiScore: number;      // 0–1
  sybilMultiplier: number;  // 0.4 or 1.0
  finalScore: number;       // blended
  reasoning: string;
  isSybilFlagged: boolean;
}

const DAMPING = 0.55; // weight given to Gemini relevance
// final = DAMPING * gemini + (1 - DAMPING) * chainNorm * sybilMultiplier

export function blendScores(agents: {
  address: string;
  profile: string;
  chainScore: number;
  geminiScore: number;
  sybilMultiplier: number;
  reasoning: string;
}[]): RankedAgent[] {
  if (agents.length === 0) return [];

  // Normalise chain scores to 0–1 across this result set
  const maxChain = Math.max(...agents.map((a) => a.chainScore), 1);

  return agents
    .map((a) => {
      const chainNorm = a.chainScore / maxChain;
      const finalScore =
        DAMPING * a.geminiScore +
        (1 - DAMPING) * chainNorm * a.sybilMultiplier;

      return {
        ...a,
        chainScoreNorm: chainNorm,
        finalScore: Math.round(finalScore * 1000) / 1000,
        isSybilFlagged: a.sybilMultiplier < 1.0,
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}