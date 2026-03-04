"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FunnelData {
  stage: string;
  count: number;
}

const COLORS = [
  "#6366f1", // indigo-500 - prospecting
  "#6366f1", // qualification
  "#6366f1", // initial_contact
  "#6366f1", // demo
  "#6366f1", // needs_analysis
  "#6366f1", // proposal_sent
  "#f59e0b", // amber-500 - negotiation
  "#10b981", // emerald-500 - closed_won
  "#ef4444", // red-500 - closed_lost
];

function formatLabel(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PipelineFunnelChart({ data }: { data: FunnelData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" stroke="#71717a" fontSize={12} />
        <YAxis
          type="category"
          dataKey="stage"
          width={120}
          stroke="#71717a"
          fontSize={11}
          tickFormatter={formatLabel}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelFormatter={(label) => formatLabel(String(label))}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
