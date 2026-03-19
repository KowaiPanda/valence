"use client";

import { motion } from "framer-motion";
import { Trophy, Users, TrendingUp, Activity } from "lucide-react";
import { type AgentData, truncateAddress } from "@/lib/contract";

interface AgentSidebarProps {
  agents: AgentData[];
  loading: boolean;
}

function getMedalClass(index: number): string {
  if (index === 0) return "medal medal-gold";
  if (index === 1) return "medal medal-silver";
  if (index === 2) return "medal medal-bronze";
  return "";
}

function getTrustColor(reputation: number): string {
  if (reputation > 1200) return "var(--color-trust-high)";
  if (reputation > 800) return "var(--color-trust-mid)";
  return "var(--color-trust-low)";
}

export default function AgentSidebar({ agents, loading }: AgentSidebarProps) {
  const sortedAgents = [...agents].sort((a, b) => b.reputation - a.reputation);

  const totalTrust = agents.reduce((sum, a) => sum + a.reputation, 0);
  const totalInteractions = agents.reduce((sum, a) => sum + a.interactions.length, 0);

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="stat-card stat-card-primary">
          <div className="flex items-center gap-1.5 text-muted text-[10px] mb-1.5 uppercase tracking-wider font-medium">
            <Users className="w-3 h-3" />
            Agents
          </div>
          <motion.p
            className="text-xl font-bold value-highlight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {loading ? "--" : agents.length}
          </motion.p>
        </div>
        <div className="stat-card stat-card-accent">
          <div className="flex items-center gap-1.5 text-muted text-[10px] mb-1.5 uppercase tracking-wider font-medium">
            <TrendingUp className="w-3 h-3" />
            Trust
          </div>
          <motion.p
            className="text-xl font-bold value-highlight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading ? "--" : (totalTrust / 100).toFixed(1)}
          </motion.p>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="flex items-center gap-1.5 text-muted text-[10px] mb-1.5 uppercase tracking-wider font-medium">
            <Activity className="w-3 h-3" />
            Txns
          </div>
          <motion.p
            className="text-xl font-bold value-highlight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {loading ? "--" : totalInteractions}
          </motion.p>
        </div>
      </div>

      {/* Top Agents List */}
      <div className="glass-card-premium p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
            <h2 className="text-base font-semibold tracking-tight">Top Agents</h2>
          </div>
          <span
            className="badge"
            style={{
              borderColor: "rgba(0, 230, 160, 0.2)",
              background: "rgba(0, 230, 160, 0.06)",
              color: "var(--color-accent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            Live Ranking
          </span>
        </div>

        <div className="section-divider mb-3" />

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[56px] rounded-xl shimmer"
                  style={{
                    background: "rgba(21, 17, 39, 0.5)",
                  }}
                />
              ))}
            </div>
          ) : sortedAgents.length === 0 ? (
            <div className="text-center text-muted py-10 text-sm">
              No agents found on-chain yet.
              <br />
              <span className="text-xs">
                Record an interaction to see agents here.
              </span>
            </div>
          ) : (
            sortedAgents.map((agent, index) => {
              const isTopThree = index < 3;
              const trustScore = (agent.reputation / 10).toFixed(1);
              const trustPct = Math.min(100, agent.reputation / 15);

              return (
                <motion.div
                  key={agent.address}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all cursor-default group"
                  style={{
                    background: isTopThree ? "rgba(21, 17, 39, 0.4)" : "transparent",
                    borderLeft: isTopThree ? `2px solid ${getTrustColor(agent.reputation)}` : "2px solid transparent",
                  }}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ background: "rgba(21, 17, 39, 0.6)" }}
                >
                  {/* Rank */}
                  {isTopThree ? (
                    <div
                      className={`w-8 h-8 ${getMedalClass(index)} text-xs`}
                    >
                      {index + 1}
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{
                        background: "rgba(34, 28, 56, 0.5)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {index + 1}
                    </div>
                  )}

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{agent.name}</p>
                    <p className="text-[10px] text-muted font-mono">
                      {truncateAddress(agent.address)}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(34, 28, 56, 0.6)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${trustPct}%`,
                            background: getTrustColor(agent.reputation),
                          }}
                        />
                      </div>
                      <p
                        className="text-sm font-bold value-highlight"
                        style={{ color: getTrustColor(agent.reputation) }}
                      >
                        {trustScore}
                      </p>
                    </div>
                    <p className="text-[9px] text-muted uppercase tracking-widest mt-0.5">
                      Trust
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
