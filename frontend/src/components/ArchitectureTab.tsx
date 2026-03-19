"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Code2,
  Globe,
  ExternalLink,
  Layers,
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
    bgColor: "rgba(0, 230, 160, 0.08)",
    borderColor: "rgba(0, 230, 160, 0.2)",
    address: RUST_PVM_ADDRESS,
    description:
      "ink! v6 Rust smart contract compiled to RISC-V bytecode (.polkavm). Calculates complex exponential decay math and reputation scores at native speed. EVM cannot handle floating-point math efficiently — PolkaVM can.",
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
    bgColor: "rgba(139, 92, 246, 0.08)",
    borderColor: "rgba(139, 92, 246, 0.2)",
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
    bgColor: "rgba(230, 0, 122, 0.08)",
    borderColor: "rgba(230, 0, 122, 0.2)",
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
    desc: "Real economic commitment — highest signal of trust",
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
    desc: "Penalty signal — reduces agent reputation",
  },
];

export default function ArchitectureTab() {
  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-1">
      {/* Title */}
      <div className="text-center py-4">
        <motion.div
          className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full text-xs font-medium"
          style={{
            border: "1px solid rgba(139, 92, 246, 0.3)",
            background: "rgba(139, 92, 246, 0.08)",
            color: "#8B5CF6",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Layers className="w-3 h-3" />
          Cross-VM Interoperability
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">How Valence Works</h2>
        <p className="text-sm text-muted max-w-lg mx-auto">
          A masterclass in cross-VM interoperability on Polkadot (pallet-revive).
          Rust handles the math, Solidity handles the payments, and Node.js
          handles the intelligence.
        </p>
      </div>

      {/* 3-Layer Architecture */}
      <div className="space-y-4">
        {layers.map((layer, idx) => (
          <motion.div
            key={layer.title}
            className="glass-card p-5"
            style={{ borderColor: layer.borderColor }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: layer.bgColor }}
              >
                <layer.icon className="w-6 h-6" style={{ color: layer.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold" style={{ color: layer.color }}>
                    {layer.title}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-surface-light text-muted">
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
                      className="flex items-center gap-1.5 text-xs text-foreground/70"
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: layer.color }}
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
                    Coming soon — Phase 2
                  </span>
                )}
              </div>
            </div>

            {/* Arrow between layers */}
            {idx < layers.length - 1 && (
              <div className="flex justify-center mt-4">
                <div className="flex flex-col items-center gap-1 text-muted">
                  <div
                    className="w-px h-4"
                    style={{ background: layer.color, opacity: 0.3 }}
                  />
                  <ArrowRight
                    className="w-4 h-4 rotate-90"
                    style={{ color: layer.color, opacity: 0.5 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Cross-VM Bridge Detail */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          The Cross-VM Bridge
        </h3>
        <p className="text-xs text-muted mb-4">
          When <code className="text-purple font-mono">getAgentReputation()</code>{" "}
          is called, Solidity manually encodes the data into SCALE format and
          fires a <code className="text-purple font-mono">staticcall</code> to the
          Rust contract on PolkaVM:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
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
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-xl p-3 text-center"
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}20`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg mx-auto mb-2 flex items-center justify-center text-xs font-bold"
                style={{ background: `${s.color}20`, color: s.color }}
              >
                {s.step}
              </div>
              <p className="text-xs font-medium mb-1">{s.title}</p>
              <p className="text-[10px] text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Decay Formula */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Reputation Decay Model</h3>
        <div className="rounded-xl p-4 bg-surface text-center mb-4">
          <code className="text-lg font-mono text-foreground">
            score += weight × 2<sup>−t / 30 days</sup>
          </code>
        </div>
        <p className="text-xs text-muted mb-4">
          Each interaction&apos;s impact decays exponentially with a 30-day half-life.
          The Taylor series approximation for 2<sup>−f</sup> is computed
          entirely in fixed-point arithmetic inside PolkaVM:
        </p>
        <div className="rounded-xl p-3 bg-surface font-mono text-xs text-accent leading-relaxed">
          e<sup>−u</sup> ≈ 1 − u + u²/2 − u³/6
          <br />
          <span className="text-muted">where u = f × ln(2), f = fractional half-lives elapsed</span>
        </div>
      </div>

      {/* Interaction Weights */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Interaction Weights</h3>
        <div className="space-y-2">
          {weights.map((w) => (
            <div
              key={w.type}
              className="flex items-center gap-4 p-3 rounded-xl"
              style={{
                background: `${w.color}08`,
                borderLeft: `3px solid ${w.color}`,
              }}
            >
              <span
                className="text-lg font-bold font-mono"
                style={{ color: w.color, minWidth: 50 }}
              >
                {w.weight}
              </span>
              <div>
                <p className="text-sm font-medium">{w.type}</p>
                <p className="text-xs text-muted">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
