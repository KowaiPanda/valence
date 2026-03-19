"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Search, X, Zap, ArrowRight } from "lucide-react";
import { useAccount } from "wagmi";
import {
  useSearchWithPayment,
  type SearchResult,
} from "@/hooks/useSearchWithPayment.wagmi";

interface GatekeeperTabProps {
  onSearchComplete: (query: string, results: SearchResult[]) => void;
}

export default function GatekeeperTab({ onSearchComplete }: GatekeeperTabProps) {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const { address, isConnected } = useAccount();
  const { search, status, txHash, error, reset, results } = useSearchWithPayment();

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Mirror hook status into logs — same messages as before
  useEffect(() => {
    if (status === "switching_chain") {
      addLog("Switching to Polkadot EVM network...");
    } else if (status === "awaiting_payment") {
      addLog(`Initiating x402 micropayment on Polkadot EVM...`);
      addLog("HTTP 402 — Payment Required. Awaiting wallet confirmation.");
    } else if (status === "confirming") {
      if (txHash) {
        addLog(`Transaction submitted: ${txHash.slice(0, 16)}...`);
        addLog("Waiting for block confirmation on Polkadot EVM Testnet...");
      }
    } else if (status === "verifying") {
      addLog("Block confirmed on Polkadot EVM Testnet!");
      addLog("Payment verified: 0.001 PAS deducted.");
      addLog("x-l402-tx-hash header injected into request.");
    } else if (status === "searching") {
      addLog("GATE UNLOCKED — Agent authorized for discovery.");
      addLog(`Searching for: "${query}" with valid x-l402-tx-hash header...`);
      addLog("402 Gate PASSED — Agent has valid payment proof.");
      addLog("Forwarding to Discovery Engine...");
    } else if (status === "done") {
      addLog("Discovery results received. Switching to Leaderboard tab.");
      setUnlocked(true);
      setShowModal(false);
      setTimeout(() => onSearchComplete(query, results), 800);
    } else if (status === "error" && error) {
      addLog(`Error: ${error}`);
      setShowModal(false);
    }
  }, [status, txHash, error, query, results, onSearchComplete, addLog]);

  const handleSearch = () => {
    if (!query.trim()) return;

    if (!isConnected) {
      addLog("No wallet connected. Please connect your wallet first.");
      return;
    }

    setUnlocked(false);
    setShowModal(true);
    addLog(`Search attempt blocked: "${query}"`);
    addLog("HTTP 402 — Payment Required. No valid x-l402-tx-hash header.");
  };

  const handlePay = async () => {
    if (!query.trim()) return;
    await search(query);
  };

  const isProcessing = [
    "switching_chain",
    "awaiting_payment",
    "confirming",
    "verifying",
    "searching",
  ].includes(status);

  const processingLabel: Record<string, string> = {
    switching_chain: "Switching Network...",
    awaiting_payment: "Confirm in Wallet...",
    confirming: "Confirming on Chain...",
    verifying: "Verifying Payment...",
    searching: "Processing...",
  };

  // Auto-scroll logs
  useEffect(() => {
    const el = document.getElementById("gatekeeper-logs");
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Hero Section — unchanged */}
      <div className="text-center py-6">
        <motion.div
          className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full text-xs font-medium"
          style={{
            border: "1px solid rgba(230, 0, 122, 0.3)",
            background: "rgba(230, 0, 122, 0.08)",
            color: "#E6007A",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Zap className="w-3 h-3" />
          x402 Payment Protocol
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">The Gatekeeper</h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Every API call on the Valence network requires a micropayment on
          Polkadot&apos;s EVM layer. No payment, no access.
        </p>
      </div>

      {/* Search Bar — unchanged */}
      <div className="max-w-xl mx-auto w-full">
        <div
          className={`glass-card flex items-center gap-3 px-4 py-3 transition-all ${
            unlocked ? "border-accent/40" : ""
          }`}
        >
          <motion.div
            animate={unlocked ? { rotate: [0, -15, 15, 0] } : {}}
          >
            {unlocked ? (
              <Unlock className="w-5 h-5 text-accent" />
            ) : (
              <Lock className="w-5 h-5 text-primary" />
            )}
          </motion.div>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/60"
            placeholder="Find me a DeFi agent for yield optimization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: unlocked
                ? "linear-gradient(135deg, #00E6A0, #00B880)"
                : "linear-gradient(135deg, #E6007A, #8B5CF6)",
              color: "#fff",
            }}
          >
            <Search className="w-4 h-4" />
            {unlocked ? "Search" : "Search (0.001 PAS)"}
          </button>
        </div>

        {/* Unlocked Success Banner — unchanged */}
        <AnimatePresence>
          {unlocked && txHash && (
            <motion.div
              className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-xs"
              style={{
                background: "rgba(0, 230, 160, 0.08)",
                border: "1px solid rgba(0, 230, 160, 0.2)",
              }}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0 }}
            >
              <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
              <span className="text-accent font-medium">Gate Unlocked</span>
              <span className="text-muted font-mono truncate flex-1">
                tx: {txHash.slice(0, 20)}...{txHash.slice(-8)}
              </span>
              <a
                href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline ml-2 shrink-0"
              >
                view
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Architecture Flow — unchanged */}
      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-center justify-center gap-2 text-xs text-muted py-4">
          <div className="glass-card px-3 py-2 text-center">
            <p className="font-medium text-foreground text-[11px]">Agent</p>
            <p className="text-[10px]">Sends query</p>
          </div>
          <ArrowRight className="w-3 h-3 text-primary" />
          <div className="glass-card px-3 py-2 text-center border-primary/30">
            <p className="font-medium text-primary text-[11px]">x402 Gate</p>
            <p className="text-[10px]">0.001 PAS</p>
          </div>
          <ArrowRight className="w-3 h-3 text-accent" />
          <div className="glass-card px-3 py-2 text-center border-accent/30">
            <p className="font-medium text-accent text-[11px]">Valence API</p>
            <p className="text-[10px]">Discovery</p>
          </div>
        </div>
      </div>

      {/* System Logs Terminal — unchanged */}
      <div className="flex-1 min-h-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-negative/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-trust-low/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
          </div>
          <span className="text-xs text-muted font-mono">system_logs</span>
        </div>
        <div id="gatekeeper-logs" className="terminal h-[180px]">
          {logs.length === 0 ? (
            <p className="text-muted/40 italic">
              System logs will appear here...
            </p>
          ) : (
            logs.map((line, i) => (
              <motion.div
                key={i}
                className="log-line"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {line}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 402 Payment Modal — same UI, real payment button */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #E6007A, #8B5CF6)",
                    }}
                  >
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">402 Payment Required</h3>
                    <p className="text-xs text-muted">Valence Protocol Gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); reset(); }}
                  disabled={isProcessing}
                  className="text-muted hover:text-foreground transition-colors disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className="rounded-xl p-4 mb-6"
                style={{
                  background: "rgba(230, 0, 122, 0.06)",
                  border: "1px solid rgba(230, 0, 122, 0.15)",
                }}
              >
                <p className="text-sm text-muted mb-3">
                  This discovery query requires a micropayment to prevent spam
                  and establish economic stake.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Fee:</span>
                  <span className="text-2xl font-bold gradient-text">0.001 PAS</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">Network:</span>
                  <span className="text-xs text-accent">Polkadot EVM Testnet</span>
                </div>
                {address && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted">From:</span>
                    <span className="text-xs font-mono text-foreground">
                      {address.slice(0, 10)}...{address.slice(-6)}
                    </span>
                  </div>
                )}
              </div>

              {/* Live tx hash while confirming — replaces the typewriter effect */}
              {txHash && (
                <div className="rounded-xl p-3 mb-4 bg-surface font-mono text-xs break-all text-accent">
                  <span className="text-muted">tx_hash: </span>
                  {txHash}
                </div>
              )}

              {/* Error state */}
              {status === "error" && error && (
                <div className="rounded-xl p-3 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20">
                  {error}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={isProcessing || !isConnected}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{
                  background: isProcessing
                    ? "rgba(139, 92, 246, 0.3)"
                    : "linear-gradient(135deg, #E6007A, #8B5CF6)",
                }}
              >
                {!isConnected ? (
                  "Connect wallet first"
                ) : isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="inline-block"
                    >
                      ⟳
                    </motion.span>
                    {processingLabel[status] ?? "Processing..."}
                  </span>
                ) : status === "error" ? (
                  "Try Again"
                ) : (
                  "Pay 0.001 PAS to Unlock"
                )}
              </button>

              <p className="text-[10px] text-muted text-center mt-3">
                This sends a real on-chain x402 payment via your connected wallet.
                The interaction is recorded on-chain and contributes to the trust graph.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}