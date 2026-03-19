"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Network, Layers, Search } from "lucide-react";
import type { Address } from "viem";
import Header from "@/components/Header";
import AgentSidebar from "@/components/AgentSidebar";
import GatekeeperTab from "@/components/GatekeeperTab";
import DiscoveryTab from "@/components/DiscoveryTab";
import TrustGraphTab from "@/components/TrustGraphTab";
import ArchitectureTab from "@/components/ArchitectureTab";
import {
  type AgentData,
  type AgentInteraction,
  getInteractionLogs,
  getAgentReputation,
  getAgentName,
  getAgentDescription,
} from "@/lib/contract";

type TabId = "gatekeeper" | "discovery" | "trustgraph" | "architecture";

interface SearchResult {
  address: string;
  profile: string;
  chainScore: number;
  geminiScore: number;
  finalScore: number;
  reasoning: string;
  isSybilFlagged: boolean;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "gatekeeper", label: "Gatekeeper", icon: Shield },
  { id: "discovery", label: "Discovery", icon: Search },
  { id: "trustgraph", label: "Trust Graph", icon: Network },
  { id: "architecture", label: "Architecture", icon: Layers },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("gatekeeper");
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [interactions, setInteractions] = useState<AgentInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | undefined>(undefined);

  // Fetch on-chain data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all interaction events
      const logs = await getInteractionLogs();
      setInteractions(logs);

      // 2. Extract unique agent addresses
      const agentAddresses = new Set<Address>();
      logs.forEach((log) => {
        agentAddresses.add(log.agent);
      });

      // 3. Fetch reputation for each agent from the contract
      const agentDataPromises = Array.from(agentAddresses).map(
        async (address) => {
          const reputation = await getAgentReputation(address);
          const agentInteractions = logs.filter(
            (l) => l.agent === address
          );

          return {
            address,
            name: getAgentName(address),
            description: getAgentDescription(address),
            reputation,
            interactions: agentInteractions,
          } satisfies AgentData;
        }
      );

      const agentData = await Promise.all(agentDataPromises);
      setAgents(agentData);
    } catch (err) {
      console.error("Failed to fetch on-chain data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchComplete = useCallback((query: string, results: SearchResult[]) => {
    setSearchQuery(query);
    setSearchResults(results);
    setActiveTab("discovery");
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Left: Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${
                  activeTab === tab.id ? "active" : ""
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.id === "gatekeeper" && (
                  <Zap className="w-3 h-3 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "gatekeeper" && (
              <GatekeeperTab onSearchComplete={handleSearchComplete} />
            )}
            {activeTab === "discovery" && (
              <DiscoveryTab
                agents={agents}
                loading={loading}
                searchQuery={searchQuery}
                searchResults={searchResults}
              />
            )}
            {activeTab === "trustgraph" && (
              <TrustGraphTab
                agents={agents}
                interactions={interactions}
                loading={loading}
              />
            )}
            {activeTab === "architecture" && <ArchitectureTab />}
          </motion.div>
        </div>

        {/* Right: Agent Sidebar */}
        <AgentSidebar agents={agents} loading={loading} />
      </main>
    </div>
  );
}
