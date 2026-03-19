"use client";

import { useState, useEffect } from "react";
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
import type { SearchMeta } from "@/hooks/useSearchWithPayment.wagmi";

interface SearchResult {
  address: string;
  profile: string;
  chainScore: number;
  geminiScore: number;
  finalScore: number;
  reasoning: string;
  isSybilFlagged: boolean;
}

interface DiscoveryTabProps {
  agents: AgentData[];
  loading: boolean;
  searchQuery: string;
  searchResults?: SearchResult[];
  searchMeta?: SearchMeta;
  selectedAgent?: `0x${string}`;
  onSelectAgent?: (address: `0x${string}`) => void;
  onOpenTrustGraph?: () => void;
}

export default function DiscoveryTab({
  agents,
  loading,
  searchQuery,
  searchResults,
  searchMeta,
  selectedAgent,
  onSelectAgent,
  onOpenTrustGraph,
}: DiscoveryTabProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    setExpandedAgent(null);
  }, [searchResults, searchQuery]);

  const sorted = (searchResults ?? []).map((r) => ({
    address: r.address,
    name:
      agents.find((a) => a.address.toLowerCase() === r.address.toLowerCase())?.name ??
      truncateAddress(r.address as `0x${string}`),
    description: r.profile,
    reputation: r.chainScore,
    interactions:
      agents.find((a) => a.address.toLowerCase() === r.address.toLowerCase())
        ?.interactions ?? [],
    onChainTrust: Math.min(100, Math.round(r.chainScore / 10)),
    llmRelevancy: Math.round(r.geminiScore * 100),
    valenceScore: Math.round(r.finalScore * 100),
    reasoning: r.reasoning,
    isSybilFlagged: r.isSybilFlagged,
  }));

  const focusAgent = sorted.find((agent) => agent.address === expandedAgent) ?? sorted[0];
  const formattedUpdateTime = searchMeta?.timestamp
    ? new Date(searchMeta.timestamp).toLocaleTimeString()
    : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Discovery Leaderboard</h2>
          <p className="text-xs text-muted mt-1">
            {searchQuery ? (
              <>
                Results for &ldquo;<span className="text-primary">{searchQuery}</span>&rdquo;
                <> — <span className="text-accent">Live Gemini + PVM scoring</span></>
              </>
            ) : (
              "Run a gated search to load real backend-ranked agents"
            )}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs shrink-0"
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

      <div className="glass-card p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {[
            { label: "On-chain", color: "#00E6A0" },
            { label: "Gemini", color: "#8B5CF6" },
            { label: "PVM", color: "#00B8FF" },
          ].map((source) => (
            <span
              key={source.label}
              className="px-2 py-1 rounded-full border"
              style={{
                borderColor: `${source.color}50`,
                background: `${source.color}14`,
                color: source.color,
              }}
            >
              {source.label}
            </span>
          ))}
          {formattedUpdateTime && (
            <span className="text-muted">Updated {formattedUpdateTime}</span>
          )}
          {typeof searchMeta?.totalAgents === "number" && (
            <span className="text-muted">Agents scanned: {searchMeta.totalAgents}</span>
          )}
        </div>
        <div className="text-muted leading-relaxed">
          <span className="text-foreground font-medium">Valence score formula:</span>{" "}
          <span className="font-mono">0.6 × Gemini + 0.4 × On-Chain Trust</span>
          {focusAgent && (
            <>
              {" "}→ <span className="font-mono">0.6 × {focusAgent.llmRelevancy} + 0.4 × {focusAgent.onChainTrust} = {focusAgent.valenceScore}</span>
            </>
          )}
          . Sybil multiplier is applied server-side (flagged agents are penalized), and trust uses 30-day exponential decay from PVM math.
        </div>
      </div>

      <div className="grid grid-cols-[1fr_130px_130px_120px] gap-3 px-4 text-xs text-muted uppercase tracking-wider font-medium">
        <span>Agent</span>
        <span className="text-center">LLM Relevancy</span>
        <span className="text-center">On-Chain Trust</span>
        <span className="text-center">Valence Score</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 glass-card animate-pulse" />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center text-muted py-16">
            <Cpu className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {searchQuery ? "No backend results returned for this query." : "No search results yet."}
            </p>
            <p className="text-xs mt-1">
              {searchQuery
                ? "No agents found. Try a broader query or verify registered agents in backend env."
                : "Use the Gatekeeper to run a real paid search."}
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
                  onClick={() => {
                    setExpandedAgent(isExpanded ? null : agent.address);
                    onSelectAgent?.(agent.address as `0x${string}`);
                  }}
                >
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{agent.name}</p>
                        {selectedAgent === agent.address && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/40 text-primary">
                            selected
                          </span>
                        )}
                        {agent.isSybilFlagged && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0">
                            sybil risk
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate">
                        {agent.description.slice(0, 60)}...
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-bold text-purple">
                      {agent.llmRelevancy}
                      <span className="text-xs text-muted font-normal">/100</span>
                    </p>
                    <div className="progress-bar mt-1.5 mx-auto w-20">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${agent.llmRelevancy}%`,
                          background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm font-bold text-accent">
                        {agent.onChainTrust}
                        <span className="text-xs text-muted font-normal">/100</span>
                      </p>
                      <Zap className="w-3 h-3 text-accent" />
                    </div>
                    <div className="progress-bar mt-1.5 mx-auto w-20">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${agent.onChainTrust}%`,
                          background: "linear-gradient(90deg, #00E6A0, #00B880)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-center flex items-center justify-center gap-2">
                    <div>
                      <p className="text-lg font-bold gradient-text">{agent.valenceScore}</p>
                      <p className="text-[10px] text-muted">BLENDED</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="border-t border-border px-4 py-4"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted mb-1">Address</p>
                          <p className="font-mono text-xs text-foreground">
                            {truncateAddress(agent.address as `0x${string}`)}
                          </p>
                          <p className="text-xs text-muted mt-3 mb-1">Description</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {agent.description}
                          </p>
                          {agent.reasoning && (
                            <>
                              <p className="text-xs text-muted mt-3 mb-1">Gemini reasoning</p>
                              <p className="text-xs text-foreground/70 italic leading-relaxed">
                                &ldquo;{agent.reasoning}&rdquo;
                              </p>
                            </>
                          )}
                          <p className="text-xs text-muted mt-3 mb-1">Raw Reputation (from PVM)</p>
                          <p className="text-sm font-mono font-bold text-accent">
                            {agent.reputation}
                          </p>
                          <button
                            type="button"
                            className="mt-3 text-xs underline text-primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectAgent?.(agent.address as `0x${string}`);
                              onOpenTrustGraph?.();
                            }}
                          >
                            Highlight in Trust Graph
                          </button>
                        </div>

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
                                    style={{ background: interactionTypeColor(ix.interactionType) }}
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