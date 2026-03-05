import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  KanbanSquare,
  Eye,
  Bot,
  Bell,
  DollarSign,
  Activity,
} from "lucide-react";
import { RealtimeRefresh } from "@/components/realtime-refresh";

function CardSkeleton() {
  return <Skeleton className="h-40 w-full rounded-lg" />;
}

/* ────────────── KPI Cards ────────────── */
async function KPICards() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [activeTasksRes, reviewTasksRes, agentsRes, alertsRes, costsRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .not("status", "in", '("inbox","done")'),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "review")
        .is("archived_at", null),
      supabase
        .from("agents")
        .select("id, status"),
      supabase
        .from("alert_events")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false),
      supabase
        .from("agent_token_usage")
        .select("cost_usd")
        .gte("created_at", monthStart),
    ]);

  const activeTasks = activeTasksRes.count ?? 0;
  const reviewTasks = reviewTasksRes.count ?? 0;
  const agents = agentsRes.data ?? [];
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const openAlerts = alertsRes.count ?? 0;
  const mtdCost = (costsRes.data ?? []).reduce(
    (sum, r) => sum + (r.cost_usd ?? 0),
    0
  );

  const kpis = [
    {
      label: "Active Tasks",
      value: activeTasks.toString(),
      icon: KanbanSquare,
      color: "text-indigo-400",
      href: "/tasks",
    },
    {
      label: "In Review",
      value: reviewTasks.toString(),
      icon: Eye,
      color: "text-purple-400",
      href: "/tasks",
    },
    {
      label: "Active Agents",
      value: `${activeAgents}/${agents.length}`,
      icon: Bot,
      color: "text-emerald-400",
      href: "/agents",
    },
    {
      label: "Open Alerts",
      value: openAlerts.toString(),
      icon: Bell,
      color: openAlerts > 0 ? "text-red-400" : "text-zinc-400",
      href: "/alerts",
    },
    {
      label: "MTD Token Cost",
      value: `$${mtdCost.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-400",
      href: "/costs",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

/* ────────────── Recent Tasks ────────────── */
async function RecentTasks() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, created_at, agents:assigned_to(name)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const items = tasks ?? [];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Recent Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RealtimeRefresh table="tasks" />
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-50">{task.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <StatusBadge status={task.priority} />
                    {task.agents && (
                      <span className="text-xs text-zinc-500">
                        {(task.agents as unknown as { name: string })?.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(task.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────── Tasks By Agent ────────────── */
async function TasksByAgent() {
  const supabase = await createClient();

  const [agentsRes, tasksRes] = await Promise.all([
    supabase.from("agents").select("id, name, slug, status").order("slug"),
    supabase
      .from("tasks")
      .select("assigned_to, status")
      .is("archived_at", null)
      .not("status", "eq", "done"),
  ]);

  const agents = agentsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const countMap = new Map<string, number>();
  for (const t of tasks) {
    if (t.assigned_to) {
      countMap.set(t.assigned_to, (countMap.get(t.assigned_to) ?? 0) + 1);
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Tasks by Agent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {agents.map((agent) => {
            const count = countMap.get(agent.id) ?? 0;
            return (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-2 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-50">{agent.name}</span>
                  <StatusBadge status={agent.status} />
                </div>
                <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
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
          Mission Control —{" "}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <RecentTasks />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TasksByAgent />
        </Suspense>
      </div>

      <Suspense fallback={<CardSkeleton />}>
        <AgentGrid />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
