"use client";

import { StatusDot } from "./status-dot";

interface AgentDeskProps {
  agent: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
  rank: "director" | "senior" | "standard" | "support" | "research";
  onClick: () => void;
}

const AGENT_EMOJIS: Record<string, string> = {
  hermes: "🪶",
  sdr: "📞",
  ae: "🤝",
  am: "👥",
  finance: "💰",
  legal: "⚖️",
  "market-intelligence": "🔭",
  "knowledge-curator": "📚",
};

const RANK_LABELS: Record<string, string> = {
  director: "Corner Office",
  senior: "Premium Desk",
  standard: "Standard Desk",
  support: "Work Station",
  research: "Research Station",
};

const RANK_STYLES: Record<string, string> = {
  director:
    "col-span-2 min-h-48 border-2 border-indigo-800 shadow-lg shadow-indigo-950/50 p-6",
  senior: "col-span-1 min-h-36 border border-zinc-700 shadow-md p-4",
  standard: "col-span-1 min-h-32 border border-zinc-800 p-4",
  support: "col-span-1 min-h-32 border border-zinc-800 p-3",
  research: "col-span-1 min-h-32 border border-zinc-800 p-3",
};

export function AgentDesk({ agent, rank, onClick }: AgentDeskProps) {
  const emoji = AGENT_EMOJIS[agent.slug] ?? "🤖";
  const rankLabel = RANK_LABELS[rank] ?? "Desk";
  const style = RANK_STYLES[rank] ?? RANK_STYLES.standard;

  return (
    <button
      onClick={onClick}
      className={`relative flex cursor-pointer flex-col items-start justify-between rounded-lg bg-zinc-900 transition-all hover:bg-zinc-800/80 ${style}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-2xl">{emoji}</span>
        <StatusDot status={agent.status} />
      </div>
      <div className="mt-2">
        <p className="text-sm font-semibold text-zinc-50">{agent.name}</p>
        <p className="text-xs text-zinc-500">{rankLabel}</p>
      </div>
      {rank === "director" && (
        <div className="mt-2 flex gap-2 text-xs text-zinc-600">
          <span>🌿</span>
          <span>Window View</span>
          <span>🌿</span>
        </div>
      )}
    </button>
  );
}
