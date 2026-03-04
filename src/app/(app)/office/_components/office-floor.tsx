"use client";

import { useState } from "react";
import { AgentDesk } from "./agent-desk";
import { AgentSheet } from "./agent-sheet";

interface AgentData {
  id: string;
  slug: string;
  name: string;
  status: string;
  rank: "director" | "senior" | "standard" | "support" | "research";
  last_heartbeat_at: string | null;
  recentLogs: { id: string; action: string; detail: string | null; created_at: string }[];
}

// Layout order following the office floor plan
const LAYOUT_ORDER = [
  "hermes",
  "ae",
  "am",
  "sdr",
  "finance",
  "legal",
  "market-intelligence",
  "knowledge-curator",
];

export function OfficeFloor({ agents }: { agents: AgentData[] }) {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  const sortedAgents = LAYOUT_ORDER.map(
    (slug) => agents.find((a) => a.slug === slug)
  ).filter(Boolean) as AgentData[];

  // Add any agents not in the layout order
  const remaining = agents.filter((a) => !LAYOUT_ORDER.includes(a.slug));
  const allAgents = [...sortedAgents, ...remaining];

  return (
    <>
      {/* Office floor grid — 4 columns */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {allAgents.map((agent) => (
            <AgentDesk
              key={agent.id}
              agent={agent}
              rank={agent.rank}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      </div>

      {/* Side sheet */}
      {selectedAgent && (
        <AgentSheet
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
}
