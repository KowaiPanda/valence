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

// Sybil detection based on interaction patterns
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
      args: { agent },
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

export async function getKnownAgents(): Promise<`0x${string}`[]> {
  // First try env var (manual list) — fastest path for hackathon demo
  const envList = (process.env.REGISTERED_AGENTS ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean) as `0x${string}`[];
  if (envList.length > 0) return envList;

  // Fallback: discover from on-chain events
  try {
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: parseAbi([
        "event InteractionRecorded(address indexed from, address indexed agent, uint8 interactionType)",
      ])[0],
      fromBlock: 0n,
    });

    const agents = new Set<`0x${string}`>();
    for (const log of logs) {
      const agent = (log.args as { agent: string }).agent as `0x${string}`;
      agents.add(agent.toLowerCase() as `0x${string}`);
    }
    return Array.from(agents);
  } catch {
    return [];
  }
}

// Verify a payment tx before granting a search pass
export async function verifyPaymentTx(
  txHash: `0x${string}`,
  expectedFrom: `0x${string}`
): Promise<boolean> {
  try {
    const [receipt, tx] = await Promise.all([
      client.getTransactionReceipt({ hash: txHash }),
      client.getTransaction({ hash: txHash }),
    ]);

    // Fetch on-chain fee
    const fee = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "micropaymentFee",
    });

    return (
      receipt.status === "success" &&
      tx.from.toLowerCase() === expectedFrom.toLowerCase() &&
      tx.to?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
      tx.value >= (fee as bigint)
    );
  } catch {
    return false;
  }
}