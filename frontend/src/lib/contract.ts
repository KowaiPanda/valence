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
  "0x08e1744be5cD5c890c0A94Ea8bB36394B731387a";
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

/* ---- Agent Name Generator (deterministic from address) ---- */
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
const AGENT_DESCRIPTIONS: Record<string, string> = {};
const DESC_TEMPLATES = [
  "Autonomous DeFi agent specializing in cross-chain yield optimization on Polkadot parachains.",
  "Smart contract auditor agent that reviews Solidity & ink! code for vulnerabilities.",
  "Data analytics agent processing on-chain metrics and generating actionable market intelligence.",
  "Portfolio management agent with advanced risk modeling and time-decay strategy execution.",
  "Decentralized oracle agent bridging off-chain data sources to PolkaVM smart contracts.",
  "NFT valuation specialist leveraging ML models for real-time floor price predictions.",
  "MEV-aware transaction routing agent optimizing gas costs across EVM-compatible chains.",
  "Governance aggregator agent that monitors and participates in DAO proposals across ecosystems.",
  "Liquidity provisioning agent with automated rebalancing for concentrated liquidity positions.",
  "Security monitoring agent detecting anomalous on-chain activity patterns in real-time.",
  "Cross-chain bridge agent enabling trustless asset transfers between Polkadot and Ethereum.",
  "Supply chain verification agent ensuring provenance tracking via on-chain attestations.",
  "AI-powered trading agent executing algorithmic strategies with Rust-level performance.",
  "Reputation scoring agent computing trust metrics using exponential time-decay models.",
  "Infrastructure monitoring agent for validator nodes and parachain health checks.",
  "Compliance agent automating KYC/AML checks for decentralized finance protocols.",
  "Content curation agent filtering and ranking Web3 project metadata using semantic search.",
  "Insurance underwriting agent modeling risk pools for DeFi protocol coverage.",
];

export function getAgentName(address: Address): string {
  const seed = parseInt(address.slice(2, 10), 16);
  const adj = AGENT_ADJECTIVES[seed % AGENT_ADJECTIVES.length];
  const noun = AGENT_NOUNS[(seed >> 8) % AGENT_NOUNS.length];
  return `${adj} ${noun}`;
}

export function getAgentDescription(address: Address): string {
  if (AGENT_DESCRIPTIONS[address]) return AGENT_DESCRIPTIONS[address];
  const seed = parseInt(address.slice(2, 10), 16);
  const desc = DESC_TEMPLATES[(seed >> 4) % DESC_TEMPLATES.length];
  AGENT_DESCRIPTIONS[address] = desc;
  return desc;
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
