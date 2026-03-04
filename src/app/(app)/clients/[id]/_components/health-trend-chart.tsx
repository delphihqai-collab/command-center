"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface HealthRecord {
  id: string;
  health_status: string;
  product_activity_signal: string | null;
  invoice_status_signal: string | null;
  communication_signal: string | null;
  sentiment_signal: string | null;
  created_at: string;
}

// Convert signal to numeric: green=100, yellow=50, red=0
function signalToScore(signal: string | null): number {
  if (signal === "green") return 100;
  if (signal === "yellow") return 50;
  if (signal === "red") return 0;
  return 50; // default
}

function computeScore(h: HealthRecord): number {
  const signals = [
    h.product_activity_signal,
    h.invoice_status_signal,
    h.communication_signal,
    h.sentiment_signal,
  ];
  const scores = signals.map(signalToScore);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function HealthTrendChart({ history }: { history: HealthRecord[] }) {
  const data = [...history]
    .reverse()
    .map((h) => ({
      date: format(new Date(h.created_at), "dd MMM"),
      score: computeScore(h),
    }));

  if (data.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">Health Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-zinc-500">No health data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Health Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#e4e4e7" }}
            />
            <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: "#818cf8" }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
