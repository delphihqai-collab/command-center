"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface SessionRow {
  agentId: string;
  agentName: string;
  agentSlug: string;
  agentStatus: string;
  sessionKey: string | null;
  sessionStatus: string | null;
  startedAt: string | null;
  lastActivity: string | null;
  estimatedCost: number | null;
}

export function SessionsTableClient({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [, setTick] = useState(0);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-800 bg-zinc-900/50">
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Agent</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Session Key</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Status</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Started</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Last Activity</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">Est. Cost</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.agentId} className="border-b border-zinc-800">
            <td className="px-4 py-3 text-zinc-50">{s.agentName}</td>
            <td className="px-4 py-3 font-mono text-xs text-zinc-500">
              {s.sessionKey ? s.sessionKey.slice(0, 12) + "…" : "—"}
            </td>
            <td className="px-4 py-3">
              {s.sessionStatus ? (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    s.sessionStatus === "active"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : s.sessionStatus === "idle"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-zinc-700/30 text-zinc-500"
                  }`}
                >
                  {s.sessionStatus}
                </span>
              ) : (
                <span className="text-xs text-zinc-600">No active session</span>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-zinc-400">
              {s.startedAt
                ? formatDistanceToNow(new Date(s.startedAt), { addSuffix: true })
                : "—"}
            </td>
            <td className="px-4 py-3 text-xs text-zinc-400">
              {s.lastActivity
                ? formatDistanceToNow(new Date(s.lastActivity), { addSuffix: true })
                : "—"}
            </td>
            <td className="px-4 py-3 text-right text-xs text-zinc-300">
              {s.estimatedCost != null ? `$${s.estimatedCost.toFixed(4)}` : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
