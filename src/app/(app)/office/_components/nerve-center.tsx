"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { X, MessageSquare, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ────────── Types ────────── */

interface AgentData {
  id: string;
  slug: string;
  name: string;
  status: string;
  type: string;
  last_heartbeat_at: string | null;
  recentLogs: {
    id: string;
    action: string;
    detail: string | null;
    created_at: string;
  }[];
}

const AGENT_EMOJIS: Record<string, string> = {
  hermes: "🪶",
  sdr: "📞",
  "account-executive": "🤝",
  "account-manager": "👥",
  finance: "💰",
  legal: "⚖️",
  "market-intelligence": "🔭",
  "knowledge-curator": "📚",
};

const AGENT_COLORS: Record<string, string> = {
  hermes: "#818cf8",       // indigo-400
  sdr: "#f59e0b",          // amber-500
  "account-executive": "#34d399", // emerald-400
  "account-manager": "#60a5fa",   // blue-400
  finance: "#a78bfa",      // violet-400
  legal: "#fb923c",        // orange-400
  "market-intelligence": "#22d3ee", // cyan-400
  "knowledge-curator": "#f472b6", // pink-400
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  idle: "#f59e0b",
  built_not_calibrated: "#71717a",
  offline: "#3f3f46",
};

/* ────────── Pulse animation via CSS keyframes (injected once) ────────── */

const PULSE_CSS = `
@keyframes nerve-pulse-out {
  0% { offset-distance: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes nerve-pulse-in {
  0% { offset-distance: 100%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { offset-distance: 0%; opacity: 0; }
}
`;

/* ────────── Component ────────── */

export function NerveCenter({ agents }: { agents: AgentData[] }) {
  const [selected, setSelected] = useState<AgentData | null>(null);
  const [pulses, setPulses] = useState<
    { id: string; pathId: string; direction: "out" | "in"; color: string }[]
  >([]);

  const hermes = agents.find((a) => a.slug === "hermes");
  const satellites = agents.filter((a) => a.slug !== "hermes");

  // Sort satellites in a consistent order
  const ORDER = [
    "sdr",
    "account-executive",
    "account-manager",
    "finance",
    "legal",
    "market-intelligence",
    "knowledge-curator",
  ];
  const sorted = ORDER.map((s) => satellites.find((a) => a.slug === s)).filter(
    Boolean
  ) as AgentData[];
  // Include any agents not in the predefined order
  const extra = satellites.filter((a) => !ORDER.includes(a.slug));
  const allSatellites = [...sorted, ...extra];

  // Generate random pulses to simulate data flow
  const spawnPulse = useCallback(() => {
    if (allSatellites.length === 0) return;
    const agent =
      allSatellites[Math.floor(Math.random() * allSatellites.length)];
    if (agent.status !== "active" && agent.status !== "idle") return;

    const direction = Math.random() > 0.4 ? "out" : "in";
    const pulse = {
      id: `${agent.slug}-${Date.now()}-${Math.random()}`,
      pathId: `path-${agent.slug}`,
      direction,
      color: AGENT_COLORS[agent.slug] ?? "#818cf8",
    };
    setPulses((prev) => [...prev.slice(-20), pulse as typeof prev[number]]);
  }, [allSatellites]);

  useEffect(() => {
    const interval = setInterval(spawnPulse, 800 + Math.random() * 600);
    return () => clearInterval(interval);
  }, [spawnPulse]);

  // Clean old pulses
  useEffect(() => {
    const cleanup = setInterval(() => {
      setPulses((prev) => prev.filter((p) => {
        const age = Date.now() - parseInt(p.id.split("-").slice(-2, -1)[0]);
        return age < 3000;
      }));
    }, 2000);
    return () => clearInterval(cleanup);
  }, []);

  // Layout: center + ring
  const CX = 300;
  const CY = 300;
  const RING_R = 210;
  const NODE_R = 40;
  const HERMES_R = 56;

  const satellitePositions = allSatellites.map((agent, i) => {
    const angle = (i / allSatellites.length) * 2 * Math.PI - Math.PI / 2;
    return {
      agent,
      x: CX + RING_R * Math.cos(angle),
      y: CY + RING_R * Math.sin(angle),
    };
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PULSE_CSS }} />
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[620px] aspect-square">
          <svg
            viewBox="0 0 600 600"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Connection lines */}
            {satellitePositions.map(({ agent, x, y }) => (
              <g key={`line-${agent.slug}`}>
                <path
                  id={`path-${agent.slug}`}
                  d={`M ${CX} ${CY} L ${x} ${y}`}
                  stroke={
                    agent.status === "active"
                      ? AGENT_COLORS[agent.slug] ?? "#818cf8"
                      : "#3f3f46"
                  }
                  strokeWidth={agent.status === "active" ? 2 : 1}
                  strokeOpacity={agent.status === "active" ? 0.35 : 0.15}
                  fill="none"
                />
                {/* Subtle glow for active connections */}
                {agent.status === "active" && (
                  <path
                    d={`M ${CX} ${CY} L ${x} ${y}`}
                    stroke={AGENT_COLORS[agent.slug] ?? "#818cf8"}
                    strokeWidth={6}
                    strokeOpacity={0.08}
                    fill="none"
                  />
                )}
              </g>
            ))}

            {/* Animated pulses */}
            {pulses.map((pulse) => {
              const satPos = satellitePositions.find(
                (s) => `path-${s.agent.slug}` === pulse.pathId
              );
              if (!satPos) return null;
              const d = `M ${CX} ${CY} L ${satPos.x} ${satPos.y}`;
              return (
                <circle
                  key={pulse.id}
                  r={4}
                  fill={pulse.color}
                  opacity={0}
                  style={{
                    offsetPath: `path("${d}")`,
                    animation: `nerve-pulse-${pulse.direction} 1.8s ease-in-out forwards`,
                    filter: `drop-shadow(0 0 6px ${pulse.color})`,
                  }}
                />
              );
            })}

            {/* Satellite agent nodes */}
            {satellitePositions.map(({ agent, x, y }) => {
              const isActive = agent.status === "active";
              const color = AGENT_COLORS[agent.slug] ?? "#818cf8";
              const statusColor = STATUS_COLORS[agent.status] ?? STATUS_COLORS.offline;
              return (
                <g
                  key={agent.slug}
                  className="cursor-pointer"
                  onClick={() => setSelected(agent)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${agent.name} — ${agent.status}`}
                >
                  {/* Outer glow ring for active */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r={NODE_R + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.3}
                    >
                      <animate
                        attributeName="r"
                        values={`${NODE_R + 2};${NODE_R + 8};${NODE_R + 2}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.3;0.1;0.3"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {/* Node bg */}
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_R}
                    fill="#18181b"
                    stroke={isActive ? color : "#3f3f46"}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  {/* Emoji */}
                  <text
                    x={x}
                    y={y - 4}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="20"
                  >
                    {AGENT_EMOJIS[agent.slug] ?? "🤖"}
                  </text>
                  {/* Name */}
                  <text
                    x={x}
                    y={y + 18}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#d4d4d8"
                    fontWeight="600"
                  >
                    {agent.name.length > 12
                      ? agent.name.slice(0, 11) + "…"
                      : agent.name}
                  </text>
                  {/* Status dot */}
                  <circle
                    cx={x + NODE_R - 6}
                    cy={y - NODE_R + 6}
                    r={5}
                    fill={statusColor}
                    stroke="#18181b"
                    strokeWidth={2}
                  />
                </g>
              );
            })}

            {/* Hermes center node */}
            {hermes && (
              <g
                className="cursor-pointer"
                onClick={() => setSelected(hermes)}
                role="button"
                tabIndex={0}
                aria-label={`${hermes.name} — Director`}
              >
                {/* Outer pulse ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={HERMES_R + 6}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth={2}
                  strokeOpacity={0.4}
                >
                  <animate
                    attributeName="r"
                    values={`${HERMES_R + 4};${HERMES_R + 14};${HERMES_R + 4}`}
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.4;0.1;0.4"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Second ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={HERMES_R + 2}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth={1}
                  strokeOpacity={0.2}
                />
                {/* Node */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={HERMES_R}
                  fill="#1e1b4b"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                />
                {/* Emoji */}
                <text
                  x={CX}
                  y={CY - 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="28"
                >
                  🪶
                </text>
                {/* Name */}
                <text
                  x={CX}
                  y={CY + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#c7d2fe"
                  fontWeight="700"
                >
                  HERMES
                </text>
                {/* Status dot */}
                <circle
                  cx={CX + HERMES_R - 8}
                  cy={CY - HERMES_R + 8}
                  r={6}
                  fill={STATUS_COLORS[hermes.status] ?? "#10b981"}
                  stroke="#1e1b4b"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Idle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-500" /> Offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-4 bg-indigo-400 opacity-40" />{" "}
            Data flow
          </span>
        </div>
      </div>

      {/* Agent detail sheet */}
      {selected && (
        <AgentSheet agent={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

/* ────────── Agent Sheet (side panel) ────────── */

function AgentSheet({
  agent,
  onClose,
}: {
  agent: AgentData;
  onClose: () => void;
}) {
  const emoji = AGENT_EMOJIS[agent.slug] ?? "🤖";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <button
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <h2 className="text-lg font-semibold text-zinc-50">{agent.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Status + Type */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  agent.status === "active"
                    ? "bg-emerald-500"
                    : agent.status === "idle"
                      ? "bg-amber-500"
                      : "bg-zinc-500"
                }`}
              />
              <span className="capitalize text-zinc-400">{agent.status}</span>
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {agent.type}
            </span>
          </div>

          {/* Last heartbeat */}
          <div>
            <p className="text-xs font-medium text-zinc-400">Last Heartbeat</p>
            <p className="text-sm text-zinc-300">
              {agent.last_heartbeat_at
                ? formatDistanceToNow(new Date(agent.last_heartbeat_at), {
                    addSuffix: true,
                  })
                : "No heartbeat recorded"}
            </p>
          </div>

          {/* Recent logs */}
          <div>
            <p className="text-xs font-medium text-zinc-400">
              Recent Activity
            </p>
            {agent.recentLogs.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">No recent activity</p>
            ) : (
              <div className="mt-1 space-y-2">
                {agent.recentLogs.map((log) => (
                  <div key={log.id} className="rounded bg-zinc-900 px-3 py-2">
                    <p className="text-xs font-medium text-zinc-300">
                      {log.action}
                    </p>
                    {log.detail && (
                      <p className="line-clamp-2 text-xs text-zinc-500">
                        {log.detail}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 gap-1 bg-indigo-600 text-xs hover:bg-indigo-700"
            >
              <Link href={`/agents/${agent.slug}`}>
                <MessageSquare className="h-3 w-3" />
                View Agent
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 gap-1 border-zinc-700 text-xs"
            >
              <Link href={`/logs?agent=${agent.slug}`}>
                <ScrollText className="h-3 w-3" />
                View Logs
              </Link>
            </Button>
          </div>

          {/* Communication hierarchy note */}
          {agent.slug !== "hermes" && (
            <div className="rounded border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Reporting Chain
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Reports to <span className="text-indigo-400">Hermes</span>{" "}
                directly. Does not communicate with humans.
              </p>
            </div>
          )}
          {agent.slug === "hermes" && (
            <div className="rounded border border-indigo-800/30 bg-indigo-950/20 p-3">
              <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
                Director
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Central orchestrator. All agents report here. Only point of
                contact with Delphi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
