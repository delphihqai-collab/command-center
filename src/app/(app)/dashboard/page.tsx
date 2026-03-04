import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Target,
  FileText,
  Users,
  DollarSign,
  AlertTriangle,
  Activity,
  Bell,
} from "lucide-react";
import { PipelineFunnelChart } from "./_components/pipeline-funnel-chart";
import { PIPELINE_STAGES } from "@/lib/types";
import { RealtimeRefresh } from "@/components/realtime-refresh";

function CardSkeleton() {
  return <Skeleton className="h-40 w-full rounded-lg" />;
}

/* ────────────── KPI Cards ────────────── */
async function KPICards() {
  const supabase = await createClient();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [leadsWeekRes, proposalsSentRes, clientsRes, revenueRes, alertsRes] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .gte("created_at", oneWeekAgo),
      supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .is("archived_at", null),
      supabase
        .from("clients")
        .select("id, health_status")
        .is("archived_at", null),
      supabase
        .from("clients")
        .select("monthly_value")
        .eq("health_status", "healthy")
        .is("archived_at", null),
      supabase
        .from("alert_events")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false)
        .eq("severity", "critical"),
    ]);

  const leadsThisWeek = leadsWeekRes.count ?? 0;
  const proposalsSent = proposalsSentRes.count ?? 0;
  const clients = clientsRes.data ?? [];
  const activeClients = clients.length;
  const atRiskClients = clients.filter(
    (c) => c.health_status === "at_risk"
  ).length;
  const monthlyRevenue = (revenueRes.data ?? []).reduce(
    (sum, c) => sum + c.monthly_value,
    0
  );
  const criticalAlerts = alertsRes.count ?? 0;

  const kpis = [
    {
      label: "Leads This Week",
      value: leadsThisWeek.toString(),
      icon: Target,
      color: "text-indigo-400",
    },
    {
      label: "Proposals Sent",
      value: proposalsSent.toString(),
      icon: FileText,
      color: "text-amber-400",
    },
    {
      label: "Active Clients",
      value: activeClients.toString(),
      sub: atRiskClients > 0 ? `${atRiskClients} at risk` : undefined,
      icon: Users,
      color: "text-emerald-400",
    },
    {
      label: "Monthly Revenue",
      value: `€${monthlyRevenue.toLocaleString("en-IE")}`,
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      label: "Critical Alerts",
      value: criticalAlerts.toString(),
      icon: Bell,
      color: criticalAlerts > 0 ? "text-red-400" : "text-zinc-400",
      href: "/alerts",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => {
        const content = (
          <Card key={kpi.label} className={`border-zinc-800 bg-zinc-900 ${kpi.href ? "transition-colors hover:border-zinc-700" : ""}`}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-zinc-950 p-2 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-zinc-50">{kpi.value}</p>
                {kpi.sub && (
                  <p className="text-xs text-amber-400">{kpi.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
        if (kpi.href) {
          return <Link key={kpi.label} href={kpi.href}>{content}</Link>;
        }
        return content;
      })}
    </div>
  );
}

/* ────────────── Pipeline Funnel ────────────── */
async function PipelineFunnel() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("stage")
    .is("archived_at", null);

  const allLeads = leads ?? [];

  const funnelData = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: allLeads.filter((l) => l.stage === stage).length,
  }));

  const totalActive = allLeads.filter(
    (l) => l.stage !== "closed_won" && l.stage !== "closed_lost"
  ).length;

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Pipeline Funnel — {totalActive} active leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PipelineFunnelChart data={funnelData} />
      </CardContent>
    </Card>
  );
}

/* ────────────── Critical Flags + Approvals ────────────── */
async function FlagsAndApprovals() {
  const supabase = await createClient();

  const [flagsRes, approvalsRes] = await Promise.all([
    supabase
      .from("agent_reports")
      .select(
        "id, agent_id, report_type, content, flag_level, created_at, agents!inner(name)"
      )
      .eq("flagged", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("approvals")
      .select("id, urgency, action_summary, recipient, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const flags = flagsRes.data ?? [];
  const approvals = approvalsRes.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Critical Flags */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <AlertTriangle className="h-4 w-4" />
            Critical Flags
            {flags.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-xs font-medium text-red-400">
                {flags.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <p className="text-sm text-zinc-500">No critical flags.</p>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <StatusBadge status={flag.flag_level ?? "MEDIUM"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-50">
                      {(flag.agents as unknown as { name: string })?.name}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {typeof flag.content === "object" &&
                      flag.content !== null &&
                      "summary" in flag.content
                        ? String(
                            (flag.content as Record<string, unknown>).summary
                          )
                        : flag.report_type}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(flag.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Approvals */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            Open Approvals
            {approvals.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-medium text-amber-400">
                {approvals.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <p className="text-sm text-zinc-500">No open approvals.</p>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <Link
                  key={approval.id}
                  href="/approvals"
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
                >
                  <StatusBadge status={approval.urgency} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-50">
                      {approval.action_summary}
                    </p>
                    {approval.recipient && (
                      <p className="text-xs text-zinc-400">
                        {approval.recipient}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(approval.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────── Agent Grid with Heartbeats ────────────── */
async function AgentGrid() {
  const supabase = await createClient();

  const [agentsRes, heartbeatsRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id, slug, name, status, model, type")
      .order("slug"),
    supabase
      .from("heartbeats")
      .select("job_name, status, fired_at")
      .order("fired_at", { ascending: false })
      .limit(50),
  ]);

  const agents = agentsRes.data ?? [];
  const heartbeats = heartbeatsRes.data ?? [];

  // Map latest heartbeat per agent slug (job_name often contains slug)
  const latestHeartbeat = new Map<string, { status: string; fired_at: string }>();
  for (const hb of heartbeats) {
    if (!latestHeartbeat.has(hb.job_name)) {
      latestHeartbeat.set(hb.job_name, {
        status: hb.status,
        fired_at: hb.fired_at,
      });
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => {
            const hb = latestHeartbeat.get(agent.slug);
            return (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-50">
                    {agent.name}
                  </span>
                  <StatusBadge status={agent.status} />
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-500">
                      {agent.model}
                    </span>
                  </div>
                  {hb && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          hb.status === "ok"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      {formatDistanceToNow(new Date(hb.fired_at), {
                        addSuffix: true,
                      })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────── Activity Feed ────────────── */
async function ActivityFeed() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("agent_logs")
    .select("id, action, detail, created_at, agents!inner(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const items = logs ?? [];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RealtimeRefresh table="agent_logs" />
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {items.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-indigo-400">
                      {(log.agents as unknown as { name: string })?.name}
                    </span>
                    <span className="text-sm text-zinc-50">{log.action}</span>
                  </div>
                  {log.detail && (
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {log.detail}
                    </p>
                  )}
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(log.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────── Dashboard Page ────────────── */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Operational overview —{" "}
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <Suspense fallback={<CardSkeleton />}>
        <KPICards />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <PipelineFunnel />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <FlagsAndApprovals />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <AgentGrid />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
