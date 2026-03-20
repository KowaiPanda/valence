"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  Cpu,
  Code2,
  Globe,
  ExternalLink,
  Layers,
  Zap,
  Shield,
  Search,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  CreditCard,
  Clock,
  ShieldCheck,
  Brain,
  BarChart3,
  Link2,
  Server,
} from "lucide-react";
import {
  SOLIDITY_ADDRESS,
  RUST_PVM_ADDRESS,
  truncateAddress,
} from "@/lib/contract";

const vp = { once: true, margin: "-40px" as const };
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: vp,
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});
const fadeX = (x: number, delay = 0) => ({
  initial: { opacity: 0, x },
  whileInView: { opacity: 1, x: 0 },
  viewport: vp,
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

const layers = [
  {
    title: "Layer 1: Math Engine",
    subtitle: "Rust / PolkaVM",
    icon: Cpu,
    color: "#00E6A0",
    bgColor: "rgba(0, 230, 160, 0.06)",
    borderColor: "rgba(0, 230, 160, 0.15)",
    address: RUST_PVM_ADDRESS,
    description:
      "ink! v6 Rust smart contract compiled to RISC-V bytecode (.polkavm). Calculates complex exponential decay math and reputation scores at native speed. EVM cannot handle floating-point math efficiently -- PolkaVM can.",
    highlights: [
      "30-day exponential half-life decay",
      "Taylor series approximation for 2^(-f)",
      "Fixed-point arithmetic (10^12 scale)",
      "Integer-only output for EVM compatibility",
    ],
  },
  {
    title: "Layer 2: Ledger & Bridge",
    subtitle: "Solidity / EVM",
    icon: Code2,
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.06)",
    borderColor: "rgba(139, 92, 246, 0.15)",
    address: SOLIDITY_ADDRESS,
    description:
      "ValenceProtocol.sol acts as the x402 payment ledger and cross-VM bridge. It stores interactions, collects micropayments, and packs SCALE-encoded Little-Endian bytes to call the Rust contract via staticcall.",
    highlights: [
      "Custom EVM-to-SCALE byte encoder",
      "Little-Endian packing for PolkaVM",
      "Low-level staticcall to Rust contract",
      "x402 micropayment collection (0.001 PAS)",
    ],
  },
  {
    title: "Layer 3: Brain & Bouncer",
    subtitle: "Node.js API",
    icon: Globe,
    color: "#E6007A",
    bgColor: "rgba(230, 0, 122, 0.06)",
    borderColor: "rgba(230, 0, 122, 0.15)",
    address: null,
    description:
      "The API layer: the Bouncer intercepts requests and validates x-l402-tx-hash payment proofs. The Brain uses Gemini AI for semantic search, triggers the Solidity-to-Rust bridge for trust scores, and blends them 60/40.",
    highlights: [
      "x402 payment verification middleware",
      "Gemini AI semantic relevancy scoring",
      "60% LLM + 40% On-Chain trust blending",
      "Natural language agent discovery",
    ],
  },
];

const weights = [
  {
    type: "x402 Payment",
    weight: "2.0x",
    color: "#00E6A0",
    desc: "Real economic commitment -- highest signal of trust",
  },
  {
    type: "Positive Feedback",
    weight: "1.2x",
    color: "#6366F1",
    desc: "Peer endorsement from successful interactions",
  },
  {
    type: "Negative Feedback",
    weight: "-1.0x",
    color: "#EF4444",
    desc: "Penalty signal -- reduces agent reputation",
  },
];

const bridgeSteps = [
  { step: "1", title: "Pack Selector", desc: "4-byte Rust function selector (0xb378d1e2)", color: "#8B5CF6" },
  { step: "2", title: "Encode SCALE", desc: "Flip to Little-Endian, pack interaction vector length", color: "#6366F1" },
  { step: "3", title: "staticcall", desc: "Fire raw bytes into PVM Rust contract address", color: "#E6007A" },
  { step: "4", title: "Decode Result", desc: "Parse Little-Endian int32 back to Big-Endian EVM format", color: "#00E6A0" },
];

const paymentFlowSteps = [
  { icon: Wallet, title: "Connect", desc: "Link Talisman wallet", color: "#8B5CF6" },
  { icon: CreditCard, title: "Pay 0.001 PAS", desc: "x402 micropayment", color: "#E6007A" },
  { icon: Clock, title: "Confirm", desc: "On-chain receipt", color: "#F5A623" },
  { icon: ShieldCheck, title: "Verify", desc: "Server validates tx", color: "#6366F1" },
  { icon: Brain, title: "Score", desc: "Gemini AI + Chain", color: "#00E6A0" },
  { icon: BarChart3, title: "Rank", desc: "Blended results", color: "#E6007A" },
];

const dataFlowNodes = [
  { label: "User Query", sublabel: "Natural language search", color: "#8B5CF6", icon: Search },
  { label: "x402 Micropayment", sublabel: "0.001 PAS to owner wallet", color: "#E6007A", icon: CreditCard },
  { label: "API Bouncer", sublabel: "Verifies tx hash on-chain", color: "#F5A623", icon: Shield },
  { label: "Gemini AI", sublabel: "Semantic relevancy scoring", color: "#6366F1", icon: Brain },
  { label: "Solidity Contract", sublabel: "getAgentReputation() + SCALE encode", color: "#8B5CF6", icon: Code2 },
  { label: "Rust / PolkaVM", sublabel: "calculate_reputation() via staticcall", color: "#00E6A0", icon: Cpu },
  { label: "Score Blender", sublabel: "55% AI + 45% Chain * Sybil", color: "#E6007A", icon: BarChart3 },
  { label: "Ranked Results", sublabel: "Sorted by blended finalScore", color: "#00E6A0", icon: CheckCircle2 },
];

export default function ArchitectureTab() {
  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1">
      {/* Title */}
      <div className="text-center py-4">
        <motion.div
          className="badge inline-flex mb-3"
          style={{
            borderColor: "rgba(139, 92, 246, 0.25)",
            background: "rgba(139, 92, 246, 0.06)",
            color: "#8B5CF6",
          }}
          {...fadeUp()}
        >
          <Layers className="w-3 h-3" />
          Cross-VM Interoperability
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">How Valence Works</h2>
        <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
          A masterclass in cross-VM interoperability on Polkadot (pallet-revive).
          Rust handles the math, Solidity handles the payments, and Node.js
          handles the intelligence.
        </p>
      </div>

      {/* 3-Layer Architecture */}
      <div className="space-y-0">
        {layers.map((layer, idx) => (
          <div key={layer.title}>
            <motion.div
              className="glass-card-premium p-5"
              style={{ borderColor: layer.borderColor }}
              {...fadeX(-16, idx * 0.1)}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: layer.bgColor, boxShadow: `0 0 20px ${layer.color}15` }}
                >
                  <layer.icon className="w-6 h-6" style={{ color: layer.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-semibold" style={{ color: layer.color }}>{layer.title}</h3>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                      style={{ background: `${layer.color}08`, color: "var(--color-muted)", border: `1px solid ${layer.color}15` }}
                    >
                      {layer.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-3">{layer.description}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {layer.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2 text-xs text-foreground/70">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: layer.color, boxShadow: `0 0 4px ${layer.color}60` }}
                        />
                        {h}
                      </div>
                    ))}
                  </div>
                  {layer.address ? (
                    <a
                      href={`https://blockscout-testnet.polkadot.io/address/${layer.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-xs font-mono text-muted hover:text-foreground transition-colors"
                    >
                      {truncateAddress(layer.address)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 mt-3 text-xs text-muted italic">
                      Coming soon -- Phase 2
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* CSS-only animated connector */}
            {idx < layers.length - 1 && (
              <div className="layer-connector">
                <div className="layer-connector-line" style={{ background: `${layer.color}40` }} />
                <ArrowDown className="w-4 h-4 arch-bounce" style={{ color: layer.color, opacity: 0.6 }} />
                <div className="layer-connector-line" style={{ background: `${layers[idx + 1].color}40` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cross-VM Bridge Detail */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <Code2 className="w-4 h-4 text-primary" />
          The Cross-VM Bridge
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          When <code className="text-purple font-mono font-medium">getAgentReputation()</code>{" "}
          is called, Solidity manually encodes the data into SCALE format and
          fires a <code className="text-purple font-mono font-medium">staticcall</code> to the
          Rust contract on PolkaVM:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {bridgeSteps.map((s, i) => (
            <motion.div
              key={s.step}
              className="rounded-xl p-4 text-center relative overflow-hidden"
              style={{ background: `${s.color}06`, border: `1px solid ${s.color}18` }}
              {...fadeUp(0.1 + i * 0.08)}
            >
              <div
                className="w-8 h-8 rounded-lg mx-auto mb-2.5 flex items-center justify-center text-sm font-bold"
                style={{ background: `${s.color}15`, color: s.color, boxShadow: `0 0 12px ${s.color}15` }}
              >
                {s.step}
              </div>
              <p className="text-xs font-semibold mb-1">{s.title}</p>
              <p className="text-[10px] text-muted leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Decay Formula */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <Zap className="w-4 h-4 text-accent" />
          Reputation Decay Model
        </h3>
        <div className="code-block text-center mb-4">
          <code className="text-lg font-mono text-foreground">
            score += weight x 2<sup>-t / 30 days</sup>
          </code>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Each interaction&apos;s impact decays exponentially with a 30-day half-life.
          The Taylor series approximation for 2<sup>-f</sup> is computed
          entirely in fixed-point arithmetic inside PolkaVM:
        </p>
        <div className="code-block text-xs text-accent leading-relaxed">
          e<sup>-u</sup> &asymp; 1 - u + u&sup2;/2 - u&sup3;/6
          <br />
          <span className="text-muted">where u = f x ln(2), f = fractional half-lives elapsed</span>
        </div>
      </motion.div>

      {/* Interaction Weights */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-4 tracking-tight">Interaction Weights</h3>
        <div className="space-y-2">
          {weights.map((w, i) => (
            <motion.div
              key={w.type}
              className="flex items-center gap-4 p-3.5 rounded-xl"
              style={{ background: `${w.color}06`, borderLeft: `3px solid ${w.color}` }}
              {...fadeX(-12, 0.05 + i * 0.06)}
            >
              <span
                className="text-xl font-bold font-mono value-highlight"
                style={{ color: w.color, minWidth: 55, textShadow: `0 0 16px ${w.color}30` }}
              >
                {w.weight}
              </span>
              <div>
                <p className="text-sm font-medium">{w.type}</p>
                <p className="text-xs text-muted">{w.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* x402 Payment Flow */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <CreditCard className="w-4 h-4 text-primary" />
          x402 Payment Flow
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Every agent discovery query requires a micropayment of{" "}
          <code className="text-accent font-mono font-medium">0.001 PAS</code>.
          The payment is a direct transfer to the owner wallet -- not a contract call --
          keeping gas costs at a flat 21,000 gas. The server verifies the tx hash
          before granting a 5-minute search pass.
        </p>
        <div className="arch-pipeline">
          {paymentFlowSteps.map((step, i) => (
            <div key={step.title} className="arch-pipeline-row">
              <motion.div
                className="arch-pipeline-step"
                style={{ background: `${step.color}08`, border: `1px solid ${step.color}20` }}
                {...fadeUp(0.05 + i * 0.06)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${step.color}15`, boxShadow: `0 0 12px ${step.color}20` }}
                >
                  <step.icon className="w-4 h-4" style={{ color: step.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: step.color }}>{step.title}</p>
                  <p className="text-[10px] text-muted">{step.desc}</p>
                </div>
              </motion.div>
              {i < paymentFlowSteps.length - 1 && (
                <div className="arch-pipeline-arrow">
                  <ChevronRight className="w-3.5 h-3.5 text-muted arch-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Score Blending Pipeline */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <BarChart3 className="w-4 h-4" style={{ color: "#6366F1" }} />
          Score Blending Pipeline
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Agent rankings are computed by blending two independent scoring axes.
          The damping factor (0.55) favors semantic relevance, while on-chain
          reputation provides a Sybil-resistant trust anchor:
        </p>
        <div className="code-block text-center mb-5">
          <code className="text-sm font-mono text-foreground">
            finalScore = <span style={{ color: "#6366F1" }}>0.55</span> * geminiScore +{" "}
            <span style={{ color: "#00E6A0" }}>0.45</span> * chainNorm *{" "}
            <span style={{ color: "#EF4444" }}>sybilMul</span>
          </code>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            className="rounded-xl p-4"
            style={{ background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.18)" }}
            {...fadeX(-12, 0.1)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4" style={{ color: "#6366F1" }} />
              <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>Gemini AI -- 55%</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed mb-2">
              Gemini 2.5 Flash evaluates each agent&apos;s profile description against
              the user&apos;s natural language query. Returns a 0.0-1.0 relevancy score
              with reasoning.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
                <div className="h-full rounded-full arch-bar-fill" style={{ background: "#6366F1", width: "55%" }} />
              </div>
              <span className="text-[10px] font-mono" style={{ color: "#6366F1" }}>0.55</span>
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl p-4"
            style={{ background: "rgba(0, 230, 160, 0.06)", border: "1px solid rgba(0, 230, 160, 0.18)" }}
            {...fadeX(12, 0.15)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" style={{ color: "#00E6A0" }} />
              <span className="text-xs font-semibold" style={{ color: "#00E6A0" }}>On-Chain Trust -- 45%</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed mb-2">
              Raw reputation score from the Rust/PolkaVM math engine, normalized
              across the result set (0-1). Multiplied by the Sybil defense
              multiplier (0.4x or 1.0x).
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(0, 230, 160, 0.15)" }}>
                <div className="h-full rounded-full arch-bar-fill" style={{ background: "#00E6A0", width: "45%" }} />
              </div>
              <span className="text-[10px] font-mono" style={{ color: "#00E6A0" }}>0.45</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Sybil Defense */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <AlertTriangle className="w-4 h-4" style={{ color: "#F5A623" }} />
          Sybil Defense System
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Valence detects self-dealing by analyzing the distribution of
          interaction senders for each agent. If a single address accounts for
          more than 60% of an agent&apos;s total interactions, the agent is flagged
          and penalized:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(0, 230, 160, 0.05)", border: "1px solid rgba(0, 230, 160, 0.18)" }}
            {...fadeUp(0.1)}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0, 230, 160, 0.12)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#00E6A0" }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#00E6A0" }}>Clean Agent</p>
              <p className="text-[10px] text-muted leading-relaxed mb-2">
                Diverse interaction sources. No single sender dominates the interaction history.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono" style={{ color: "#00E6A0" }}>1.0x</span>
                <span className="text-[10px] text-muted">multiplier applied</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.18)" }}
            {...fadeUp(0.15)}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239, 68, 68, 0.12)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#EF4444" }}>Sybil Flagged</p>
              <p className="text-[10px] text-muted leading-relaxed mb-2">
                One address provides &gt;60% of interactions. Likely self-dealing or coordinated gaming.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono" style={{ color: "#EF4444" }}>0.4x</span>
                <span className="text-[10px] text-muted">penalty multiplier</span>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="code-block text-center mt-4">
          <code className="text-xs font-mono text-foreground">
            <span className="text-muted">if</span>{" "}
            <span style={{ color: "#F5A623" }}>maxSenderCount</span> /{" "}
            <span style={{ color: "#8B5CF6" }}>totalInteractions</span>{" "}
            <span className="text-muted">&gt;</span>{" "}
            <span style={{ color: "#EF4444" }}>0.6</span>{" "}
            <span className="text-muted">then</span>{" "}
            <span style={{ color: "#EF4444" }}>sybilMultiplier = 0.4</span>
          </code>
        </div>
      </motion.div>

      {/* End-to-End Data Flow */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <Link2 className="w-4 h-4 text-primary" />
          End-to-End Data Flow
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          The complete journey of a user query through all three layers of the
          Valence stack -- from natural language input to ranked agent results:
        </p>
        <div className="arch-flow-vertical">
          {dataFlowNodes.map((node, i) => (
            <div key={node.label}>
              <motion.div
                className="arch-flow-node"
                style={{ background: `${node.color}06`, border: `1px solid ${node.color}20` }}
                {...fadeX(i % 2 === 0 ? -14 : 14, 0.04 + i * 0.05)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${node.color}12`, boxShadow: `0 0 10px ${node.color}15` }}
                >
                  <node.icon className="w-4 h-4" style={{ color: node.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: node.color }}>{node.label}</p>
                  <p className="text-[10px] text-muted">{node.sublabel}</p>
                </div>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-md ml-auto flex-shrink-0"
                  style={{ background: `${node.color}10`, color: node.color, border: `1px solid ${node.color}15` }}
                >
                  {i + 1}
                </span>
              </motion.div>
              {i < dataFlowNodes.length - 1 && (
                <div className="arch-flow-connector">
                  <div className="arch-flow-connector-dot arch-pulse" style={{ background: node.color }} />
                  <div className="arch-flow-connector-line" style={{ background: `${node.color}30` }} />
                  <ArrowDown className="w-3 h-3 arch-bounce-sm" style={{ color: node.color, opacity: 0.5 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Live Deployment */}
      <motion.div className="glass-card-premium p-5" {...fadeUp()}>
        <h3 className="font-semibold mb-3 flex items-center gap-2 tracking-tight">
          <Server className="w-4 h-4 text-accent" />
          Live Deployment
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          All contracts are deployed on the{" "}
          <span className="text-accent font-medium">Polkadot Hub TestNet</span>
          {" "}and verifiable on Blockscout. Connect with Talisman or any
          EVM-compatible wallet:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <motion.div
            className="rounded-xl p-4"
            style={{ background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.18)" }}
            {...fadeUp(0.1)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
              <span className="text-xs font-semibold" style={{ color: "#8B5CF6" }}>ValenceProtocol.sol</span>
            </div>
            <a
              href={`https://blockscout-testnet.polkadot.io/address/${SOLIDITY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-mono text-muted hover:text-foreground transition-colors group"
            >
              <span className="truncate">{SOLIDITY_ADDRESS}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
            </a>
          </motion.div>
          <motion.div
            className="rounded-xl p-4"
            style={{ background: "rgba(0, 230, 160, 0.05)", border: "1px solid rgba(0, 230, 160, 0.18)" }}
            {...fadeUp(0.15)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-3.5 h-3.5" style={{ color: "#00E6A0" }} />
              <span className="text-xs font-semibold" style={{ color: "#00E6A0" }}>DecayMath.polkavm</span>
            </div>
            <a
              href={`https://blockscout-testnet.polkadot.io/address/${RUST_PVM_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-mono text-muted hover:text-foreground transition-colors group"
            >
              <span className="truncate">{RUST_PVM_ADDRESS}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
            </a>
          </motion.div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Chain ID", value: "420420421", color: "#8B5CF6" },
            { label: "Currency", value: "PAS", color: "#E6007A" },
            { label: "RPC", value: "eth-rpc-testnet", color: "#00E6A0" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="rounded-lg p-3 text-center"
              style={{ background: `${item.color}05`, border: `1px solid ${item.color}12` }}
              {...fadeUp(0.2 + i * 0.06)}
            >
              <p className="text-[10px] text-muted mb-1">{item.label}</p>
              <p className="text-xs font-mono font-semibold" style={{ color: item.color }}>{item.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
