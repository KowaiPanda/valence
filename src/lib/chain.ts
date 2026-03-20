import { createPublicClient, http, parseAbi } from "viem";

export const CHAIN_ID = 420420417;

const polkadotTestnet = {
  id: CHAIN_ID,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: { default: { http: ["https://eth-rpc-testnet.polkadot.io"] } },
} as const;

export const client = createPublicClient({
  chain: polkadotTestnet,
  transport: http(),
});

export const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ABI = parseAbi([
  "function getAgentReputation(address agent) external view returns (int32)",
  "function agentInteractions(address, uint256) external view returns (uint8 interaction_type, uint64 timestamp)",
  "function micropaymentFee() external view returns (uint256)",
  "event InteractionRecorded(address indexed from, address indexed agent, uint8 interactionType)",
]);

export async function getReputationScore(
  agent: `0x${string}`
): Promise<number> {
  try {
    const raw = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "getAgentReputation",
      args: [agent],
    });
    return Number(raw);
  } catch {
    return 1000;
  }
}

// ── Sybil detection — fetch all InteractionRecorded events for an agent ───────
// event InteractionRecorded(address indexed from, address indexed agent, ...)
// We filter by `agent` in the second indexed position
export async function getSybilScore(
  agent: `0x${string}`
): Promise<number> {
  try {
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: parseAbi([
        "event InteractionRecorded(address indexed from, address indexed agent, uint8 interactionType)",
      ])[0],
      args: { agent }, // filter on the second indexed param
      fromBlock: 0n,
    });

    if (logs.length === 0) return 1.0;

    // Count interactions per sender
    const fromCounts = new Map<string, number>();
    for (const log of logs) {
      const from = (log.args as { from: string }).from.toLowerCase();
      fromCounts.set(from, (fromCounts.get(from) ?? 0) + 1);
    }

    const maxSame = Math.max(...fromCounts.values());
    const selfRatio = maxSame / logs.length;

    // Flag if one address accounts for >60% of interactions
    return selfRatio > 0.6 ? 0.4 : 1.0;
  } catch {
    return 1.0;
  }
}

export async function getKnownAgents(): Promise<{ address: `0x${string}`; profile: string }[]> {
  const profiles: Record<string, string> = (() => {
  try {
    const raw = JSON.parse(process.env.AGENT_PROFILES ?? "{}");
    // Normalize all keys to lowercase so lookup always matches
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v as string])
    );
  } catch {
    return {};
  }
})();

  // Strip "Name | " prefix so Gemini scores on description only
  function getDescription(raw: string): string {
    const pipeIdx = raw.indexOf("|");
    return pipeIdx !== -1 ? raw.slice(pipeIdx + 1).trim() : raw.trim();
  }

  try {
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: parseAbi([
        "event InteractionRecorded(address indexed from, address indexed agent, uint8 interactionType)",
      ])[0],
      fromBlock: 0n,
    });

    const agents = new Map<string, string>();
    for (const log of logs) {
      const addr = (log.args as { agent: string }).agent.toLowerCase() as `0x${string}`;
      const raw = profiles[addr] ?? profiles[addr.toLowerCase()];
      const profile = raw
        ? getDescription(raw)
        : `Agent ${addr.slice(0, 10)}`;
      agents.set(addr, profile);
    }

    return Array.from(agents.entries()).map(([address, profile]) => ({
      address: address as `0x${string}`,
      profile,
    }));
  } catch {
    return [];
  }
}

export const OWNER_ADDRESS = process.env
  .NEXT_PUBLIC_OWNER_ADDRESS as `0x${string}`;

export async function verifySearchPayment(
  txHash: `0x${string}`,
  expectedFrom: `0x${string}`
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const [receipt, tx] = await Promise.all([
      client.getTransactionReceipt({ hash: txHash }),
      client.getTransaction({ hash: txHash }),
    ]);

    if (receipt.status !== "success")
      return { ok: false, reason: "Transaction failed" };
    if (tx.from.toLowerCase() !== expectedFrom.toLowerCase())
      return { ok: false, reason: "Sender mismatch" };
    if (tx.to?.toLowerCase() !== OWNER_ADDRESS.toLowerCase())
      return { ok: false, reason: "Wrong recipient — must send to owner address" };
    if (tx.value < 1_000_000_000_000_000n)
      return { ok: false, reason: "Insufficient payment (min 0.001 PAS)" };

    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not fetch transaction" };
  }
}