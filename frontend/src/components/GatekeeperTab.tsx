"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Search, X, Zap, ArrowRight } from "lucide-react";

interface GatekeeperTabProps {
  onSearchComplete: () => void;
}

export default function GatekeeperTab({ onSearchComplete }: GatekeeperTabProps) {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [typingHash, setTypingHash] = useState("");

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    if (unlocked) {
      addLog(`Searching for: "${query}" with valid x-l402-tx-hash header...`);
      addLog("402 Gate PASSED — Agent has valid payment proof.");
      addLog("Forwarding to Discovery Engine...");
      setTimeout(() => {
        addLog("Discovery results received. Switching to Leaderboard tab.");
        onSearchComplete();
      }, 1200);
      return;
    }
    setShowModal(true);
    addLog(`Search attempt blocked: "${query}"`);
    addLog("HTTP 402 — Payment Required. No valid x-l402-tx-hash header.");
  };

  const simulatePayment = async () => {
    setSimulating(true);
    addLog("Initiating x402 micropayment on Polkadot EVM...");

    // Generate a fake tx hash with a typewriter effect
    const fakeTxHash =
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

    // Typewriter effect for the tx hash
    for (let i = 0; i <= fakeTxHash.length; i++) {
      await new Promise((r) => setTimeout(r, 25));
      setTypingHash(fakeTxHash.slice(0, i));
    }

    addLog(`Transaction submitted: ${fakeTxHash.slice(0, 16)}...`);
    await new Promise((r) => setTimeout(r, 600));
    addLog("Block confirmed on Polkadot EVM Testnet!");
    await new Promise((r) => setTimeout(r, 400));
    addLog("Payment verified: 0.001 PAS deducted.");
    await new Promise((r) => setTimeout(r, 300));
    addLog("x-l402-tx-hash header injected into request.");

    setTxHash(fakeTxHash);
    setSimulating(false);
    setShowModal(false);
    setUnlocked(true);
    addLog("GATE UNLOCKED — Agent authorized for discovery.");
  };

  // Auto-scroll logs
  useEffect(() => {
    const el = document.getElementById("gatekeeper-logs");
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Hero Section */}
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
        <h2 className="text-2xl font-bold mb-2">
          The Gatekeeper
        </h2>
        <p className="text-muted text-sm max-w-md mx-auto">
          Every API call on the Valence network requires a micropayment on
          Polkadot&apos;s EVM layer. No payment, no access.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto w-full">
        <div
          className={`glass-card flex items-center gap-3 px-4 py-3 transition-all ${
            unlocked ? "border-accent/40" : ""
          }`}
        >
          <motion.div
            className={unlocked ? "padlock-unlocking" : ""}
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
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

        {/* Unlocked Success Banner */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Architecture Flow Diagram */}
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

      {/* System Logs Terminal */}
      <div className="flex-1 min-h-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-negative/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-trust-low/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
          </div>
          <span className="text-xs text-muted font-mono">system_logs</span>
        </div>
        <div
          id="gatekeeper-logs"
          className="terminal h-[180px]"
        >
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

      {/* 402 Payment Modal */}
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
                  onClick={() => setShowModal(false)}
                  className="text-muted hover:text-foreground transition-colors"
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
                  <span className="text-2xl font-bold gradient-text">
                    0.001 PAS
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">Network:</span>
                  <span className="text-xs text-accent">Polkadot EVM Testnet</span>
                </div>
              </div>

              {/* Typing Tx Hash */}
              {simulating && typingHash && (
                <div className="rounded-xl p-3 mb-4 bg-surface font-mono text-xs break-all text-accent">
                  <span className="text-muted">tx_hash: </span>
                  {typingHash}
                  <span className="typewriter-cursor" />
                </div>
              )}

              <button
                onClick={simulatePayment}
                disabled={simulating}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{
                  background: simulating
                    ? "rgba(139, 92, 246, 0.3)"
                    : "linear-gradient(135deg, #E6007A, #8B5CF6)",
                }}
              >
                {simulating ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="inline-block"
                    >
                      ⟳
                    </motion.span>
                    Processing Payment...
                  </span>
                ) : (
                  "Simulate Agent Payment"
                )}
              </button>

              <p className="text-[10px] text-muted text-center mt-3">
                This simulates an on-chain x402 payment. In production, the
                agent&apos;s wallet signs a real transaction.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
