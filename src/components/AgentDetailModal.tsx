"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Activity, Link2, ExternalLink, Calendar, Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import { AgentData, truncateAddress } from "@/lib/contract";

interface AgentDetailModalProps {
  agent: AgentData | null;
  onClose: () => void;
}

function getTrustColor(reputation: number): string {
  if (reputation > 1200) return "#00E6A0";
  if (reputation > 800) return "#6366F1";
  return "#F59E0B";
}

function getTrustTier(reputation: number): string {
  if (reputation > 1200) return "High Trust";
  if (reputation > 800) return "Medium Trust";
  return "Low Trust";
}

export default function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Reconstruct the reputation history for the chart
  const chartData = useMemo(() => {
    if (!agent) return [];
    
    // We simulate a timeline ending at today, with one interaction per day historically
    const dataPoints = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const interactions = [...agent.interactions];
    // Start with base score
    let currentScore = 1000;
    
    // Generate data for the chart, one point per interaction + padding
    const daysToSimulate = Math.max(14, interactions.length + 3);
    
    for (let i = daysToSimulate; i >= 0; i--) {
      // Calculate the date for this point
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const timeStr = d.toISOString().split("T")[0];

      // Natural decay: score naturally decays towards 1000 by ~2.3% per day if above 1000
      // (Simplified inverse of the 30-day half life for visual purposes)
      if (currentScore > 1000) {
          currentScore = 1000 + (currentScore - 1000) * 0.97;
      } else if (currentScore < 1000) {
          currentScore = 1000 - (1000 - currentScore) * 0.97;
      }

      // If there's an interaction for this day (we map interactions backwards from recent)
      const interactionIndex = interactions.length - 1 - (i - 1);
      if (interactionIndex >= 0 && interactionIndex < interactions.length) {
        const ix = interactions[interactionIndex];
        if (ix.interactionType === 1) currentScore += 200; // Payment
        if (ix.interactionType === 2) currentScore += 120; // Positive
        if (ix.interactionType === 3) currentScore -= 100; // Negative
      }

      dataPoints.push({
        time: timeStr,
        value: Number((currentScore / 10).toFixed(1)), // Scale down to match UI (e.g. 100.0)
      });
    }

    // Force the last point to match the exact current reputation from chain
    if (dataPoints.length > 0) {
      dataPoints[dataPoints.length - 1].value = Number((agent.reputation / 10).toFixed(1));
    }

    return dataPoints;
  }, [agent]);

  // Initialize Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current || !agent || chartData.length === 0) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const isHighTrust = agent.reputation > 1200;
    const isMedTrust = agent.reputation > 800 && agent.reputation <= 1200;
    
    const lineColor = isHighTrust ? "#00E6A0" : isMedTrust ? "#6366F1" : "#F59E0B";
    const topColor = isHighTrust ? "rgba(0, 230, 160, 0.4)" : isMedTrust ? "rgba(99, 102, 241, 0.4)" : "rgba(245, 158, 11, 0.4)";
    const bottomColor = isHighTrust ? "rgba(0, 230, 160, 0.0)" : isMedTrust ? "rgba(99, 102, 241, 0.0)" : "rgba(245, 158, 11, 0.0)";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 220,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 1,
        minMove: 0.1,
      },
    });

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [agent, chartData]);

  if (!agent) return null;

  const trustColor = getTrustColor(agent.reputation);
  const trustTier = getTrustTier(agent.reputation);

  // Group interactions for stats
  const payments = agent.interactions.filter(i => i.interactionType === 1).length;
  const positive = agent.interactions.filter(i => i.interactionType === 2).length;
  const negative = agent.interactions.filter(i => i.interactionType === 3).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          className="glass-card-premium w-full max-w-3xl relative z-10 overflow-hidden flex flex-col"
          style={{ maxHeight: "90vh" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 relative bg-black/20">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors p-2 hover:bg-white/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex gap-5 items-start">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${trustColor}15`, border: `1px solid ${trustColor}30`, boxShadow: `0 0 20px ${trustColor}20` }}
              >
                <ShieldCheck className="w-8 h-8" style={{ color: trustColor }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold tracking-tight">{agent.name}</h2>
                  <span 
                    className="text-xs px-2.5 py-1 rounded-md font-medium"
                    style={{ background: `${trustColor}10`, color: trustColor, border: `1px solid ${trustColor}20` }}
                  >
                    {trustTier}
                  </span>
                </div>
                
                <p className="text-sm text-muted mb-3 leading-relaxed max-w-xl">
                  {agent.description}
                </p>
                
                <a
                  href={`https://blockscout-testnet.polkadot.io/address/${agent.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground transition-colors group"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {agent.address}
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1 flex items-center justify-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Score
                </p>
                <p className="text-2xl font-bold font-mono value-highlight" style={{ color: trustColor }}>
                  {(agent.reputation / 10).toFixed(1)}
                </p>
              </div>
              
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1 flex items-center justify-center gap-1.5" style={{ color: "#00E6A0" }}>
                  <Wallet className="w-3 h-3" />
                  Payments
                </p>
                <p className="text-xl font-bold font-mono text-foreground">{payments}</p>
              </div>
              
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1 flex items-center justify-center gap-1.5" style={{ color: "#6366F1" }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Positive
                </p>
                <p className="text-xl font-bold font-mono text-foreground">{positive}</p>
              </div>
              
              <div className="glass-card p-4 rounded-xl text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1 flex items-center justify-center gap-1.5" style={{ color: "#EF4444" }}>
                  <AlertTriangle className="w-3 h-3" />
                  Negative
                </p>
                <p className="text-xl font-bold font-mono text-foreground">{negative}</p>
              </div>
            </div>

            {/* Reputation History Chart */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Reputation Timeline
                </h3>
                <span className="text-[10px] text-muted px-2 py-1 rounded bg-white/5 border border-white/5">
                  Decay factor: 0.97/day
                </span>
              </div>
              {/* Chart Container */}
              <div ref={chartContainerRef} className="w-full" />
            </div>

            {/* Interaction Log List */}
            <div>
              <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-accent" />
                Interaction Log
              </h3>
              
              <div className="glass-card rounded-xl overflow-hidden border border-white/5">
                {agent.interactions.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">
                    No on-chain interactions recorded for this agent yet.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Reverse array to show most recent first (based on index assuming appended) */}
                    {[...agent.interactions].reverse().map((ix, idx) => {
                      let typeProps = { label: "Unknown", color: "#6c757d", icon: Activity, weight: "+0.0" };
                      if (ix.interactionType === 1) typeProps = { label: "x402 Payment", color: "#00E6A0", icon: Wallet, weight: "+20.0" };
                      if (ix.interactionType === 2) typeProps = { label: "Positive Feedback", color: "#6366F1", icon: CheckCircle2, weight: "+12.0" };
                      if (ix.interactionType === 3) typeProps = { label: "Negative Feedback", color: "#EF4444", icon: AlertTriangle, weight: "-10.0" };

                      return (
                         <div key={`${ix.txHash || idx}-${ix.interactionType}`} className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors">
                           <div 
                             className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                             style={{ background: `${typeProps.color}15` }}
                           >
                             <typeProps.icon className="w-4 h-4" style={{ color: typeProps.color }} />
                           </div>
                           
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-0.5">
                               <p className="text-xs font-semibold" style={{ color: typeProps.color }}>
                                 {typeProps.label}
                               </p>
                               {ix.txHash && (
                                 <span className="text-[9px] text-muted font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                   tx: {truncateAddress(ix.txHash as `0x${string}`)}
                                 </span>
                               )}
                             </div>
                             <p className="text-[10px] text-muted font-mono truncate">
                               From: {ix.from}
                             </p>
                           </div>

                           <div className="text-right">
                             <p className="text-xs font-mono font-bold" style={{ color: typeProps.color }}>
                               {typeProps.weight}
                             </p>
                             <p className="text-[9px] text-muted uppercase">Base</p>
                           </div>
                         </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
