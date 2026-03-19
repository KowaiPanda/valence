"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Network } from "lucide-react";
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
}

interface GraphNode {
  id: string;
  name: string;
  reputation: number;
  val: number;
  color: string;
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

export default function TrustGraphTab({
  agents,
  interactions,
  loading,
  selectedAgent,
  onSelectAgent,
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
        val: Math.max(3, (rep / 100) * 2),
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
          val: 4,
          color: "#8a7fa8",
        });
      }
      if (!nodesMap.has(ix.agent)) {
        nodesMap.set(ix.agent, {
          id: ix.agent,
          name: getAgentName(ix.agent),
          reputation: 1000,
          val: 4,
          color: "#8a7fa8",
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

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Trust Graph</h2>
          <p className="text-xs text-muted mt-1">
            Live visualization of the AI agent network. Edges represent on-chain
            interactions stored in the EVM, trust scores computed by PolkaVM.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: "rgba(0, 230, 160, 0.1)",
            border: "1px solid rgba(0, 230, 160, 0.2)",
            color: "#00E6A0",
          }}
        >
          <Network className="w-3 h-3" />
          {graphData.nodes.length} nodes · {graphData.links.length} edges
        </div>
      </div>

      <div className="glass-card p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted mr-1">Edge filters:</span>
        <button
          className="px-2 py-1 rounded border"
          style={{
            borderColor: showPayments ? "#00E6A0" : "rgba(138,127,168,0.4)",
            color: showPayments ? "#00E6A0" : "#8a7fa8",
          }}
          onClick={() => setShowPayments((value) => !value)}
        >
          x402
        </button>
        <button
          className="px-2 py-1 rounded border"
          style={{
            borderColor: showPositive ? "#6366F1" : "rgba(138,127,168,0.4)",
            color: showPositive ? "#6366F1" : "#8a7fa8",
          }}
          onClick={() => setShowPositive((value) => !value)}
        >
          Positive
        </button>
        <button
          className="px-2 py-1 rounded border"
          style={{
            borderColor: showNegative ? "#EF4444" : "rgba(138,127,168,0.4)",
            color: showNegative ? "#EF4444" : "#8a7fa8",
          }}
          onClick={() => setShowNegative((value) => !value)}
        >
          Negative
        </button>
        {selectedAgent && (
          <span className="text-muted">Highlighting {truncateAddress(selectedAgent)}</span>
        )}
      </div>

      {/* Graph Area */}
      <div className="flex-1 glass-card overflow-hidden relative" style={{ minHeight: 400 }}>
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
            <Network className="w-10 h-10 opacity-30 mb-3" />
            <p className="text-sm">No network data yet.</p>
            <p className="text-xs mt-1">
              Record interactions on-chain to see the graph.
            </p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            backgroundColor="transparent"
            nodeRelSize={6}
            nodeLabel={(node) => {
              const graphNode = node as GraphNode;
              return `${graphNode.name}\n${truncateAddress(graphNode.id as `0x${string}`)}\nTrust: ${(graphNode.reputation / 10).toFixed(1)}`;
            }}
            nodeColor={(node) => {
              const graphNode = node as GraphNode;
              if (selectedAgent) {
                if (graphNode.id === selectedAgent) return "#E6007A";
                if (connectedToSelected.has(graphNode.id)) return graphNode.color;
                return "rgba(90, 82, 113, 0.45)";
              }
              return graphNode.color;
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const graphNode = node as GraphNode & { x?: number; y?: number };
              const size = graphNode.val || 4;
              const x = graphNode.x ?? 0;
              const y = graphNode.y ?? 0;

              // Glow effect
              ctx.shadowBlur = 15;
              ctx.shadowColor = graphNode.color;

              // Draw node circle
              ctx.beginPath();
              ctx.arc(x, y, size, 0, 2 * Math.PI);
              ctx.fillStyle = graphNode.color;
              ctx.globalAlpha = 0.8;
              ctx.fill();
              ctx.globalAlpha = 1;

              if (selectedAgent && graphNode.id === selectedAgent) {
                ctx.beginPath();
                ctx.arc(x, y, size + 3, 0, 2 * Math.PI);
                ctx.strokeStyle = "#E6007A";
                ctx.lineWidth = 2;
                ctx.stroke();
              }

              ctx.shadowBlur = 0;

              // Label
              if (globalScale > 0.8) {
                const label = graphNode.name;
                const fontSize = Math.max(10 / globalScale, 3);
                ctx.font = `${fontSize}px Space Grotesk, sans-serif`;
                ctx.fillStyle = "#e8e0f0";
                ctx.textAlign = "center";
                ctx.fillText(label, x, y + size + fontSize + 2);
              }
            }}
            linkColor={(link) => {
              const graphLink = link as GraphLink;
              if (selectedAgent) {
                const sourceId = getEndpointId(graphLink.source);
                const targetId = getEndpointId(graphLink.target);
                const connected = sourceId === selectedAgent || targetId === selectedAgent;
                return connected ? graphLink.color : "rgba(93, 86, 116, 0.2)";
              }
              return graphLink.color;
            }}
            linkWidth={(link) => {
              const graphLink = link as GraphLink;
              if (selectedAgent) {
                const sourceId = getEndpointId(graphLink.source);
                const targetId = getEndpointId(graphLink.target);
                const connected = sourceId === selectedAgent || targetId === selectedAgent;
                return connected ? Math.max(2, graphLink.width + 1) : 1;
              }
              return graphLink.width;
            }}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={(link) => {
              const graphLink = link as GraphLink;
              return graphLink.color;
            }}
            cooldownTicks={100}
            enableZoomInteraction={true}
            enablePanInteraction={true}
            onNodeClick={(node) => {
              const graphNode = node as GraphNode;
              onSelectAgent?.(graphNode.id as `0x${string}`);
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Trust Tiers */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
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
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: tier.color }}
                  />
                  <span>{tier.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactions */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
              Interactions
            </p>
            <div className="space-y-1.5">
              {[
                { label: "x402 Payment (2.0x weight)", color: "#00E6A0", thick: true },
                { label: "Positive Feedback (1.2x)", color: "#6366F1", thick: false },
                { label: "Negative Feedback (-1.0x)", color: "#EF4444", thick: false },
              ].map((edge) => (
                <div key={edge.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block rounded"
                    style={{
                      width: 16,
                      height: edge.thick ? 3 : 1.5,
                      background: edge.color,
                    }}
                  />
                  <span>{edge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
