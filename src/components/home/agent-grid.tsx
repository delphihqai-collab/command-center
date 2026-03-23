import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export async function AgentGrid() {
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

  const latestHeartbeat = new Map<
    string,
    { status: string; fired_at: string }
  >();
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
                href={`/fleet/${agent.slug}`}
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
