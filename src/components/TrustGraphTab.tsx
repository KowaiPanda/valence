"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Network, Users, GitBranch, Activity, X, ExternalLink } from "lucide-react";
import {
  type AgentData,
  type AgentInteraction,
  getAgentName,
  truncateAddress,
} from "@/lib/contract";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface TrustGraphTabProps {
  agents: AgentData[];
  interactions: AgentInteraction[];
  loading: boolean;
  selectedAgent?: `0x${string}`;
  onSelectAgent?: (address: `0x${string}`) => void;
  onOpenModal?: (address: `0x${string}`) => void;
}

interface GraphNode {
  id: string;
  name: string;
  reputation: number;
  val: number;
  color: string;
  interactionCount: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: number;
  color: string;
  width: number;
}

function getEndpointId(endpoint: unknown): string {
  if (typeof endpoint === "string") return endpoint;
  if (endpoint && typeof endpoint === "object" && "id" in endpoint) {
    const maybeId = (endpoint as { id?: unknown }).id;
    return typeof maybeId === "string" ? maybeId : "";
  }
  return "";
}

function getTrustTier(rep: number): { label: string; color: string } {
  if (rep > 1200) return { label: "High", color: "#00E6A0" };
  if (rep > 800) return { label: "Medium", color: "#6366F1" };
  return { label: "Low", color: "#F59E0B" };
}

export default function TrustGraphTab({
  agents,
  interactions,
  loading,
  selectedAgent,
  onSelectAgent,
  onOpenModal,
}: TrustGraphTabProps) {
  const [showPayments, setShowPayments] = useState(true);
  const [showPositive, setShowPositive] = useState(true);
  const [showNegative, setShowNegative] = useState(true);

  const graphData = useMemo(() => {
    const nodesMap = new Map<string, GraphNode>();

    // Add agents as nodes
    agents.forEach((agent) => {
      const rep = agent.reputation;
      nodesMap.set(agent.address, {
        id: agent.address,
        name: agent.name,
        reputation: rep,
        val: 5,
        interactionCount: agent.interactions.length,
        color:
          rep > 1200
            ? "#00E6A0"
            : rep > 800
            ? "#6366F1"
            : "#F59E0B",
      });
    });

    // Add any extra addresses from interactions
    interactions.forEach((ix) => {
      if (!nodesMap.has(ix.from)) {
        nodesMap.set(ix.from, {
          id: ix.from,
          name: getAgentName(ix.from),
          reputation: 1000,
          val: 5,
          interactionCount: 0,
          color: "#7a7198",
        });
      }
      if (!nodesMap.has(ix.agent)) {
        nodesMap.set(ix.agent, {
          id: ix.agent,
          name: getAgentName(ix.agent),
          reputation: 1000,
          val: 4,
          interactionCount: 0,
          color: "#7a7198",
        });
      }
    });

    const links: GraphLink[] = interactions.map((ix) => ({
      source: ix.from,
      target: ix.agent,
      type: ix.interactionType,
      color:
        ix.interactionType === 1
          ? "#00E6A0"
          : ix.interactionType === 2
          ? "#6366F1"
          : "#EF4444",
      width:
        ix.interactionType === 1
          ? 3
          : ix.interactionType === 2
          ? 1.5
          : 1.5,
    }));

    const filteredLinks = links.filter((link) => {
      if (link.type === 1 && !showPayments) return false;
      if (link.type === 2 && !showPositive) return false;
      if (link.type === 3 && !showNegative) return false;
      return true;
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links: filteredLinks,
    };
  }, [agents, interactions, showPayments, showPositive, showNegative]);

  const connectedToSelected = useMemo(() => {
    if (!selectedAgent) return new Set<string>();
    const connected = new Set<string>([selectedAgent]);
    graphData.links.forEach((link) => {
      if (link.source === selectedAgent) connected.add(link.target);
      if (link.target === selectedAgent) connected.add(link.source);
    });
    return connected;
  }, [graphData.links, selectedAgent]);

  const selectedAgentData = useMemo(() => {
    if (!selectedAgent) return null;
    return agents.find((a) => a.address === selectedAgent) ?? null;
  }, [agents, selectedAgent]);

  // Graph metrics
  const density = graphData.nodes.length > 1
    ? (graphData.links.length / (graphData.nodes.length * (graphData.nodes.length - 1))).toFixed(3)
    : "0";
  const paymentCount = interactions.filter((ix) => ix.interactionType === 1).length;
  const positiveCount = interactions.filter((ix) => ix.interactionType === 2).length;
  const negativeCount = interactions.filter((ix) => ix.interactionType === 3).length;

  const handleNodeClick = useCallback(
    (node: object) => {
      const graphNode = node as GraphNode;
      onSelectAgent?.(graphNode.id as `0x${string}`);
    },
    [onSelectAgent]
  );

  const filterButtons = [
    { key: "payments", label: "x402 Payment", color: "#00E6A0", active: showPayments, toggle: () => setShowPayments((v) => !v), count: paymentCount },
    { key: "positive", label: "Positive", color: "#6366F1", active: showPositive, toggle: () => setShowPositive((v) => !v), count: positiveCount },
    { key: "negative", label: "Negative", color: "#EF4444", active: showNegative, toggle: () => setShowNegative((v) => !v), count: negativeCount },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Trust Graph</h2>
          <p className="text-xs text-muted mt-1">
            Live visualization of the AI agent network. Edges represent on-chain
            interactions stored in the EVM, trust scores computed by PolkaVM.
          </p>
        </div>
      </div>

      {/* Stats + Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mini Stats */}
        <div className="flex items-center gap-2">
          {[
            { icon: Users, label: "Nodes", value: graphData.nodes.length, color: "#00E6A0" },
            { icon: GitBranch, label: "Edges", value: graphData.links.length, color: "#8B5CF6" },
            { icon: Activity, label: "Density", value: density, color: "#E6007A" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: `${stat.color}08`,
                border: `1px solid ${stat.color}18`,
              }}
            >
              <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
              <span className="text-muted">{stat.label}:</span>
              <span className="font-semibold value-highlight" style={{ color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: "var(--color-border)" }} />

        {/* Edge Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted uppercase tracking-wider font-medium mr-1">Filter:</span>
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: btn.active ? `${btn.color}50` : "rgba(34, 28, 56, 0.5)",
                color: btn.active ? btn.color : "var(--color-muted)",
                background: btn.active ? `${btn.color}0a` : "transparent",
                boxShadow: btn.active ? `0 0 12px ${btn.color}10` : "none",
              }}
              onClick={btn.toggle}
            >
              <span
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: btn.active ? btn.color : "var(--color-muted)",
                  boxShadow: btn.active ? `0 0 6px ${btn.color}` : "none",
                }}
              />
              {btn.label}
              <span
                className="ml-0.5 text-[10px] font-mono"
                style={{ opacity: 0.7 }}
              >
                ({btn.count})
              </span>
            </button>
          ))}
        </div>

        {/* Selected Agent */}
        {selectedAgent && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-muted">Selected:</span>
            <span
              className="badge"
              style={{
                borderColor: "rgba(230, 0, 122, 0.25)",
                background: "rgba(230, 0, 122, 0.06)",
                color: "var(--color-primary)",
              }}
            >
              {truncateAddress(selectedAgent)}
            </span>
          </div>
        )}
      </div>

      {/* Graph Area */}
      <div className="flex-1 glass-card graph-container relative" style={{ minHeight: 400 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              className="text-muted text-sm"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Loading graph data from Polkadot EVM...
            </motion.div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted">
            <Network className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-sm">No network data yet.</p>
            <p className="text-xs mt-1">
              Record interactions on-chain to see the graph.
            </p>
          </div>
        ) : (
          <>
            <ForceGraph2D
              graphData={graphData}
              backgroundColor="transparent"
              nodeRelSize={1}
              nodeLabel={(node) => {
                const graphNode = node as GraphNode;
                return `${graphNode.name}\n${truncateAddress(graphNode.id as `0x${string}`)}\nTrust: ${(graphNode.reputation / 10).toFixed(1)}`;
              }}
              nodeColor={(node) => {
                const graphNode = node as GraphNode;
                if (selectedAgent) {
                  if (graphNode.id === selectedAgent) return "#E6007A";
                  if (connectedToSelected.has(graphNode.id)) return graphNode.color;
                  return "rgba(70, 60, 100, 0.35)";
                }
                return graphNode.color;
              }}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const graphNode = node as GraphNode & { x?: number; y?: number };
                const size = 5;
                const x = graphNode.x ?? 0;
                const y = graphNode.y ?? 0;
                const isSelected = selectedAgent && graphNode.id === selectedAgent;
                const isConnected = !selectedAgent || connectedToSelected.has(graphNode.id);
                const alpha = isConnected ? 1 : 0.25;

                // Outer glow ring
                if (isSelected || graphNode.reputation > 1200) {
                  ctx.beginPath();
                  ctx.arc(x, y, size + 6, 0, 2 * Math.PI);
                  const glowColor = isSelected ? "#E6007A" : graphNode.color;
                  ctx.fillStyle = `${glowColor}15`;
                  ctx.fill();
                }

                // Main glow
                ctx.shadowBlur = isSelected ? 25 : 12;
                ctx.shadowColor = isSelected ? "#E6007A" : graphNode.color;

                // Draw node circle
                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fillStyle = graphNode.color;
                ctx.globalAlpha = isSelected ? 1 : alpha * 0.85;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Selection ring
                if (isSelected) {
                  ctx.beginPath();
                  ctx.arc(x, y, size + 3, 0, 2 * Math.PI);
                  ctx.strokeStyle = "#E6007A";
                  ctx.lineWidth = 2.5;
                  ctx.setLineDash([3, 3]);
                  ctx.stroke();
                  ctx.setLineDash([]);
                }

                // Inner highlight
                ctx.beginPath();
                ctx.arc(x, y - size * 0.3, size * 0.4, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
                ctx.globalAlpha = alpha;
                ctx.fill();
                ctx.globalAlpha = 1;

                ctx.shadowBlur = 0;

                // Label
                if (globalScale > 0.7) {
                  const label = graphNode.name;
                  const fontSize = Math.max(10 / globalScale, 3);
                  ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
                  ctx.fillStyle = `rgba(232, 224, 240, ${alpha * 0.9})`;
                  ctx.textAlign = "center";
                  ctx.fillText(label, x, y + size + fontSize + 3);

                  // Trust score below name
                  if (globalScale > 1.2) {
                    const trustLabel = `${(graphNode.reputation / 10).toFixed(0)}`;
                    const smallFontSize = Math.max(8 / globalScale, 2.5);
                    ctx.font = `500 ${smallFontSize}px 'JetBrains Mono', monospace`;
                    ctx.fillStyle = `${graphNode.color}${Math.round(alpha * 180).toString(16).padStart(2, '0')}`;
                    ctx.fillText(trustLabel, x, y + size + fontSize + smallFontSize + 5);
                  }
                }
              }}
              linkColor={(link) => {
                const graphLink = link as GraphLink;
                if (selectedAgent) {
                  const sourceId = getEndpointId(graphLink.source);
                  const targetId = getEndpointId(graphLink.target);
                  const connected = sourceId === selectedAgent || targetId === selectedAgent;
                  return connected ? graphLink.color : "rgba(70, 60, 100, 0.12)";
                }
                return graphLink.color;
              }}
              linkWidth={(link) => {
                const graphLink = link as GraphLink;
                if (selectedAgent) {
                  const sourceId = getEndpointId(graphLink.source);
                  const targetId = getEndpointId(graphLink.target);
                  const connected = sourceId === selectedAgent || targetId === selectedAgent;
                  return connected ? Math.max(2.5, graphLink.width + 1) : 0.5;
                }
                return graphLink.width;
              }}
              linkDirectionalParticles={3}
              linkDirectionalParticleWidth={(link) => {
                const graphLink = link as GraphLink;
                return graphLink.type === 1 ? 3 : 2;
              }}
              linkDirectionalParticleSpeed={0.006}
              linkDirectionalParticleColor={(link) => {
                const graphLink = link as GraphLink;
                return graphLink.color;
              }}
              linkCurvature={0.15}
              cooldownTicks={100}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              onNodeClick={handleNodeClick}
            />

            {/* Selected Agent Info Overlay */}
            {selectedAgentData && (
              <motion.div
                className="absolute bottom-4 left-4 glass-card-premium p-4 z-10"
                style={{ maxWidth: 280 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedAgent}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{selectedAgentData.name}</p>
                    <p className="text-[10px] font-mono text-muted">
                      {truncateAddress(selectedAgentData.address)}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectAgent?.(undefined as unknown as `0x${string}`)}
                    className="text-muted hover:text-foreground transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="section-divider mb-2" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs font-bold value-highlight" style={{ color: getTrustTier(selectedAgentData.reputation).color }}>
                      {(selectedAgentData.reputation / 10).toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted uppercase">Trust</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold value-highlight" style={{ color: getTrustTier(selectedAgentData.reputation).color }}>
                      {getTrustTier(selectedAgentData.reputation).label}
                    </p>
                    <p className="text-[9px] text-muted uppercase">Tier</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold value-highlight">
                      {selectedAgentData.interactions.length}
                    </p>
                    <p className="text-[9px] text-muted uppercase">Txns</p>
                  </div>
                  </div>
                  
                  <button
                    onClick={() => onOpenModal?.(selectedAgentData.address as `0x${string}`)}
                    className="mt-3 w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-primary transition-colors border border-white/5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Full Profile
                  </button>
                </motion.div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Trust Tiers */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">
              Trust Tiers
            </p>
            <div className="space-y-1.5">
              {[
                { label: "High Trust (>80%)", color: "#00E6A0" },
                { label: "Medium Trust (>50%)", color: "#6366F1" },
                { label: "Low Trust (<50%)", color: "#F59E0B" },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: tier.color,
                      boxShadow: `0 0 8px ${tier.color}40`,
                    }}
                  />
                  <span className="text-foreground/80">{tier.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactions */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">
              Interaction Types
            </p>
            <div className="space-y-1.5">
              {[
                { label: "x402 Payment (2.0x weight)", color: "#00E6A0", thick: true },
                { label: "Positive Feedback (1.2x)", color: "#6366F1", thick: false },
                { label: "Negative Feedback (-1.0x)", color: "#EF4444", thick: false },
              ].map((edge) => (
                <div key={edge.label} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block rounded-full"
                      style={{
                        width: 16,
                        height: edge.thick ? 3 : 2,
                        background: edge.color,
                        boxShadow: `0 0 6px ${edge.color}60`,
                      }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: edge.color,
                        boxShadow: `0 0 4px ${edge.color}`,
                      }}
                    />
                  </div>
                  <span className="text-foreground/80">{edge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
