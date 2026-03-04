import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

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

  const [reportsRes, logsRes] = await Promise.all([
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
  ]);

  const reports = reportsRes.data ?? [];
  const logs = logsRes.data ?? [];

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
          </div>
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
