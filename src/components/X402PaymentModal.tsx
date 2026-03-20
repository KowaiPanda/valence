"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  ExternalLink,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Check,
} from "lucide-react";
import type { InteractionStatus } from "@/hooks/useRecordInteractions.wagmi";

interface AgentService {
  label: string;
  fee: string;       // display only e.g. "0.05 PAS"
  feeNum: number;    // numeric for total display e.g. 0.05
}

interface X402PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentAddress: `0x${string}`;
  agentName: string;
  agentProfile: string;
  onConfirm: () => Promise<void>;
  status: InteractionStatus;
  error?: string | null;
  txHash?: `0x${string}` | null;
}

// Example services — replace with real agent metadata when available
const AGENT_SERVICE = { label: "AI agent task execution", fee: "0.05 PAS", feeNum: 0.05 };
const PROTOCOL_FEE = 0.001;
const TOTAL = (AGENT_SERVICE.feeNum + PROTOCOL_FEE).toFixed(3);
const EXPLORER_BASE = "https://blockscout-testnet.polkadot.io/tx";

export default function X402PaymentModal({
  isOpen,
  onClose,
  agentAddress,
  agentName,
  agentProfile,
  onConfirm,
  status,
  error,
  txHash,
}: X402PaymentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedService, setSelectedService] = useState<AgentService | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) setSelectedService(null);
  }, [isOpen]);

  const isBusy =
    status === "switching_chain" ||
    status === "awaiting_confirmation" ||
    status === "confirming" ||
    confirming;

  const totalDisplay = selectedService
    ? `${(selectedService.feeNum + PROTOCOL_FEE).toFixed(3)} PAS`
    : `${PROTOCOL_FEE} PAS`;

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBusy) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            style={{
              width: "100%",
              maxWidth: 460,
              margin: "0 16px",
              background: "var(--color-surface, #16112a)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 16,
              overflow: "hidden",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header*/}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "var(--color-surface, #16112a)",
                zIndex: 1,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Zap style={{ width: 16, height: 16, color: "#00E6A0" }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-foreground)" }}>
                    x402 Payment
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5 }}>
                  Hiring{" "}
                  <span style={{ color: "var(--color-foreground)", fontWeight: 500 }}>
                    {agentName}
                  </span>
                </p>
              </div>
              {!isBusy && status !== "done" && (
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-muted)",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                  }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>

            <div style={{ padding: "20px 24px" }}>

              {/*Agent info*/}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 20,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p style={{ fontSize: 11, color: "var(--color-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Agent
                </p>
                <p style={{ fontSize: 13, color: "var(--color-foreground)", fontWeight: 500, marginBottom: 2 }}>
                  {agentName}
                </p>
                <p style={{ fontSize: 11, color: "var(--color-muted)", fontFamily: "monospace", marginBottom: 6 }}>
                  {agentAddress.slice(0, 18)}...{agentAddress.slice(-6)}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5 }}>
                  {agentProfile.slice(0, 120)}{agentProfile.length > 120 ? "..." : ""}
                </p>
              </div>

              {/* Service selector */}
              <div
                style={{
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    marginBottom: 20,
                }}
                >
                {/* Agent service row */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <div>
                    <p style={{ fontSize: 12, color: "var(--color-foreground)", opacity: 0.8 }}>
                        {AGENT_SERVICE.label}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 1 }}>
                        Paid directly to agent on delivery
                    </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: "#8B5CF6" }}>
                    {AGENT_SERVICE.fee}
                    </span>
                </div>

                {/* Protocol fee row */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "rgba(0,230,160,0.03)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Zap style={{ width: 11, height: 11, color: "#00E6A0" }} />
                        <p style={{ fontSize: 12, color: "#00E6A0" }}>Valence protocol fee</p>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(0,230,160,0.5)", marginTop: 1 }}>
                        Recorded on-chain · +2.0 trust · 30-day decay
                    </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: "#00E6A0" }}>
                    0.001 PAS
                    </span>
                </div>

                {/* Total row */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>Total</p>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "var(--color-foreground)" }}>
                    {TOTAL} PAS
                    </span>
                </div>
                </div>

              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
              </div>

              {/* Status / confirm area */}
              <AnimatePresence mode="wait">
                {status === "done" ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#00E6A0", fontSize: 13 }}>
                      <CheckCircle2 style={{ width: 16, height: 16 }} />
                      Interaction recorded — reputation score updated
                    </div>
                    {txHash && (
                      <a
                        href={`${EXPLORER_BASE}/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: "#8B5CF6",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink style={{ width: 12, height: 12 }} />
                        View on Blockscout: {txHash.slice(0, 24)}...
                      </a>
                    )}
                    <button
                      onClick={onClose}
                      style={{
                        marginTop: 4,
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)",
                        color: "var(--color-foreground)",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Close
                    </button>
                  </motion.div>
                ) : isBusy ? (
                  <motion.div
                    key="busy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-muted)", fontSize: 13 }}
                  >
                    <Loader2 style={{ width: 15, height: 15, color: "#00E6A0" }} className="animate-spin" />
                    {status === "awaiting_confirmation"
                      ? "Confirm in Talisman..."
                      : status === "switching_chain"
                      ? "Switching network..."
                      : "Recording on-chain..."}
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "flex", flexDirection: "column", gap: 10 }}
                  >
                    {error && (
                      <p style={{ fontSize: 12, color: "#F59E0B" }}>{error}</p>
                    )}
                    <button
                      onClick={handleConfirm}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid rgba(0,230,160,0.3)",
                        background: "rgba(0,230,160,0.1)",
                        color: "#00E6A0",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.15s",
                      }}
                    >
                      <Zap style={{ width: 14, height: 14 }} />
                      Confirm — pay 0.001 PAS on-chain
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                    <p style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center" }}>
                      Only the protocol fee is collected now. Total shown is for reference.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}