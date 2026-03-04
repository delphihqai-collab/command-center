import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { CostChart } from "./_components/cost-chart";
import { CostExportButton } from "./_components/cost-export-button";

async function CostKPIs() {
  const supabase = await createClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [todayRes, weekRes, monthRes, allTimeRes] = await Promise.all([
    supabase.from("agent_token_usage").select("cost_usd").gte("recorded_at", todayStart),
    supabase.from("agent_token_usage").select("cost_usd").gte("recorded_at", weekStart),
    supabase.from("agent_token_usage").select("cost_usd").gte("recorded_at", monthStart),
    supabase.from("agent_token_usage").select("cost_usd"),
  ]);

  const sum = (data: { cost_usd: number }[] | null) =>
    (data ?? []).reduce((s, r) => s + Number(r.cost_usd), 0);

  const kpis = [
    { label: "Today", value: sum(todayRes.data) },
    { label: "This Week", value: sum(weekRes.data) },
    { label: "This Month", value: sum(monthRes.data) },
    { label: "All Time", value: sum(allTimeRes.data) },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              ${kpi.value.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function AgentBreakdownTable() {
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("id, slug, name")
    .order("created_at", { ascending: true });

  const { data: usage } = await supabase
    .from("agent_token_usage")
    .select("agent_id, model, input_tokens, output_tokens, cost_usd, recorded_at")
    .order("recorded_at", { ascending: false });

  const allAgents = agents ?? [];
  const allUsage = usage ?? [];

  // Aggregate by agent
  const agentStats = allAgents.map((agent) => {
    const agentUsage = allUsage.filter((u) => u.agent_id === agent.id);
    const totalInput = agentUsage.reduce((s, u) => s + u.input_tokens, 0);
    const totalOutput = agentUsage.reduce((s, u) => s + u.output_tokens, 0);
    const totalCost = agentUsage.reduce((s, u) => s + Number(u.cost_usd), 0);
    const lastModel = agentUsage[0]?.model ?? "—";
    const lastRecorded = agentUsage[0]?.recorded_at ?? null;

    return { ...agent, totalInput, totalOutput, totalCost, lastModel, lastRecorded };
  });

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Agent Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Agent</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Model</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Input Tokens</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Output Tokens</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Cost (USD)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Last Recorded</th>
              </tr>
            </thead>
            <tbody>
              {agentStats.map((agent) => (
                <tr key={agent.id} className="border-b border-zinc-800">
                  <td className="px-3 py-2 text-zinc-50">{agent.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">{agent.lastModel}</td>
                  <td className="px-3 py-2 text-right text-zinc-300">{agent.totalInput.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-zinc-300">{agent.totalOutput.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-50">${agent.totalCost.toFixed(4)}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {agent.lastRecorded
                      ? new Date(agent.lastRecorded).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

async function CostTrend() {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [agentsRes, usageRes] = await Promise.all([
    supabase.from("agents").select("slug, name").order("created_at", { ascending: true }),
    supabase
      .from("agent_token_usage")
      .select("agent_id, cost_usd, recorded_at, agents!agent_token_usage_agent_id_fkey(slug)")
      .gte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: true }),
  ]);

  const agents = agentsRes.data ?? [];
  const usage = usageRes.data ?? [];

  // Group by date and agent slug
  const dateMap: Record<string, Record<string, number>> = {};
  for (const u of usage) {
    const date = new Date(u.recorded_at).toISOString().slice(0, 10);
    const slug = (u.agents as unknown as { slug: string } | null)?.slug ?? "unknown";
    if (!dateMap[date]) dateMap[date] = {};
    dateMap[date][slug] = (dateMap[date][slug] ?? 0) + Number(u.cost_usd);
  }

  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agentCosts]) => ({
      date,
      ...agentCosts,
    }));

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Cost Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No cost data yet.</p>
        ) : (
          <CostChart data={chartData} agents={agents} />
        )}
      </CardContent>
    </Card>
  );
}

export default async function CostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-zinc-400" />
          <h1 className="text-2xl font-semibold text-zinc-50">Token & Cost Tracking</h1>
        </div>
        <CostExportButton />
      </div>

      <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
        <CostKPIs />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
        <AgentBreakdownTable />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
        <CostTrend />
      </Suspense>
    </div>
  );
}
