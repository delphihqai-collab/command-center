"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CostChartProps {
  data: { date: string; [agentSlug: string]: number | string }[];
  agents: { slug: string; name: string }[];
}

const AGENT_COLOURS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export function CostChart({ data, agents }: CostChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          stroke="#71717a"
          fontSize={11}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
          labelStyle={{ color: "#a1a1aa" }}
          itemStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {agents.map((agent, i) => (
          <Line
            key={agent.slug}
            type="monotone"
            dataKey={agent.slug}
            name={agent.name}
            stroke={AGENT_COLOURS[i % AGENT_COLOURS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
