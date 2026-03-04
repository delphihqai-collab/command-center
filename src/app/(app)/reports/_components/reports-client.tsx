"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  pipeline_value_total: number | null;
  new_leads_count: number | null;
  proposals_sent_count: number | null;
  deals_closed_count: number | null;
  revenue_this_week: number | null;
  agent_cost_total: number | null;
  cost_per_lead: number | null;
  report_data: Record<string, unknown> | null;
  generated_at: string;
}

export function ReportsClient({ reports }: { reports: WeeklyReport[] }) {
  const latest = reports[0];
  const chartData = [...reports].reverse().map((r) => ({
    week: format(new Date(r.week_start), "dd MMM"),
    pipeline: r.pipeline_value_total ?? 0,
    costPerLead: r.cost_per_lead ?? 0,
    leads: r.new_leads_count ?? 0,
    deals: r.deals_closed_count ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Latest Report KPIs */}
      {latest && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Pipeline Value</p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">
                €{(latest.pipeline_value_total ?? 0).toLocaleString("pt-PT")}
              </p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">New Leads</p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">
                {latest.new_leads_count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Deals Closed</p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">
                {latest.deals_closed_count ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Cost per Lead</p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">
                €{(latest.cost_per_lead ?? 0).toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">
                Pipeline Value (Weekly)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="pipeline" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">
                Cost per Lead (Weekly)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="costPerLead"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical reports list */}
      {reports.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-8 text-center text-zinc-500">
            No weekly reports generated yet. HERMES generates these during the
            Friday 18:00 heartbeat.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Report History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div>
                    <p className="text-sm text-zinc-50">
                      Week of {format(new Date(r.week_start), "dd MMM yyyy")}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                      <span>{r.new_leads_count ?? 0} leads</span>
                      <span>{r.proposals_sent_count ?? 0} proposals</span>
                      <span>{r.deals_closed_count ?? 0} closed</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {format(new Date(r.generated_at), "dd MMM HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
