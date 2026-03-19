"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
  TrendingUp,
  ExternalLink,
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

function ScoreRing({ value, size = 44, strokeWidth = 3, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(34, 28, 56, 0.5)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <span className="score-ring-value text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function getMedalClass(index: number): string {
  if (index === 0) return "medal medal-gold";
  if (index === 1) return "medal medal-silver";
  if (index === 2) return "medal medal-bronze";
  return "";
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
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Discovery Leaderboard</h2>
          <p className="text-xs text-muted mt-1">
            {searchQuery ? (
              <>
                Results for &ldquo;<span className="text-primary">{searchQuery}</span>&rdquo;
                <> -- <span className="text-accent">Live Gemini + PVM scoring</span></>
              </>
            ) : (
              "Run a gated search to load real backend-ranked agents"
            )}
          </p>
        </div>
        <div
          className="badge"
          style={{
            borderColor: "rgba(139, 92, 246, 0.2)",
            background: "rgba(139, 92, 246, 0.06)",
            color: "#8B5CF6",
          }}
        >
          <Cpu className="w-3 h-3" />
          Powered by PVM
        </div>
      </div>

      {/* Formula Card */}
      <div className="glass-card-premium p-4 text-xs">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {[
            { label: "On-chain", color: "#00E6A0" },
            { label: "Gemini", color: "#8B5CF6" },
            { label: "PVM", color: "#00B8FF" },
          ].map((source) => (
            <span
              key={source.label}
              className="badge"
              style={{
                borderColor: `${source.color}30`,
                background: `${source.color}0a`,
                color: source.color,
              }}
            >
              {source.label}
            </span>
          ))}
          {formattedUpdateTime && (
            <span className="text-muted text-[11px]">Updated {formattedUpdateTime}</span>
          )}
          {typeof searchMeta?.totalAgents === "number" && (
            <span className="text-muted text-[11px]">Agents scanned: {searchMeta.totalAgents}</span>
          )}
        </div>
        <div className="text-muted leading-relaxed">
          <span className="text-foreground font-medium">Valence score formula:</span>{" "}
          <span className="font-mono text-[11px]">0.6 x Gemini + 0.4 x On-Chain Trust</span>
          {focusAgent && (
            <>
              {" "}&rarr; <span className="font-mono text-[11px]">0.6 x {focusAgent.llmRelevancy} + 0.4 x {focusAgent.onChainTrust} = {focusAgent.valenceScore}</span>
            </>
          )}
          . Sybil multiplier is applied server-side (flagged agents are penalized), and trust uses 30-day exponential decay from PVM math.
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[1fr_120px_120px_100px] gap-3 px-4 text-[10px] text-muted uppercase tracking-wider font-semibold">
        <span>Agent</span>
        <span className="text-center">LLM Relevancy</span>
        <span className="text-center">On-Chain Trust</span>
        <span className="text-center">Valence Score</span>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 glass-card shimmer" />
          ))
        ) : sorted.length === 0 ? (
          <div className="text-center text-muted py-16">
            <Cpu className="w-8 h-8 mx-auto mb-3 opacity-30" />
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
            const isTopThree = idx < 3;
            return (
              <motion.div
                key={agent.address}
                className="glass-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <div
                  className="grid grid-cols-[1fr_120px_120px_100px] gap-3 items-center p-4 cursor-pointer hover:bg-surface-light/40 transition-colors"
                  onClick={() => {
                    setExpandedAgent(isExpanded ? null : agent.address);
                    onSelectAgent?.(agent.address as `0x${string}`);
                  }}
                >
                  {/* Agent Name + Rank */}
                  <div className="flex items-center gap-3 min-w-0">
                    {isTopThree ? (
                      <div className={`w-9 h-9 ${getMedalClass(idx)} text-xs`}>
                        #{idx + 1}
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: "rgba(34, 28, 56, 0.5)",
                          color: "var(--color-muted)",
                        }}
                      >
                        #{idx + 1}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{agent.name}</p>
                        {selectedAgent === agent.address && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{
                              border: "1px solid rgba(230, 0, 122, 0.3)",
                              color: "var(--color-primary)",
                              background: "rgba(230, 0, 122, 0.06)",
                            }}
                          >
                            selected
                          </span>
                        )}
                        {agent.isSybilFlagged && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                            style={{
                              background: "rgba(245, 158, 11, 0.08)",
                              color: "#F59E0B",
                              border: "1px solid rgba(245, 158, 11, 0.2)",
                            }}
                          >
                            sybil risk
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted truncate mt-0.5">
                        {agent.description.slice(0, 60)}...
                      </p>
                    </div>
                  </div>

                  {/* LLM Relevancy */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-bold text-purple value-highlight">
                      {agent.llmRelevancy}
                      <span className="text-[10px] text-muted font-normal">/100</span>
                    </p>
                    <div className="progress-bar w-16">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${agent.llmRelevancy}%`,
                          background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
                        }}
                      />
                    </div>
                  </div>

                  {/* On-Chain Trust */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-bold text-accent value-highlight">
                        {agent.onChainTrust}
                        <span className="text-[10px] text-muted font-normal">/100</span>
                      </p>
                      <Zap className="w-3 h-3 text-accent" />
                    </div>
                    <div className="progress-bar w-16">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${agent.onChainTrust}%`,
                          background: "linear-gradient(90deg, #00E6A0, #00B880)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Valence Score */}
                  <div className="flex items-center justify-center gap-2">
                    <ScoreRing
                      value={agent.valenceScore}
                      color={agent.valenceScore > 70 ? "#00E6A0" : agent.valenceScore > 40 ? "#8B5CF6" : "#F59E0B"}
                    />
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="border-t px-4 py-4"
                      style={{ borderColor: "var(--color-border)" }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Address</p>
                          <p className="font-mono text-xs text-foreground">
                            {truncateAddress(agent.address as `0x${string}`)}
                          </p>
                          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mt-4 mb-1">Description</p>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {agent.description}
                          </p>
                          {agent.reasoning && (
                            <>
                              <p className="text-[10px] text-muted uppercase tracking-wider font-medium mt-4 mb-1">Gemini reasoning</p>
                              <p className="text-xs text-foreground/70 italic leading-relaxed">
                                &ldquo;{agent.reasoning}&rdquo;
                              </p>
                            </>
                          )}
                          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mt-4 mb-1">Raw Reputation (from PVM)</p>
                          <p className="text-base font-mono font-bold text-accent value-highlight">
                            {agent.reputation}
                          </p>
                          <button
                            type="button"
                            className="mt-3 text-xs font-medium text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectAgent?.(agent.address as `0x${string}`);
                              onOpenTrustGraph?.();
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Highlight in Trust Graph
                          </button>
                        </div>

                        <div>
                          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Interaction History ({agent.interactions.length})
                          </p>
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {agent.interactions.length === 0 ? (
                              <p className="text-xs text-muted/40 italic">
                                No recorded interactions
                              </p>
                            ) : (
                              agent.interactions.map((ix, i) => (
                                <div
                                  key={i}
                                  className="interaction-badge"
                                  style={{
                                    background: `${interactionTypeColor(ix.interactionType)}08`,
                                    borderLeft: `2px solid ${interactionTypeColor(ix.interactionType)}`,
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: interactionTypeColor(ix.interactionType) }}
                                  />
                                  <span className="font-medium text-xs">
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