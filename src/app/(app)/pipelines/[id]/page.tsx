import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default async function PipelineRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("pipeline_runs")
    .select("*, workflow:workflow_id(name, steps)")
    .eq("id", id)
    .single();

  if (!run) notFound();

  const wf = run.workflow as unknown as { name: string; steps: unknown[] } | null;
  const steps = Array.isArray(wf?.steps) ? wf.steps : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">
          Pipeline Run
        </h1>
        <p className="text-sm text-zinc-400">
          Workflow: {wf?.name ?? "Unknown"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={run.status} />
        <span className="text-xs text-zinc-500">
          Trigger: {run.trigger_type ?? "manual"}
        </span>
        <span className="text-xs text-zinc-500">
          Started{" "}
          {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
        </span>
        {run.completed_at && (
          <span className="text-xs text-zinc-500">
            Completed{" "}
            {formatDistanceToNow(new Date(run.completed_at), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>

      {run.error && (
        <Card className="border-red-800 bg-red-950/30">
          <CardContent className="py-3">
            <p className="text-sm text-red-400">{run.error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Workflow Steps ({steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="text-sm text-zinc-500">No steps defined.</p>
          ) : (
            <div className="space-y-2">
              {steps.map((step: Record<string, unknown>, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                    {i + 1}
                  </div>
                  <span className="text-sm text-zinc-200">
                    {String(step.name ?? `Step ${i + 1}`)}
                  </span>
                  {step.type && (
                    <span className="text-xs text-zinc-500">
                      ({String(step.type)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(run.input_data && Object.keys(run.input_data as Record<string, unknown>).length > 0) && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Input Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs text-zinc-300">
              {JSON.stringify(run.input_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {(run.output_data && Object.keys(run.output_data as Record<string, unknown>).length > 0) && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Output Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs text-zinc-300">
              {JSON.stringify(run.output_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
