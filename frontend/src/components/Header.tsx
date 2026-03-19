"use client";

import { motion } from "framer-motion";
import { Shield, ExternalLink } from "lucide-react";
import { SOLIDITY_ADDRESS, truncateAddress } from "@/lib/contract";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      {/* Logo + Tagline */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #E6007A, #8B5CF6)",
          }}
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Shield className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text">
            VALENCE
          </h1>
          <p className="text-xs text-muted leading-none">
            Decentralized Trust for AI Agents
          </p>
        </div>
      </div>

      {/* Right side: Contract + Network */}
      <div className="flex items-center gap-4">
        <a
          href={`https://blockscout-testnet.polkadot.io/address/${SOLIDITY_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
        >
          <span className="font-mono">{truncateAddress(SOLIDITY_ADDRESS)}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <div className="network-badge">
          <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
          <span>Polkadot EVM Testnet</span>
        </div>
      </div>
    </header>
  );
}
