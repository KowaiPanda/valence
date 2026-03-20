import { NextRequest, NextResponse } from "next/server";
import { verifyToken, cacheGet, cacheSet } from "@/lib/cache";
import {
  getReputationScore,
  getSybilScore,
  getKnownAgents,
} from "@/lib/chain";
import { scoreAgentsWithGemini } from "@/lib/llm";
import { blendScores } from "@/lib/pagerank";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, address, token } = body;

  if (!query || !address) {
    return NextResponse.json(
      { error: "query and address required" },
      { status: 400 }
    );
  }

  // Verify HMAC token — works across serverless instances
  if (!token || !verifyToken(address, token)) {
    return NextResponse.json(
      { error: "Payment required", code: 402 },
      { status: 402 }
    );
  }

  // getKnownAgents returns { address, profile } where profile = "Name | Description"
  const agentList = await getKnownAgents();

  if (agentList.length === 0) {
    return NextResponse.json({ results: [], meta: { totalAgents: 0, query, timestamp: Date.now() } });
  }

  const agentData = await Promise.all(
    agentList.map(async ({ address: agentAddr, profile }) => {
      const cacheKey = `agent:${agentAddr.toLowerCase()}`;
      const cached = cacheGet<{ chainScore: number; sybilMultiplier: number }>(cacheKey);

      console.log(`${profile}`)

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

  // Strip "Name | " prefix — Gemini scores on description only, not the name
  function descriptionOnly(profile: string): string {
    const idx = profile.indexOf("|");
    return idx !== -1 ? profile.slice(idx + 1).trim() : profile.trim();
  }

  const geminiScored = await scoreAgentsWithGemini(
    query,
    agentData.map((a) => ({
      address: a.address,
      profile: descriptionOnly(a.profile),
    }))
  );

  const merged = agentData.map((a) => {
    const g = geminiScored.find(
      (g) => g.address.toLowerCase() === a.address.toLowerCase()
    );
    return {
      ...a,
      // profile kept as "Name | Description" for frontend to parse
      geminiScore: g?.geminiScore ?? 0,
      reasoning: g?.reasoning ?? "",
    };
  });

  const ranked = blendScores(merged);

  return NextResponse.json({
    results: ranked,
    meta: {
      totalAgents: agentData.length,
      query,
      timestamp: Date.now(),
    },
  });
}