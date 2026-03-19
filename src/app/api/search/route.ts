import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import {
  getReputationScore,
  getSybilScore,
  getKnownAgents,
} from "@/lib/chain";
import { scoreAgentsWithGemini } from "@/lib/llm";
import { blendScores } from "@/lib/pagerank";

// Store them in env as JSON, or replace with your own DB/store.
// Format: AGENT_PROFILES={"0xABC":"DeFi data agent","0xDEF":"NFT pricer"}
function getAgentProfiles(): Record<string, string> {
  try {
    return JSON.parse(process.env.AGENT_PROFILES ?? "{}");
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const { query, address, token } = await req.json();

  if (!query || !address) {
    return NextResponse.json(
      { error: "query and address required" },
      { status: 400 }
    );
  }

  const storedToken = cacheGet<string>(`pass:${address.toLowerCase()}`);
  if (!storedToken || storedToken !== token) {
    return NextResponse.json(
      { error: "Payment required", code: 402 },
      { status: 402 }
    );
  }

  const agentList = await getKnownAgents();

  if (agentList.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const agentData = await Promise.all(
    agentList.map(async ({ address: agentAddr, profile }) => {
      const cacheKey = `agent:${agentAddr.toLowerCase()}`;
      const cached = cacheGet<{
        chainScore: number;
        sybilMultiplier: number;
      }>(cacheKey);

      if (cached) {
        return { address: agentAddr, profile, ...cached };
      }

      const [chainScore, sybilMultiplier] = await Promise.all([
        getReputationScore(agentAddr as `0x${string}`),
        getSybilScore(agentAddr as `0x${string}`),
      ]);

      cacheSet(cacheKey, { chainScore, sybilMultiplier }, 60_000);
      return { address: agentAddr, profile, chainScore, sybilMultiplier };
    })
  );

  const geminiScored = await scoreAgentsWithGemini(
    query,
    agentData.map((a) => ({ address: a.address, profile: a.profile }))
  );

  const merged = agentData.map((a) => {
    const g = geminiScored.find(
      (g) => g.address.toLowerCase() === a.address.toLowerCase()
    );
    return {
      ...a,
      geminiScore: g?.geminiScore ?? 0,
      reasoning: g?.reasoning ?? "",
    };
  });

  const ranked = blendScores(merged);
  cacheSet(`pass:${address.toLowerCase()}`, "", 0);

  return NextResponse.json({
    results: ranked,
    meta: {
      totalAgents: agentData.length,
      query,
      timestamp: Date.now(),
    },
  });
}