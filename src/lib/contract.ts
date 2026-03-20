import { createPublicClient, http, parseAbi, type Address, formatEther } from "viem";

/* ---- Chain Config ---- */
const polkadotEvmTestnet = {
  id: 420420421,
  name: "Polkadot EVM Testnet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io",
    },
  },
} as const;

export const SOLIDITY_ADDRESS: Address =
  "0xF5C64C347833293352c15B08b5A241748E73b164";
export const RUST_PVM_ADDRESS: Address =
  "0x3038d0be3fd22af9d42f2bc74f6e692e61e1b8c0";
export const MICROPAYMENT_FEE = "0.001"; // PAS
export const RPC_URL = "https://eth-rpc-testnet.polkadot.io";

/* ---- ABI ---- */
export const VALENCE_ABI = parseAbi([
  "function getAgentReputation(address agent) view returns (int32)",
  "function recordInteraction(address agent, uint8 interactionType) payable",
  "function micropaymentFee() view returns (uint256)",
  "function owner() view returns (address)",
  "function pvmMathEngineAddress() view returns (address)",
  "function agentInteractions(address, uint256) view returns (uint8 interaction_type, uint64 timestamp)",
  "event InteractionRecorded(address indexed from, address indexed agent, uint8 interactionType)",
]);

/* ---- Client ---- */
export const publicClient = createPublicClient({
  chain: polkadotEvmTestnet,
  transport: http(RPC_URL),
});

/* ---- Types ---- */
export interface AgentInteraction {
  from: Address;
  agent: Address;
  interactionType: number;
  timestamp?: bigint;
  txHash?: string;
  blockNumber?: bigint;
}

export interface AgentData {
  address: Address;
  name: string;
  description: string;
  reputation: number;
  interactions: AgentInteraction[];
}

/* ---- Helpers ---- */
export async function getAgentReputation(agent: Address): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: SOLIDITY_ADDRESS,
      abi: VALENCE_ABI,
      functionName: "getAgentReputation",
      args: [agent],
    });
    return Number(result);
  } catch (err) {
    console.error("getAgentReputation error:", err);
    return 1000; // default base score
  }
}

export async function getInteractionLogs(): Promise<AgentInteraction[]> {
  try {
    const logs = await publicClient.getLogs({
      address: SOLIDITY_ADDRESS,
      event: {
        type: 'event',
        name: 'InteractionRecorded',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'agent', type: 'address', indexed: true },
          { name: 'interactionType', type: 'uint8', indexed: false },
        ],
      },
      fromBlock: BigInt(0),
      toBlock: "latest",
    });

    return logs.map((log) => ({
      from: log.args.from as Address,
      agent: log.args.agent as Address,
      interactionType: Number(log.args.interactionType),
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
    }));
  } catch (err) {
    console.error("getInteractionLogs error:", err);
    return [];
  }
}

export async function getMicropaymentFee(): Promise<string> {
  try {
    const fee = await publicClient.readContract({
      address: SOLIDITY_ADDRESS,
      abi: VALENCE_ABI,
      functionName: "micropaymentFee",
    });
    return formatEther(fee as bigint);
  } catch {
    return MICROPAYMENT_FEE;
  }
}

function getAgentProfiles(): Record<string, { name: string; description: string }> {
  try {
    // AGENT_PROFILES env var format:
    // {"0xabc...": "Name | Description", ...}
    // OR just a description, in which case we derive name from it
    const raw: Record<string, string> = JSON.parse(
      process.env.NEXT_PUBLIC_AGENT_PROFILES ?? "{}"
    );
    const result: Record<string, { name: string; description: string }> = {};
    for (const [addr, value] of Object.entries(raw)) {
      // Support "Name | Description" format for a clean name
      const [first, ...rest] = value.split("|");
      if (rest.length > 0) {
        result[addr.toLowerCase()] = {
          name: first.trim(),
          description: rest.join("|").trim(),
        };
      } else {
        // No pipe — use first word(s) as name, full string as description
        const words = first.trim().split(" ");
        result[addr.toLowerCase()] = {
          name: words[0],
          description: first.trim(),
        };
      }
    }
    console.log("Parsed agent profiles:", result);
    return result;
  } catch {
    return {};
  }
}

const PROFILES = getAgentProfiles();

// Fallback generator
const AGENT_ADJECTIVES = [
  "Quantum", "Neural", "Sonic", "Stellar", "Cipher", "Nexus",
  "Flux", "Apex", "Vortex", "Prism", "Echo", "Helix",
  "Zenith", "Pulse", "Rift", "Nova", "Omega", "Onyx",
];
const AGENT_NOUNS = [
  "Trader", "Oracle", "Sentinel", "Pathfinder", "Curator", "Scout",
  "Broker", "Analyst", "Guardian", "Strategist", "Navigator", "Auditor",
  "Arbitrageur", "Indexer", "Validator", "Optimizer", "Resolver", "Synthesizer",
];
const DESC_TEMPLATES = [
  "Autonomous DeFi agent specializing in cross-chain yield optimization on Polkadot parachains.",
  "Smart contract auditor agent that reviews Solidity & ink! code for vulnerabilities.",
  "Data analytics agent processing on-chain metrics and generating actionable market intelligence.",
  "Portfolio management agent with advanced risk modeling and time-decay strategy execution.",
  "Decentralized oracle agent bridging off-chain data sources to PolkaVM smart contracts.",
];

export function getAgentName(address: Address): string {
  const profile = PROFILES[address.toLowerCase()];
  if (profile) return profile.name;
  // Fallback: deterministic name from address
  const seed = parseInt(address.slice(2, 10), 16);
  const adj = AGENT_ADJECTIVES[seed % AGENT_ADJECTIVES.length];
  const noun = AGENT_NOUNS[(seed >> 8) % AGENT_NOUNS.length];
  return `${adj} ${noun}`;
}

export function getAgentDescription(address: Address): string {
  const profile = PROFILES[address.toLowerCase()];
  if (profile) return profile.description;
  // Fallback: deterministic description from address
  const seed = parseInt(address.slice(2, 10), 16);
  return DESC_TEMPLATES[(seed >> 4) % DESC_TEMPLATES.length];
}

export function interactionTypeLabel(type: number): string {
  switch (type) {
    case 1: return "x402 Payment";
    case 2: return "Positive Feedback";
    case 3: return "Negative Feedback";
    default: return "Unknown";
  }
}

export function interactionTypeColor(type: number): string {
  switch (type) {
    case 1: return "#00E6A0";
    case 2: return "#6366F1";
    case 3: return "#EF4444";
    default: return "#8a7fa8";
  }
}

export function truncateAddress(addr: Address): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export { formatEther };
