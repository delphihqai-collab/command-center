"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

interface AgentNode {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
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

interface Props {
  agents: AgentNode[];
  directLinks: DirectLink[];
  commFrequency: Record<string, number>;
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
  hermes: "#818cf8",
  sdr: "#f59e0b",
  "account-executive": "#34d399",
  "account-manager": "#60a5fa",
  finance: "#a78bfa",
  legal: "#fb923c",
  "market-intelligence": "#22d3ee",
  "knowledge-curator": "#f472b6",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  idle: "#f59e0b",
  built_not_calibrated: "#71717a",
  offline: "#3f3f46",
};

const PULSE_CSS = `
@keyframes topo-pulse-out {
  0% { offset-distance: 0%; opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.8; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes topo-glow {
  0%, 100% { stroke-opacity: 0.15; }
  50% { stroke-opacity: 0.35; }
}
`;

const ORDER = [
  "sdr",
  "account-executive",
  "account-manager",
  "finance",
  "legal",
  "market-intelligence",
  "knowledge-curator",
];

export function TopologyVisualizer({ agents, directLinks, commFrequency }: Props) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [pulses, setPulses] = useState<
    { id: string; path: string; color: string }[]
  >([]);

  const hermes = agents.find((a) => a.slug === "hermes");
  const satellites = ORDER.map((s) => agents.find((a) => a.slug === s)).filter(
    Boolean
  ) as AgentNode[];

  const CX = 380;
  const CY = 300;
  const RING_R = 220;
  const NODE_R = 38;
  const HERMES_R = 52;

  const positions: Record<string, { x: number; y: number }> = {};
  if (hermes) positions[hermes.slug] = { x: CX, y: CY };
  satellites.forEach((agent, i) => {
    const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2;
    positions[agent.slug] = {
      x: CX + RING_R * Math.cos(angle),
      y: CY + RING_R * Math.sin(angle),
    };
  });

  // Spawn pulses on direct links
  const spawnPulse = useCallback(() => {
    if (directLinks.length === 0) return;
    const link = directLinks[Math.floor(Math.random() * directLinks.length)];
    const from = positions[link.fromSlug];
    const to = positions[link.toSlug];
    if (!from || !to) return;

    // Curved path for direct links
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cx = mx - dy * 0.15;
    const cy = my + dx * 0.15;

    setPulses((prev) => [
      ...prev.slice(-15),
      {
        id: `${Date.now()}-${Math.random()}`,
        path: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
        color: AGENT_COLORS[link.fromSlug] ?? "#818cf8",
      },
    ]);
  }, [directLinks, positions]);

  useEffect(() => {
    const interval = setInterval(spawnPulse, 1200 + Math.random() * 800);
    return () => clearInterval(interval);
  }, [spawnPulse]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setPulses((prev) =>
        prev.filter((p) => {
          const ts = parseInt(p.id.split("-")[0]);
          return Date.now() - ts < 2500;
        })
      );
    }, 2000);
    return () => clearInterval(cleanup);
  }, []);

  // Determine which direct links involve the hovered agent
  const hoveredAgentLinks = hoveredAgent
    ? directLinks.filter(
        (l) => l.fromSlug === hoveredAgent || l.toSlug === hoveredAgent
      )
    : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PULSE_CSS }} />

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-6 bg-zinc-500 opacity-40" />
          Hierarchical (Hermes)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-6 rounded bg-cyan-400 opacity-60" style={{ borderTop: "2px dashed #22d3ee" }} />
          Direct Channel (P2P)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Idle
        </span>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[780px] aspect-[38/30]">
          <svg
            viewBox="0 0 760 600"
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hierarchical connections (Hermes to all) */}
            {satellites.map((agent) => {
              const pos = positions[agent.slug];
              if (!pos) return null;
              const isHighlighted =
                hoveredAgent === "hermes" || hoveredAgent === agent.slug;
              return (
                <path
                  key={`hier-${agent.slug}`}
                  d={`M ${CX} ${CY} L ${pos.x} ${pos.y}`}
                  stroke={
                    agent.status === "active"
                      ? isHighlighted
                        ? "#818cf8"
                        : "#52525b"
                      : "#27272a"
                  }
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 0.6 : 0.2}
                  strokeDasharray={isHighlighted ? "none" : "4 4"}
                  fill="none"
                />
              );
            })}

            {/* Direct channels (curved lines) */}
            {directLinks.map((link) => {
              const from = positions[link.fromSlug];
              const to = positions[link.toSlug];
              if (!from || !to) return null;

              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const cx = mx - dy * 0.15;
              const cy = my + dx * 0.15;

              const isHovered =
                hoveredLink === link.id ||
                hoveredAgent === link.fromSlug ||
                hoveredAgent === link.toSlug;

              return (
                <g key={`direct-${link.id}`}>
                  {/* Glow */}
                  {isHovered && (
                    <path
                      d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                      stroke="#22d3ee"
                      strokeWidth={6}
                      strokeOpacity={0.15}
                      fill="none"
                    />
                  )}
                  <path
                    d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                    stroke="#22d3ee"
                    strokeWidth={isHovered ? 2 : 1.5}
                    strokeOpacity={isHovered ? 0.8 : 0.3}
                    strokeDasharray="6 3"
                    fill="none"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLink(link.id)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {!isHovered && (
                      <animate
                        attributeName="stroke-opacity"
                        values="0.2;0.4;0.2"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                </g>
              );
            })}

            {/* Animated pulses on direct channels */}
            {pulses.map((pulse) => (
              <circle
                key={pulse.id}
                r={3}
                fill={pulse.color}
                style={{
                  offsetPath: `path("${pulse.path}")`,
                  animation: "topo-pulse-out 2s ease-in-out forwards",
                  filter: `drop-shadow(0 0 4px ${pulse.color})`,
                }}
              />
            ))}

            {/* Satellite nodes */}
            {satellites.map((agent) => {
              const pos = positions[agent.slug];
              if (!pos) return null;
              const color = AGENT_COLORS[agent.slug] ?? "#818cf8";
              const statusColor =
                STATUS_COLORS[agent.status] ?? STATUS_COLORS.offline;
              const isHovered = hoveredAgent === agent.slug;
              const hasDirectLinks = directLinks.some(
                (l) =>
                  l.fromSlug === agent.slug || l.toSlug === agent.slug
              );

              return (
                <g
                  key={agent.slug}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredAgent(agent.slug)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={agent.name}
                >
                  {/* P2P indicator ring */}
                  {hasDirectLinks && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_R + 6}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth={1}
                      strokeOpacity={isHovered ? 0.5 : 0.15}
                      strokeDasharray="3 3"
                    />
                  )}
                  {/* Active glow */}
                  {agent.status === "active" && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_R + 3}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.2}
                    >
                      <animate
                        attributeName="r"
                        values={`${NODE_R + 1};${NODE_R + 7};${NODE_R + 1}`}
                        dur="3s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.2;0.05;0.2"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R}
                    fill={isHovered ? "#27272a" : "#18181b"}
                    stroke={isHovered ? color : agent.status === "active" ? color : "#3f3f46"}
                    strokeWidth={isHovered ? 2.5 : agent.status === "active" ? 2 : 1}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="18"
                  >
                    {AGENT_EMOJIS[agent.slug] ?? "🤖"}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 16}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#d4d4d8"
                    fontWeight="600"
                  >
                    {agent.name.length > 14
                      ? agent.name.slice(0, 13) + "…"
                      : agent.name}
                  </text>
                  {/* Status dot */}
                  <circle
                    cx={pos.x + NODE_R - 5}
                    cy={pos.y - NODE_R + 5}
                    r={4.5}
                    fill={statusColor}
                    stroke="#18181b"
                    strokeWidth={2}
                  />
                  {/* Type badge */}
                  <text
                    x={pos.x}
                    y={pos.y + NODE_R + 14}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#71717a"
                  >
                    {agent.type}
                  </text>
                </g>
              );
            })}

            {/* Hermes center */}
            {hermes && (
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAgent("hermes")}
                onMouseLeave={() => setHoveredAgent(null)}
                role="button"
                tabIndex={0}
                aria-label="Hermes — Director"
              >
                <circle
                  cx={CX}
                  cy={CY}
                  r={HERMES_R + 6}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth={2}
                  strokeOpacity={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${HERMES_R + 4};${HERMES_R + 12};${HERMES_R + 4}`}
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.1;0.3"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={CX}
                  cy={CY}
                  r={HERMES_R}
                  fill="#1e1b4b"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                />
                <text
                  x={CX}
                  y={CY - 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="26"
                >
                  🪶
                </text>
                <text
                  x={CX}
                  y={CY + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#c7d2fe"
                  fontWeight="700"
                >
                  HERMES
                </text>
                <text
                  x={CX}
                  y={CY + 30}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#818cf8"
                >
                  STRATEGIC HUB
                </text>
              </g>
            )}

            {/* Architecture labels */}
            <text x={20} y={20} fontSize="9" fill="#52525b" fontWeight="600">
              HIERARCHICAL LAYER
            </text>
            <text x={20} y={32} fontSize="8" fill="#3f3f46">
              Strategic decisions, escalations, Delphi interface
            </text>
            <text x={540} y={20} fontSize="9" fill="#22d3ee" fontWeight="600">
              PEER-TO-PEER LAYER
            </text>
            <text x={540} y={32} fontSize="8" fill="#3f3f46">
              Operational queries, specialist access
            </text>
          </svg>
        </div>

        {/* Hovered link tooltip */}
        {hoveredLink && (
          <div className="mt-2 rounded-lg border border-cyan-800/30 bg-cyan-950/20 px-4 py-2 text-xs text-cyan-300">
            {directLinks.find((l) => l.id === hoveredLink)?.description}
          </div>
        )}

        {/* Hovered agent info */}
        {hoveredAgent && (
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
            <span className="font-medium text-zinc-300">
              {AGENT_EMOJIS[hoveredAgent]}{" "}
              {agents.find((a) => a.slug === hoveredAgent)?.name}
            </span>
            {hoveredAgent !== "hermes" && (
              <>
                <span>|</span>
                <span>
                  {
                    directLinks.filter(
                      (l) =>
                        l.fromSlug === hoveredAgent ||
                        l.toSlug === hoveredAgent
                    ).length
                  }{" "}
                  direct channels
                </span>
                <span>|</span>
                <span>Reports to Hermes (strategic)</span>
              </>
            )}
            {hoveredAgent === "hermes" && (
              <>
                <span>|</span>
                <span>Director — Strategic hub + Delphi interface</span>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
