"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Search, X, Zap, ArrowRight, Check, CreditCard, Shield, Cpu } from "lucide-react";
import { useAccount } from "wagmi";
import {
  useSearchWithPayment,
  type SearchMeta,
  type SearchResult,
} from "@/hooks/useSearchWithPayment.wagmi";
import { getMicropaymentFee } from "@/lib/contract";

interface GatekeeperTabProps {
  onSearchComplete: (query: string, results: SearchResult[], meta?: SearchMeta) => void;
}

const STEPS = [
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "confirming", label: "Confirming", icon: Shield },
  { key: "verifying", label: "Verified", icon: Check },
  { key: "searching", label: "Searching", icon: Cpu },
];

function getStepState(status: string, stepKey: string): "inactive" | "active" | "completed" {
  const order = ["payment", "confirming", "verifying", "searching"];
  const statusMap: Record<string, string> = {
    idle: "",
    switching_chain: "payment",
    awaiting_payment: "payment",
    confirming: "confirming",
    verifying: "verifying",
    searching: "searching",
    done: "done",
    error: "",
  };
  const currentStep = statusMap[status] || "";
  const stepIdx = order.indexOf(stepKey);
  const currentIdx = currentStep === "done" ? order.length : order.indexOf(currentStep);
  if (currentIdx < 0) return "inactive";
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "active";
  return "inactive";
}

export default function GatekeeperTab({ onSearchComplete }: GatekeeperTabProps) {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [micropaymentFee, setMicropaymentFee] = useState("0.001");
  const [copied, setCopied] = useState(false);

  const { address, isConnected } = useAccount();
  const { search, status, txHash, error, reset, results, searchMeta } = useSearchWithPayment();

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  useEffect(() => {
    let active = true;
    getMicropaymentFee().then((fee) => {
      if (active && fee) setMicropaymentFee(fee);
    });
    return () => {
      active = false;
    };
  }, []);

  // Mirror hook status into logs
  useEffect(() => {
    if (status === "switching_chain") {
      addLog("Switching to Polkadot EVM network...");
    } else if (status === "awaiting_payment") {
      addLog(`Initiating x402 micropayment on Polkadot EVM...`);
      addLog("HTTP 402 -- Payment Required. Awaiting wallet confirmation.");
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
      addLog("GATE UNLOCKED -- Agent authorized for discovery.");
      addLog(`Searching for: "${query}" with valid x-l402-tx-hash header...`);
      addLog("402 Gate PASSED -- Agent has valid payment proof.");
      addLog("Forwarding to Discovery Engine...");
    } else if (status === "done") {
      addLog("Discovery results received. Switching to Leaderboard tab.");
      if (results.length === 0) {
        addLog("No agents found for this query.");
      }
      setUnlocked(true);
      setShowModal(false);
      setTimeout(() => onSearchComplete(query, results, searchMeta), 800);
    } else if (status === "error" && error) {
      addLog(`Error: ${error}`);
      setShowModal(false);
    }
  }, [status, txHash, error, query, results, searchMeta, onSearchComplete, addLog]);

  const copyTxHash = useCallback(async () => {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }, [txHash]);

  const errorLabel =
    !error
      ? null
      : error.toLowerCase().includes("payment") || error.toLowerCase().includes("transaction")
      ? "Payment failed"
      : error.toLowerCase().includes("gemini")
      ? "Gemini unavailable"
      : "Search failed";

  const handleSearch = () => {
    if (!query.trim()) return;

    if (!isConnected) {
      addLog("No wallet connected. Please connect your wallet first.");
      return;
    }

    setUnlocked(false);
    setShowModal(true);
    addLog(`Search attempt blocked: "${query}"`);
    addLog("HTTP 402 -- Payment Required. No valid x-l402-tx-hash header.");
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

  const showStepper = isProcessing || status === "done";

  // Auto-scroll logs
  useEffect(() => {
    const el = document.getElementById("gatekeeper-logs");
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Hero Section */}
      <div className="text-center py-5">
        <motion.div
          className="badge inline-flex mb-4"
          style={{
            borderColor: "rgba(230, 0, 122, 0.25)",
            background: "rgba(230, 0, 122, 0.06)",
            color: "#E6007A",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Zap className="w-3 h-3" />
          x402 Payment Protocol
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">The Gatekeeper</h2>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Every API call on the Valence network requires a micropayment on
          Polkadot&apos;s EVM layer. No payment, no access.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto w-full">
        <div
          className={`glass-card-premium flex items-center gap-3 px-5 py-3.5 transition-all ${
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
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/50"
            placeholder="Find me a DeFi agent for yield optimization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              background: unlocked
                ? "linear-gradient(135deg, #00E6A0, #00B880)"
                : "linear-gradient(135deg, #E6007A, #8B5CF6)",
              color: "#fff",
              boxShadow: unlocked
                ? "0 4px 20px rgba(0, 230, 160, 0.2)"
                : "0 4px 20px rgba(230, 0, 122, 0.2)",
            }}
          >
            <Search className="w-4 h-4" />
            {unlocked ? "Search" : `Search (${micropaymentFee} PAS)`}
          </button>
        </div>

        {/* Unlocked Success Banner */}
        <AnimatePresence>
          {unlocked && txHash && (
            <motion.div
              className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-xs"
              style={{
                background: "rgba(0, 230, 160, 0.06)",
                border: "1px solid rgba(0, 230, 160, 0.15)",
              }}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0 }}
            >
              <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
              <span className="text-accent font-semibold">Gate Unlocked</span>
              <span className="text-muted font-mono truncate flex-1 text-[11px]">
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
              <button
                onClick={copyTxHash}
                className="text-accent underline shrink-0"
              >
                {copied ? "copied" : "copy"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Architecture Flow */}
      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-center justify-center gap-2 text-xs text-muted py-3">
          {[
            { label: "Agent", sub: "Sends query", color: "var(--color-foreground)" },
            null,
            { label: "x402 Gate", sub: `${micropaymentFee} PAS`, color: "var(--color-primary)" },
            null,
            { label: "Valence API", sub: "Discovery", color: "var(--color-accent)" },
          ].map((item, i) =>
            item === null ? (
              <ArrowRight key={`arrow-${i}`} className="w-3.5 h-3.5 text-muted flow-dot" />
            ) : (
              <div
                key={item.label}
                className="glass-card px-4 py-2.5 text-center"
                style={{
                  borderColor: item.color === "var(--color-foreground)" ? undefined : `${item.color}30`,
                }}
              >
                <p className="font-semibold text-[11px]" style={{ color: item.color }}>
                  {item.label}
                </p>
                <p className="text-[10px] text-muted mt-0.5">{item.sub}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* System Logs Terminal */}
      <div className="flex-1 min-h-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239, 68, 68, 0.5)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(245, 158, 11, 0.5)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(0, 230, 160, 0.5)" }} />
          </div>
          <span className="text-[11px] text-muted" style={{ fontFamily: "var(--font-mono), monospace" }}>
            system_logs
          </span>
        </div>
        <div id="gatekeeper-logs" className="terminal h-[180px]">
          {logs.length === 0 ? (
            <p className="text-muted/30 italic">
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #E6007A, #8B5CF6)",
                      boxShadow: "0 0 24px rgba(230, 0, 122, 0.2)",
                    }}
                  >
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg tracking-tight">402 Payment Required</h3>
                    <p className="text-[11px] text-muted">Valence Protocol Gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); reset(); }}
                  disabled={isProcessing}
                  className="text-muted hover:text-foreground transition-colors disabled:opacity-30 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Stepper */}
              {showStepper && (
                <div className="stepper mb-6">
                  {STEPS.map((step, i) => {
                    const state = getStepState(status, step.key);
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="contents">
                        <div className={`stepper-step ${state}`}>
                          <div className="stepper-dot">
                            {state === "completed" ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <StepIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="stepper-label">{step.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`stepper-line ${state === "completed" ? "completed" : ""}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fee Info */}
              <div
                className="rounded-xl p-4 mb-5"
                style={{
                  background: "rgba(230, 0, 122, 0.04)",
                  border: "1px solid rgba(230, 0, 122, 0.12)",
                }}
              >
                <p className="text-sm text-muted mb-3 leading-relaxed">
                  This discovery query requires a micropayment to prevent spam
                  and establish economic stake.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Fee:</span>
                  <span className="text-2xl font-bold gradient-text">{micropaymentFee} PAS</span>
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

              {/* Live tx hash while confirming */}
              {txHash && (
                <div className="rounded-xl p-3 mb-4 code-block text-xs text-accent">
                  <p className="break-all">
                    <span className="text-muted">tx_hash: </span>
                    {txHash}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={copyTxHash} className="underline">
                      {copied ? "Copied" : "Copy tx hash"}
                    </button>
                    <a
                      href={`https://blockscout-testnet.polkadot.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Open in Blockscout
                    </a>
                  </div>
                </div>
              )}

              {/* Error state */}
              {status === "error" && error && (
                <div className="rounded-xl p-3 mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 space-y-1">
                  {errorLabel && (
                    <p className="font-semibold">{errorLabel}</p>
                  )}
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={isProcessing || !isConnected}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{
                  background: isProcessing
                    ? "rgba(139, 92, 246, 0.25)"
                    : "linear-gradient(135deg, #E6007A, #8B5CF6)",
                  boxShadow: isProcessing
                    ? "none"
                    : "0 4px 24px rgba(230, 0, 122, 0.2)",
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
                      &#10227;
                    </motion.span>
                    {processingLabel[status] ?? "Processing..."}
                  </span>
                ) : status === "error" ? (
                  "Try Again"
                ) : (
                  `Pay ${micropaymentFee} PAS to Unlock`
                )}
              </button>

              <p className="text-[10px] text-muted text-center mt-3 leading-relaxed">
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