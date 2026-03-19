"use client";

import { motion } from "framer-motion";
import { Trophy, Users, TrendingUp } from "lucide-react";
import { type AgentData, truncateAddress } from "@/lib/contract";

interface AgentSidebarProps {
  agents: AgentData[];
  loading: boolean;
}

export default function AgentSidebar({ agents, loading }: AgentSidebarProps) {
  const sortedAgents = [...agents].sort((a, b) => b.reputation - a.reputation);

  const totalTrust = agents.reduce((sum, a) => sum + a.reputation, 0);

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-4">
      {/* Stats Cards */}
      <div className="flex gap-3">
        <div className="glass-card flex-1 p-4">
          <div className="flex items-center gap-2 text-muted text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            Active Agents
          </div>
          <motion.p
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {loading ? "..." : agents.length}
          </motion.p>
        </div>
        <div className="glass-card flex-1 p-4">
          <div className="flex items-center gap-2 text-muted text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Total Trust
          </div>
          <motion.p
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {loading ? "..." : (totalTrust / 100).toFixed(1)}
          </motion.p>
        </div>
      </div>

      {/* Top Agents List */}
      <div className="glass-card p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h2 className="text-lg font-semibold">Top Agents</h2>
          </div>
          <span className="text-xs border border-border rounded-full px-3 py-1 text-muted">
            Live Ranking
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-surface-light animate-pulse"
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
            sortedAgents.map((agent, index) => (
              <motion.div
                key={agent.address}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-light transition-colors cursor-default group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Rank */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #E6007A, #8B5CF6)"
                        : index < 3
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(42, 32, 64, 0.5)",
                    color: index < 3 ? "#fff" : "var(--color-muted)",
                  }}
                >
                  {index + 1}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{agent.name}</p>
                  <p className="text-xs text-muted font-mono">
                    {truncateAddress(agent.address)}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-sm font-bold"
                    style={{
                      color:
                        agent.reputation > 1200
                          ? "var(--color-trust-high)"
                          : agent.reputation > 800
                          ? "var(--color-trust-mid)"
                          : "var(--color-trust-low)",
                    }}
                  >
                    {(agent.reputation / 10).toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">
                    Trust
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
