import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  GitBranchPlus,
  Bot,
  Bell,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export async function KPICards() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const [activeLeadsRes, pipelineValueRes, agentsRes, alertsRes, costsRes] =
    await Promise.all([
      supabase
        .from("pipeline_leads")
        .select("id", { count: "exact", head: true })
        .not("stage", "in", '("won","lost","disqualified")'),
      supabase
        .from("pipeline_leads")
        .select("deal_value_eur")
        .not("stage", "in", '("won","lost","disqualified")'),
      supabase.from("agents").select("id, status"),
      supabase
        .from("alert_events")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false),
      supabase
        .from("agent_token_usage")
        .select("cost_usd")
        .gte("created_at", monthStart),
    ]);

  const activeLeads = activeLeadsRes.count ?? 0;
  const pipelineValue = (pipelineValueRes.data ?? []).reduce(
    (sum, r) => sum + (r.deal_value_eur ?? 0),
    0
  );
  const agents = agentsRes.data ?? [];
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const openAlerts = alertsRes.count ?? 0;
  const mtdCost = (costsRes.data ?? []).reduce(
    (sum, r) => sum + (r.cost_usd ?? 0),
    0
  );

  const kpis = [
    {
      label: "Active Leads",
      value: activeLeads.toString(),
      icon: GitBranchPlus,
      color: "text-indigo-400",
      href: "/pipeline",
    },
    {
      label: "Pipeline Value",
      value: `\u20AC${pipelineValue.toLocaleString("en-GB")}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      href: "/pipeline",
    },
    {
      label: "Active Agents",
      value: `${activeAgents}/${agents.length}`,
      icon: Bot,
      color: "text-emerald-400",
      href: "/fleet",
    },
    {
      label: "Open Alerts",
      value: openAlerts.toString(),
      icon: Bell,
      color: openAlerts > 0 ? "text-red-400" : "text-zinc-400",
      href: "/system?tab=settings",
    },
    {
      label: "MTD Cost",
      value: `$${mtdCost.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-400",
      href: "/fleet?tab=costs",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Link key={kpi.label} href={kpi.href}>
          <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-zinc-950 p-2 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-zinc-50">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
