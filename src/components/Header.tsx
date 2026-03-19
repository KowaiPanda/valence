"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SOLIDITY_ADDRESS, truncateAddress } from "@/lib/contract";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4" style={{ background: "rgba(6, 6, 14, 0.7)", backdropFilter: "blur(20px)" }}>
      {/* Logo + Tagline */}
      <div className="flex items-center gap-4">
        <motion.div
          className="w-12 h-12 flex items-center justify-center"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Image
            src="/logo.png"
            alt="Valence logo"
            width={34}
            height={34}
            className="object-contain"
            priority
          />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text">
            VALENCE
          </h1>
          <p className="text-[11px] text-muted leading-none mt-0.5 tracking-wide uppercase">
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
          className="hidden md:flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-light"
        >
          <span className="font-mono text-[11px]">{truncateAddress(SOLIDITY_ADDRESS)}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <div className="network-badge">
          <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
          <span>Polkadot EVM Testnet</span>
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
