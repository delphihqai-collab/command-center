"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Radio, Search, RefreshCw } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  component: string;
  message: string;
  priority: string;
}

const TIME_RANGES = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
] as const;

const SOURCES = [
  { label: "All", value: "all" },
  { label: "Gateway", value: "gateway" },
  { label: "App", value: "app" },
] as const;

function getPriorityColor(priority: string, message: string): string {
  // journald priorities: 0=emerg, 1=alert, 2=crit, 3=err, 4=warn, 5=notice, 6=info, 7=debug
  const p = Number(priority);
  if (p <= 3) return "text-red-400";
  if (p === 4) return "text-amber-400";

  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("fail")) return "text-red-400";
  if (lower.includes("warn") || lower.includes("slow")) return "text-amber-400";
  return "text-zinc-300";
}

function getSourceBadge(source: string): string {
  if (source === "Gateway")
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function LogViewer() {
  const [source, setSource] = useState("all");
  const [timeRange, setTimeRange] = useState(24);
  const [searchText, setSearchText] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [liveTail, setLiveTail] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const since = new Date(
      Date.now() - timeRange * 60 * 60 * 1000
    ).toISOString();

    const params = new URLSearchParams({
      source,
      since,
      lines: "300",
    });
    if (searchText.trim()) {
      params.set("grep", searchText.trim());
    }

    try {
      const res = await fetch(`/api/logs/journal?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { entries: LogEntry[] };
        setLogs(data.entries);
      }
    } catch {
      // Network error — keep existing logs
    }
    setLoading(false);
  }, [source, timeRange, searchText]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live tail polling
  useEffect(() => {
    if (!liveTail) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [liveTail, fetchLogs]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border border-zinc-700 bg-zinc-800 p-0.5">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                source === s.value
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

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
          onClick={() => fetchLogs()}
          className="rounded-md border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:text-zinc-200"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>

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
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Component
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Message
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
                  className="whitespace-nowrap px-4 py-2 text-xs text-zinc-500"
                  title={log.timestamp}
                >
                  {formatDistanceToNow(new Date(log.timestamp), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${getSourceBadge(log.source)}`}
                  >
                    {log.source}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <code
                    className={`rounded bg-zinc-800 px-1.5 py-0.5 text-xs ${getPriorityColor(log.priority, log.message)}`}
                  >
                    {log.component}
                  </code>
                </td>
                <td className="max-w-xl truncate px-4 py-2 text-xs text-zinc-400">
                  {log.message || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {liveTail && (
          <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-400">
              Live tail active — refreshing every 5s — {logs.length} entries
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
