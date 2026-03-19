import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AgentProfile {
  address: string;
  profile: string;
}

export interface ScoredAgent extends AgentProfile {
  geminiScore: number; // 0.0 – 1.0
  reasoning: string;
}

export async function scoreAgentsWithGemini(
  query: string,
  agents: AgentProfile[]
): Promise<ScoredAgent[]> {
  if (agents.length === 0) return [];

  const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are ranking AI agents for a discovery protocol. A user is searching for agents.

User query: "${query}"

Rate each agent's relevance to this query. Return ONLY valid JSON, no markdown.

Agents:
${agents.map((a, i) => `${i}: ${a.profile}`).join("\n")}

Return a JSON array with one object per agent in the same order:
[{"index": 0, "score": 0.85, "reasoning": "one sentence"}, ...]

Score is 0.0 (irrelevant) to 1.0 (perfect match). Be strict — only score above 0.7 if genuinely relevant.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown fences if Gemini adds them
  const json = text.replace(/```json|```/g, "").trim();
  const parsed: { index: number; score: number; reasoning: string }[] = JSON.parse(json);

  return parsed.map((r) => ({
    ...agents[r.index],
    geminiScore: Math.min(1, Math.max(0, r.score)),
    reasoning: r.reasoning,
  }));
}