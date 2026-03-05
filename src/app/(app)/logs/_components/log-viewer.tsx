"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Radio, Search, RefreshCw, X, ChevronDown } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  component: string;
  message: string;
  priority: string;
}

type Level = "all" | "error" | "warning" | "info";

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

const LEVELS: Array<{ label: string; value: Level }> = [
  { label: "All", value: "all" },
  { label: "Errors", value: "error" },
  { label: "Warnings", value: "warning" },
  { label: "Info", value: "info" },
];

function classifyLevel(priority: string, message: string): Level {
  const p = Number(priority);
  if (p <= 3) return "error";
  if (p === 4) return "warning";
  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("fail")) return "error";
  if (lower.includes("warn") || lower.includes("slow")) return "warning";
  return "info";
}

function getLevelColor(level: Level): string {
  if (level === "error") return "text-red-400";
  if (level === "warning") return "text-amber-400";
  return "text-zinc-300";
}

function getLevelDot(level: Level): string {
  if (level === "error") return "bg-red-500";
  if (level === "warning") return "bg-amber-500";
  return "bg-zinc-500";
}

function getSourceBadge(source: string): string {
  if (source === "Gateway")
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

function PillGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </span>
      <div className="flex gap-0.5 rounded-md border border-zinc-700 bg-zinc-800 p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              value === o.value
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComponentDropdown({
  components,
  selected,
  onChange,
}: {
  components: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSelected = selected.size === 0;
  const label = allSelected
    ? "All components"
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} components`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-[7px] text-xs font-medium text-zinc-300 hover:text-zinc-100"
      >
        {label}
        <ChevronDown className="h-3 w-3 text-zinc-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
          <button
            onClick={() => {
              onChange(new Set());
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
              allSelected
                ? "bg-indigo-600/10 text-indigo-400"
                : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            All
          </button>
          {components.map((c) => {
            const active = selected.has(c);
            return (
              <button
                key={c}
                onClick={() => {
                  const next = new Set(selected);
                  if (active) {
                    next.delete(c);
                  } else {
                    next.add(c);
                  }
                  onChange(next);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                  active
                    ? "bg-indigo-600/10 text-indigo-400"
                    : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-indigo-400" : "bg-zinc-600"
                  }`}
                />
                {c}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LogViewer() {
  const [source, setSource] = useState("all");
  const [timeRange, setTimeRange] = useState(24);
  const [searchText, setSearchText] = useState("");
  const [filterText, setFilterText] = useState("");
  const [level, setLevel] = useState<Level>("all");
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(
    new Set()
  );
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [liveTail, setLiveTail] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch logs from API (server-side filtering: source, time, grep)
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const since = new Date(
      Date.now() - timeRange * 60 * 60 * 1000
    ).toISOString();

    const params = new URLSearchParams({
      source,
      since,
      lines: "500",
    });
    if (searchText.trim()) {
      params.set("grep", searchText.trim());
    }

    try {
      const res = await fetch(`/api/logs/journal?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { entries: LogEntry[] };
        setAllLogs(data.entries);
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
    intervalRef.current = setInterval(fetchLogs, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [liveTail, fetchLogs]);

  // Derive unique components from fetched data
  const availableComponents = useMemo(() => {
    const set = new Set<string>();
    for (const log of allLogs) {
      set.add(log.component);
    }
    return [...set].sort();
  }, [allLogs]);

  // Client-side filtering: level, component, text filter
  const filteredLogs = useMemo(() => {
    const lowerFilter = filterText.toLowerCase();
    return allLogs.filter((log) => {
      // Level filter
      if (level !== "all") {
        const logLevel = classifyLevel(log.priority, log.message);
        if (level === "error" && logLevel !== "error") return false;
        if (level === "warning" && logLevel !== "warning") return false;
        if (level === "info" && logLevel === "error") return false;
        if (level === "info" && logLevel === "warning") return false;
      }
      // Component filter
      if (selectedComponents.size > 0 && !selectedComponents.has(log.component))
        return false;
      // Text filter (instant, client-side)
      if (
        lowerFilter &&
        !log.message.toLowerCase().includes(lowerFilter) &&
        !log.component.toLowerCase().includes(lowerFilter)
      )
        return false;
      return true;
    });
  }, [allLogs, level, selectedComponents, filterText]);

  // Count active client-side filters
  const activeFilterCount =
    (level !== "all" ? 1 : 0) +
    (selectedComponents.size > 0 ? 1 : 0) +
    (filterText ? 1 : 0);

  const clearFilters = () => {
    setLevel("all");
    setSelectedComponents(new Set());
    setFilterText("");
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Source + Time + Search + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <PillGroup
          label="Source"
          options={SOURCES}
          value={source}
          onChange={setSource}
        />
        <PillGroup
          label="Period"
          options={TIME_RANGES.map((t) => ({ label: t.label, value: String(t.hours) }))}
          value={String(timeRange)}
          onChange={(v) => setTimeRange(Number(v))}
        />

        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Grep (server)… press Enter"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchLogs();
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500"
          />
        </div>

        <button
          onClick={fetchLogs}
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

      {/* Row 2: Client-side filters */}
      <div className="flex flex-wrap items-center gap-3">
        <PillGroup
          label="Level"
          options={LEVELS}
          value={level}
          onChange={(v) => setLevel(v as Level)}
        />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            Component
          </span>
          <ComponentDropdown
            components={availableComponents}
            selected={selectedComponents}
            onChange={setSelectedComponents}
          />
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter messages (instant)…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-[7px] text-xs text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs tabular-nums text-zinc-600">
          {filteredLogs.length}
          {filteredLogs.length !== allLogs.length
            ? ` / ${allLogs.length}`
            : ""}{" "}
          entries
        </span>
      </div>

      {/* Log table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="w-36 px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Timestamp
              </th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Source
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Component
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && allLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                  No logs found for the selected filters
                </td>
              </tr>
            )}
            {filteredLogs.map((log) => {
              const logLevel = classifyLevel(log.priority, log.message);
              return (
                <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td
                    className="whitespace-nowrap px-4 py-2 text-xs text-zinc-500"
                    title={format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
                  >
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSource(log.source === "Gateway" ? "gateway" : "app")}
                      className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${getSourceBadge(log.source)}`}
                      title={`Filter to ${log.source}`}
                    >
                      {log.source}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedComponents(new Set([log.component]))}
                      className="group flex items-center gap-1.5"
                      title={`Filter to ${log.component}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getLevelDot(logLevel)}`}
                      />
                      <code
                        className={`rounded bg-zinc-800 px-1.5 py-0.5 text-xs transition-colors group-hover:bg-zinc-700 ${getLevelColor(logLevel)}`}
                      >
                        {log.component}
                      </code>
                    </button>
                  </td>
                  <td className="max-w-xl truncate px-4 py-2 text-xs text-zinc-400">
                    {log.message || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer status */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
          {liveTail ? (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-400">
                Live tail — refreshing every 5s
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-600">
              {filteredLogs.length} entries shown
            </span>
          )}
          {activeFilterCount > 0 && (
            <span className="text-xs text-zinc-600">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
