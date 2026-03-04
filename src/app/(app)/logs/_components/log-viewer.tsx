"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Radio, Search } from "lucide-react";

interface AgentInfo {
  id: string;
  name: string;
  slug: string;
}

interface LogEntry {
  id: string;
  agent_name: string;
  action: string;
  detail: string | null;
  created_at: string;
}

const TIME_RANGES = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
] as const;

function getLogColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("error") || lower.includes("fail")) return "text-red-400";
  if (lower.includes("warn")) return "text-amber-400";
  return "text-zinc-300";
}

export function LogViewer({
  agents,
  initialAgent,
}: {
  agents: AgentInfo[];
  initialAgent: string | null;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string>(
    initialAgent ?? ""
  );
  const [timeRange, setTimeRange] = useState(24);
  const [searchText, setSearchText] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [liveTail, setLiveTail] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const from = new Date(
      Date.now() - timeRange * 60 * 60 * 1000
    ).toISOString();

    let query = supabase
      .from("agent_logs")
      .select("id, action, detail, created_at, agents(name)")
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(200);

    if (selectedAgent) {
      const agent = agents.find((a) => a.slug === selectedAgent);
      if (agent) {
        query = query.eq("agent_id", agent.id);
      }
    }

    const { data } = await query;

    const entries: LogEntry[] = (data ?? []).map((row) => ({
      id: row.id,
      agent_name:
        (row.agents as unknown as { name: string } | null)?.name ?? "Unknown",
      action: row.action,
      detail: row.detail,
      created_at: row.created_at,
    }));

    if (searchText) {
      const lower = searchText.toLowerCase();
      setLogs(
        entries.filter(
          (e) =>
            e.action.toLowerCase().includes(lower) ||
            (e.detail?.toLowerCase().includes(lower) ?? false)
        )
      );
    } else {
      setLogs(entries);
    }

    setLoading(false);
  }, [supabase, selectedAgent, timeRange, searchText, agents]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live tail subscription
  useEffect(() => {
    if (!liveTail) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel("agent_logs_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_logs" },
        (payload) => {
          const row = payload.new as Record<string, string | null>;
          const entry: LogEntry = {
            id: row.id ?? crypto.randomUUID(),
            agent_name: "Agent",
            action: row.action ?? "",
            detail: row.detail ?? null,
            created_at: row.created_at ?? new Date().toISOString(),
          };
          setLogs((prev) => [entry, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [liveTail, supabase]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-50"
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1 rounded-md border border-zinc-700 bg-zinc-800 p-0.5">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.label}
              onClick={() => setTimeRange(tr.hours)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                timeRange === tr.hours
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchLogs();
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500"
          />
        </div>

        <button
          onClick={() => setLiveTail(!liveTail)}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
            liveTail
              ? "bg-emerald-600 text-white"
              : "border border-zinc-700 bg-zinc-800 text-zinc-400"
          }`}
        >
          <Radio className="h-4 w-4" />
          Live Tail
        </button>
      </div>

      {/* Log table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Agent
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                  No logs found for the selected filters
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-zinc-800/50">
                <td
                  className="px-4 py-2 text-xs text-zinc-500"
                  title={log.created_at}
                >
                  {formatDistanceToNow(new Date(log.created_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-2 text-xs text-zinc-300">
                  {log.agent_name}
                </td>
                <td className="px-4 py-2">
                  <code
                    className={`rounded bg-zinc-800 px-1.5 py-0.5 text-xs ${getLogColor(log.action)}`}
                  >
                    {log.action}
                  </code>
                </td>
                <td className="max-w-md truncate px-4 py-2 text-xs text-zinc-400">
                  {log.detail ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {liveTail && (
          <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-400">
              Live tail active — {logs.length} entries
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
