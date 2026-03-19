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
} from "lucide-react";
import {
  SOLIDITY_ADDRESS,
  RUST_PVM_ADDRESS,
  truncateAddress,
} from "@/lib/contract";

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
  {
    step: "1",
    title: "Pack Selector",
    desc: "4-byte Rust function selector (0xb378d1e2)",
    color: "#8B5CF6",
  },
  {
    step: "2",
    title: "Encode SCALE",
    desc: "Flip to Little-Endian, pack interaction vector length",
    color: "#6366F1",
  },
  {
    step: "3",
    title: "staticcall",
    desc: "Fire raw bytes into PVM Rust contract address",
    color: "#E6007A",
  },
  {
    step: "4",
    title: "Decode Result",
    desc: "Parse Little-Endian int32 back to Big-Endian EVM format",
    color: "#00E6A0",
  },
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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
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
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.12 }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: layer.bgColor,
                    boxShadow: `0 0 20px ${layer.color}15`,
                  }}
                >
                  <layer.icon className="w-6 h-6" style={{ color: layer.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-semibold" style={{ color: layer.color }}>
                      {layer.title}
                    </h3>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                      style={{
                        background: `${layer.color}08`,
                        color: "var(--color-muted)",
                        border: `1px solid ${layer.color}15`,
                      }}
                    >
                      {layer.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-3">
                    {layer.description}
                  </p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {layer.highlights.map((h) => (
                      <div
                        key={h}
                        className="flex items-center gap-2 text-xs text-foreground/70"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            background: layer.color,
                            boxShadow: `0 0 4px ${layer.color}60`,
                          }}
                        />
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Contract Address */}
                  {layer.address && (
                    <a
                      href={`https://blockscout-testnet.polkadot.io/address/${layer.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-xs font-mono text-muted hover:text-foreground transition-colors"
                    >
                      {truncateAddress(layer.address)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!layer.address && (
                    <span className="inline-flex items-center gap-2 mt-3 text-xs text-muted italic">
                      Coming soon -- Phase 2
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Animated Connector Between Layers */}
            {idx < layers.length - 1 && (
              <div className="layer-connector">
                <div
                  className="layer-connector-line"
                  style={{ background: `${layer.color}40` }}
                />
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ArrowDown
                    className="w-4 h-4"
                    style={{ color: layer.color, opacity: 0.6 }}
                  />
                </motion.div>
                <div
                  className="layer-connector-line"
                  style={{ background: `${layers[idx + 1].color}40` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cross-VM Bridge Detail */}
      <div className="glass-card-premium p-5">
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
              style={{
                background: `${s.color}06`,
                border: `1px solid ${s.color}18`,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div
                className="w-8 h-8 rounded-lg mx-auto mb-2.5 flex items-center justify-center text-sm font-bold"
                style={{
                  background: `${s.color}15`,
                  color: s.color,
                  boxShadow: `0 0 12px ${s.color}15`,
                }}
              >
                {s.step}
              </div>
              <p className="text-xs font-semibold mb-1">{s.title}</p>
              <p className="text-[10px] text-muted leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decay Formula */}
      <div className="glass-card-premium p-5">
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
      </div>

      {/* Interaction Weights */}
      <div className="glass-card-premium p-5">
        <h3 className="font-semibold mb-4 tracking-tight">Interaction Weights</h3>
        <div className="space-y-2">
          {weights.map((w, i) => (
            <motion.div
              key={w.type}
              className="flex items-center gap-4 p-3.5 rounded-xl"
              style={{
                background: `${w.color}06`,
                borderLeft: `3px solid ${w.color}`,
              }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
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
      </div>
    </div>
  );
}
