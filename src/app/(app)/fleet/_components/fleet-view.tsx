"use client";

import { useState } from "react";
import { LayoutGrid, Network, MessageSquare } from "lucide-react";
import { FleetGrid } from "./fleet-grid";
import { TopologyVisualizer } from "../../office/_components/topology-visualizer";
import { HermesChat } from "../../command/_components/hermes-chat";

interface AgentNode {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  model: string | null;
  last_seen: string | null;
  operations: { id: string; name: string; type: string | null }[];
}

interface DirectLink {
  id: string;
  fromSlug: string;
  toSlug: string;
  fromName: string;
  toName: string;
  channelType: string;
  description: string;
}

interface Activity {
  id: string;
  action: string;
  detail: string | null;
  created_at: string;
  agent: { slug: string; name: string } | null;
}

interface Props {
  agents: AgentNode[];
  directLinks: DirectLink[];
  commFrequency: Record<string, number>;
  chatMessages: Activity[];
}

export function FleetView({
  agents,
  directLinks,
  commFrequency,
  chatMessages,
}: Props) {
  const [view, setView] = useState<"grid" | "topology">("grid");

  return (
    <>
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
        <button
          onClick={() => setView("grid")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            view === "grid"
              ? "bg-zinc-800 text-zinc-50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Grid
        </button>
        <button
          onClick={() => setView("topology")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            view === "topology"
              ? "bg-zinc-800 text-zinc-50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          Topology
        </button>
      </div>

      {view === "grid" ? (
        <FleetGrid agents={agents} />
      ) : (
        <TopologyVisualizer
          agents={agents.map((a) => ({
            id: a.id,
            slug: a.slug,
            name: a.name,
            type: a.type,
            status: a.status,
          }))}
          directLinks={directLinks}
          commFrequency={commFrequency}
        />
      )}

      {/* Hermes Chat */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <MessageSquare className="h-3.5 w-3.5" />
          Talk to Hermes
        </h2>
        <HermesChat initialMessages={chatMessages} />
      </div>
    </>
  );
}
