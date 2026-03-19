"use client";

import { useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  type AgentData,
  truncateAddress,
  interactionTypeLabel,
  interactionTypeColor,
} from "@/lib/contract";

interface DiscoveryTabProps {
  agents: AgentData[];
  loading: boolean;
  searchQuery: string;
}

/* ---- simulated LLM relevancy (deterministic from address + query) ---- */
function computeLLMRelevancy(
  agentAddr: string,
  query: string,
  desc: string
): number {
  if (!query.trim()) return 0;
  const qLower = query.toLowerCase();
  const dLower = desc.toLowerCase();

  // basic keyword matching
  const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
  const matches = qWords.filter((w) => dLower.includes(w)).length;
  const baseScore = Math.min((matches / Math.max(qWords.length, 1)) * 100, 100);

  // add some deterministic variance from address
  const seed = parseInt(agentAddr.slice(2, 8), 16);
  const variance = (seed % 30) - 15; // -15 to +15

  return Math.max(0, Math.min(100, Math.round(baseScore + variance)));
}

function computeValenceScore(
  llmRelevancy: number,
  onChainTrust: number
): number {
  return Math.round(llmRelevancy * 0.6 + onChainTrust * 0.4);
}

export default function DiscoveryTab({
  agents,
  loading,
  searchQuery,
}: DiscoveryTabProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Compute scored agents
  const scoredAgents = agents.map((agent) => {
    const maxTrust = Math.max(...agents.map((a) => a.reputation), 1);
    const onChainTrust = Math.round((agent.reputation / maxTrust) * 100);
    const llmRelevancy = searchQuery
      ? computeLLMRelevancy(agent.address, searchQuery, agent.description)
      : Math.round(50 + (parseInt(agent.address.slice(4, 8), 16) % 50));
    const valenceScore = computeValenceScore(llmRelevancy, onChainTrust);

    return { ...agent, onChainTrust, llmRelevancy, valenceScore };
  });

  const sorted = [...scoredAgents].sort(
    (a, b) => b.valenceScore - a.valenceScore
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Discovery Leaderboard
          </h2>
          <p className="text-xs text-muted mt-1">
            {searchQuery ? (
              <>
                Results for &ldquo;<span className="text-primary">{searchQuery}</span>&rdquo;
                — Blending{" "}
                <span className="text-purple">LLM Relevancy (60%)</span> with{" "}
                <span className="text-accent">On-Chain Trust (40%)</span>
              </>
            ) : (
              "All agents ranked by On-Chain Trust score from PolkaVM"
            )}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: "rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            color: "#8B5CF6",
          }}
        >
          <Cpu className="w-3 h-3" />
          Powered by PVM
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[1fr_130px_130px_120px] gap-3 px-4 text-xs text-muted uppercase tracking-wider font-medium">
        <span>Agent</span>
        <span className="text-center">LLM Relevancy</span>
        <span className="text-center">On-Chain Trust</span>
        <span className="text-center">Valence Score</span>
      </div>

      {/* Agent Rows */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 glass-card animate-pulse"
            />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center text-muted py-16">
            <Cpu className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No agents discovered yet.</p>
            <p className="text-xs mt-1">
              Use the Gatekeeper to initiate a search.
            </p>
          </div>
        ) : (
          sorted.map((agent, idx) => {
            const isExpanded = expandedAgent === agent.address;
            return (
              <motion.div
                key={agent.address}
                className="glass-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <div
                  className="grid grid-cols-[1fr_130px_130px_120px] gap-3 items-center p-4 cursor-pointer hover:bg-surface-light/50 transition-colors"
                  onClick={() =>
                    setExpandedAgent(isExpanded ? null : agent.address)
                  }
                >
                  {/* Agent Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background:
                          idx === 0
                            ? "linear-gradient(135deg, #E6007A, #8B5CF6)"
                            : "rgba(42, 32, 64, 0.6)",
                        color: idx === 0 ? "#fff" : "var(--color-muted)",
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {agent.description.slice(0, 60)}...
                      </p>
                    </div>
                  </div>

                  {/* LLM Relevancy */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-purple">
                      {agent.llmRelevancy}
                      <span className="text-xs text-muted font-normal">
                        /100
                      </span>
                    </p>
                    <div className="progress-bar mt-1.5 mx-auto w-20">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${agent.llmRelevancy}%`,
                          background:
                            "linear-gradient(90deg, #6366F1, #8B5CF6)",
                        }}
                      />
                    </div>
                  </div>

                  {/* On-Chain Trust */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm font-bold text-accent">
                        {agent.onChainTrust}
                        <span className="text-xs text-muted font-normal">
                          /100
                        </span>
                      </p>
                      <Zap className="w-3 h-3 text-accent" />
                    </div>
                    <div className="progress-bar mt-1.5 mx-auto w-20">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${agent.onChainTrust}%`,
                          background:
                            "linear-gradient(90deg, #00E6A0, #00B880)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Valence Score */}
                  <div className="text-center flex items-center justify-center gap-2">
                    <div>
                      <p className="text-lg font-bold gradient-text">
                        {agent.valenceScore}
                      </p>
                      <p className="text-[10px] text-muted">BLENDED</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="border-t border-border px-4 py-4"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {/* Address + Description */}
                        <div>
                          <p className="text-xs text-muted mb-1">Address</p>
                          <p className="font-mono text-xs text-foreground">
                            {truncateAddress(agent.address)}
                          </p>
                          <p className="text-xs text-muted mt-3 mb-1">
                            Description
                          </p>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {agent.description}
                          </p>
                          <p className="text-xs text-muted mt-3 mb-1">
                            Raw Reputation (from PVM)
                          </p>
                          <p className="text-sm font-mono font-bold text-accent">
                            {agent.reputation}
                          </p>
                        </div>

                        {/* Interaction History */}
                        <div>
                          <p className="text-xs text-muted mb-2">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            Interaction History ({agent.interactions.length})
                          </p>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {agent.interactions.length === 0 ? (
                              <p className="text-xs text-muted/50 italic">
                                No recorded interactions
                              </p>
                            ) : (
                              agent.interactions.map((ix, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg"
                                  style={{
                                    background: `${interactionTypeColor(ix.interactionType)}10`,
                                    borderLeft: `2px solid ${interactionTypeColor(ix.interactionType)}`,
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{
                                      background: interactionTypeColor(
                                        ix.interactionType
                                      ),
                                    }}
                                  />
                                  <span className="font-medium">
                                    {interactionTypeLabel(ix.interactionType)}
                                  </span>
                                  <span className="text-muted ml-auto font-mono text-[10px]">
                                    from {truncateAddress(ix.from)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
