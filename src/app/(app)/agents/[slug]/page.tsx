import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AgentDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!agent) notFound();

  const [reportsRes, logsRes, tasksRes, commsRes] = await Promise.all([
    supabase
      .from("agent_reports")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("agent_logs")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("tasks")
      .select("id, title, status, priority, updated_at")
      .eq("assigned_to", agent.id)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("agent_comms")
      .select("id, message, channel, created_at, from_agent:from_agent_id(name), to_agent:to_agent_id(name)")
      .or(`from_agent_id.eq.${agent.id},to_agent_id.eq.${agent.id}`)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const reports = reportsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const comms = commsRes.data ?? [];
  const capabilities = (agent.capabilities ?? []) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/agents"
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← Agents
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">{agent.name}</h1>
          <StatusBadge status={agent.status} />
        </div>
      </div>

      {/* Identity */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Slug</p>
              <p className="font-mono text-sm text-zinc-50">{agent.slug}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Type</p>
              <p className="text-sm text-zinc-50">{agent.type}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Model</p>
              <p className="font-mono text-sm text-zinc-50">{agent.model}</p>
            </div>
            {agent.last_seen && (
              <div>
                <p className="text-xs text-zinc-500">Last Seen</p>
                <p className="text-sm text-zinc-400">
                  {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                </p>
              </div>
            )}
            {agent.workspace_path && (
              <div className="col-span-2">
                <p className="text-xs text-zinc-500">Workspace</p>
                <p className="font-mono text-sm text-zinc-400">
                  {agent.workspace_path}
                </p>
              </div>
            )}
            {agent.notes && (
              <div className="col-span-full">
                <p className="text-xs text-zinc-500">Notes</p>
                <p className="text-sm text-zinc-300">{agent.notes}</p>
              </div>
            )}
            {capabilities.length > 0 && (
              <div className="col-span-full">
                <p className="text-xs text-zinc-500">Capabilities</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {capabilities.map((cap: string) => (
                    <span
                      key={cap}
                      className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-400 border border-indigo-500/20"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link
              href={`/agents/${agent.slug}/soul`}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Edit SOUL
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tasks */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Assigned Tasks ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No assigned tasks.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-2 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-50">{t.title}</span>
                    <StatusBadge status={t.status} />
                    <StatusBadge status={t.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Comms */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Recent Comms ({comms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comms.length === 0 ? (
            <p className="text-sm text-zinc-500">No communications.</p>
          ) : (
            <div className="space-y-2">
              {comms.map((c) => (
                <div
                  key={c.id}
                  className="rounded border border-zinc-800 bg-zinc-950 p-2"
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="text-indigo-400">
                      {(c.from_agent as unknown as { name: string } | null)?.name ?? "?"}
                    </span>
                    <span>→</span>
                    <span>
                      {(c.to_agent as unknown as { name: string } | null)?.name ?? "broadcast"}
                    </span>
                    <span className="ml-auto">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">{c.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Recent Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-zinc-500">No reports yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.report_type} />
                      {r.flagged && (
                        <StatusBadge status={r.flag_level ?? "MEDIUM"} />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {format(new Date(r.created_at), "dd MMM yyyy HH:mm")}
                    </span>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-400">
                    {JSON.stringify(r.content, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Activity Log ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity logged.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between rounded border border-zinc-800 bg-zinc-950 p-2"
                >
                  <div>
                    <p className="text-sm text-zinc-50">{log.action}</p>
                    {log.detail && (
                      <p className="text-xs text-zinc-400">{log.detail}</p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {format(new Date(log.created_at), "dd MMM HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
