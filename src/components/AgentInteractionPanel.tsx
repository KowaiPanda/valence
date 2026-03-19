"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ThumbsUp, ThumbsDown, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import {
  useRecordInteraction,
  type InteractionType,
  INTERACTION_STATUS_LABELS,
} from "@/hooks/useRecordInteractions.wagmi";

interface AgentInteractionPanelProps {
  agentAddress: `0x${string}`;
  // Called after a successful interaction so parent can refresh agent data
  onSuccess?: (agentAddress: string, interactionType: InteractionType) => void;
}

const INTERACTIONS: {
  type: InteractionType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    type: 1,
    label: "x402 Pay",
    sublabel: "0.001 PAS",
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "#00E6A0",
    border: "rgba(0,230,160,0.25)",
    bg: "rgba(0,230,160,0.06)",
  },
  {
    type: 2,
    label: "Positive",
    sublabel: "+1.2 trust",
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    color: "#8B5CF6",
    border: "rgba(139,92,246,0.25)",
    bg: "rgba(139,92,246,0.06)",
  },
  {
    type: 3,
    label: "Negative",
    sublabel: "-1.0 trust",
    icon: <ThumbsDown className="w-3.5 h-3.5" />,
    color: "#F59E0B",
    border: "rgba(245,158,11,0.25)",
    bg: "rgba(245,158,11,0.06)",
  },
];

const EXPLORER_BASE = "https://blockscout-testnet.polkadot.io/tx";

export default function AgentInteractionPanel({
  agentAddress,
  onSuccess,
}: AgentInteractionPanelProps) {
  const { recordInteraction, status, error, lastTxHash, lastType, reset } =
    useRecordInteraction();

  const isBusy = status === "switching_chain" ||
    status === "awaiting_confirmation" ||
    status === "confirming";

  // Notify parent on success
  useEffect(() => {
    if (status === "done" && lastType) {
      onSuccess?.(agentAddress, lastType);
    }
  }, [status, lastType, agentAddress, onSuccess]);

  // Auto-reset after 6 seconds on done/error so buttons reappear
  useEffect(() => {
    if (status === "done" || status === "error") {
      const t = setTimeout(reset, 6000);
      return () => clearTimeout(t);
    }
  }, [status, reset]);

  return (
    <div className="mt-4">
      <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2">
        Record interaction
      </p>

      <AnimatePresence mode="wait">
        {/* Busy state */}
        {isBusy && (
          <motion.div
            key="busy"
            className="flex items-center gap-2 text-xs text-muted py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            {INTERACTION_STATUS_LABELS[status]}
          </motion.div>
        )}

        {/* Success state */}
        {status === "done" && (
          <motion.div
            key="done"
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: "#00E6A0" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Interaction recorded on-chain — reputation score updated
            </div>
            {lastTxHash && (
              <a
                href={`${EXPLORER_BASE}/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-mono hover:opacity-80 transition-opacity"
                style={{ color: "#8B5CF6" }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                {lastTxHash.slice(0, 20)}...
              </a>
            )}
          </motion.div>
        )}

        {/* Error state */}
        {status === "error" && (
          <motion.div
            key="error"
            className="text-xs py-1"
            style={{ color: "#F59E0B" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {error ?? "Transaction failed"}
          </motion.div>
        )}

        {/* Default: buttons */}
        {(status === "idle") && (
          <motion.div
            key="buttons"
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {INTERACTIONS.map((ix) => (
              <button
                key={ix.type}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  recordInteraction(agentAddress, ix.type);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 active:scale-95"
                style={{
                  color: ix.color,
                  border: `1px solid ${ix.border}`,
                  background: ix.bg,
                }}
              >
                {ix.icon}
                <span>{ix.label}</span>
                <span
                  className="text-[10px] font-normal"
                  style={{ opacity: 0.7 }}
                >
                  {ix.sublabel}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}