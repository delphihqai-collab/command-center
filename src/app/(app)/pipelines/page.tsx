import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

export default async function PipelinesPage() {
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("pipeline_runs")
    .select("*, workflow:workflow_id(name)")
    .order("started_at", { ascending: false })
    .limit(50);

  const items = runs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Pipeline Runs</h1>
        <p className="text-sm text-zinc-400">
          Workflow execution history
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No pipeline runs yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((run) => {
            const wf = run.workflow as unknown as { name: string } | null;
            return (
              <a key={run.id} href={`/pipelines/${run.id}`}>
                <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-50">
                        {wf?.name ?? "Unknown Workflow"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Triggered {run.trigger_type ?? "manually"} ·{" "}
                        {formatDistanceToNow(new Date(run.started_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                    {run.completed_at && (
                      <span className="text-xs text-zinc-500">
                        Completed{" "}
                        {formatDistanceToNow(new Date(run.completed_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
