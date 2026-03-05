import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { notFound } from "next/navigation";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workflow } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .single();

  if (!workflow) notFound();

  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">{workflow.name}</h1>
        <p className="text-sm text-zinc-400">
          {workflow.description ?? "No description"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={workflow.enabled ? "enabled" : "disabled"} />
        <span className="text-xs text-zinc-500">
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="text-sm text-zinc-500">No steps defined.</p>
          ) : (
            <div className="space-y-3">
              {steps.map((step: Record<string, unknown>, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-medium text-indigo-400">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {String(step.name ?? `Step ${i + 1}`)}
                    </p>
                    {step.type && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Type: {String(step.type)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
