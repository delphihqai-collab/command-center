"use client";

import Link from "next/link";
import { X, MessageSquare, ScrollText } from "lucide-react";
import { StatusDot } from "./status-dot";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface AgentSheetProps {
  agent: {
    id: string;
    slug: string;
    name: string;
    status: string;
    last_heartbeat_at: string | null;
    recentLogs: { id: string; action: string; detail: string | null; created_at: string }[];
  };
  onClose: () => void;
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

export function AgentSheet({ agent, onClose }: AgentSheetProps) {
  const emoji = AGENT_EMOJIS[agent.slug] ?? "🤖";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <button
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      {/* Sheet */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <h2 className="text-lg font-semibold text-zinc-50">{agent.name}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Status */}
          <div>
            <StatusDot status={agent.status} />
          </div>

          {/* Last heartbeat */}
          <div>
            <p className="text-xs font-medium text-zinc-400">Last Heartbeat</p>
            <p className="text-sm text-zinc-300">
              {agent.last_heartbeat_at
                ? formatDistanceToNow(new Date(agent.last_heartbeat_at), { addSuffix: true })
                : "No heartbeat recorded"}
            </p>
          </div>

          {/* Recent logs */}
          <div>
            <p className="text-xs font-medium text-zinc-400">Recent Activity</p>
            {agent.recentLogs.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">No recent activity</p>
            ) : (
              <div className="mt-1 space-y-2">
                {agent.recentLogs.map((log) => (
                  <div key={log.id} className="rounded bg-zinc-900 px-3 py-2">
                    <p className="text-xs font-medium text-zinc-300">{log.action}</p>
                    {log.detail && (
                      <p className="line-clamp-2 text-xs text-zinc-500">{log.detail}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild size="sm" className="flex-1 gap-1 bg-indigo-600 text-xs hover:bg-indigo-700">
              <Link href={`/agents/${agent.slug}`}>
                <MessageSquare className="h-3 w-3" />
                View Agent
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1 gap-1 border-zinc-700 text-xs">
              <Link href={`/logs?agent=${agent.slug}`}>
                <ScrollText className="h-3 w-3" />
                View Logs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
