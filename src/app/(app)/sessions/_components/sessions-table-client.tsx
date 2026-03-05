"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface SessionRow {
  agentId: string;
  agentName: string;
  agentSlug: string;
  sessionKey: string | null;
  sessionKind: string | null;
  model: string | null;
  totalTokens: number | null;
  contextTokens: number | null;
  estimatedCost: number | null;
  lastActivity: string | null;
  contextUsagePercent: number | null;
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
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
            Agent
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
            Session
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
            Kind
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
            Model
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
            Context
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
            Last Activity
          </th>
          <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400">
            Est. Cost
          </th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s, i) => (
          <tr key={s.sessionKey ?? `empty-${s.agentId}-${i}`} className="border-b border-zinc-800">
            <td className="px-4 py-3 text-zinc-50">{s.agentName}</td>
            <td className="px-4 py-3 font-mono text-xs text-zinc-500">
              {s.sessionKey ?? "—"}
            </td>
            <td className="px-4 py-3">
              {s.sessionKind ? (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    s.sessionKind === "direct"
                      ? "bg-indigo-500/10 text-indigo-400"
                      : s.sessionKind === "group"
                        ? "bg-violet-500/10 text-violet-400"
                        : "bg-zinc-700/30 text-zinc-500"
                  }`}
                >
                  {s.sessionKind}
                </span>
              ) : (
                <span className="text-xs text-zinc-600">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-zinc-400">
              {s.model ? (
                <span className="font-mono">
                  {s.model.replace("claude-", "").replace("-20251001", "")}
                </span>
              ) : (
                "—"
              )}
            </td>
            <td className="px-4 py-3">
              {s.totalTokens != null && s.contextTokens ? (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        (s.contextUsagePercent ?? 0) > 80
                          ? "bg-red-500"
                          : (s.contextUsagePercent ?? 0) > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, s.contextUsagePercent ?? 0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-zinc-500">
                    {(s.totalTokens / 1000).toFixed(1)}k/{(s.contextTokens / 1000).toFixed(0)}k
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-600">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-zinc-400">
              {s.lastActivity
                ? formatDistanceToNow(new Date(s.lastActivity), {
                    addSuffix: true,
                  })
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
