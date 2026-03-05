import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "next/link";

export default async function WorkflowsPage() {
  const supabase = await createClient();

  const { data: workflows } = await supabase
    .from("workflows")
    .select("*")
    .order("created_at", { ascending: false });

  const items = workflows ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Workflows</h1>
        <p className="text-sm text-zinc-400">
          Workflow templates for agent orchestration
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No workflows created yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => {
            const steps = Array.isArray(w.steps) ? w.steps : [];
            return (
              <a key={w.id} href={`/workflows/${w.id}`}>
                <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-zinc-50">
                        {w.name}
                      </CardTitle>
                      <StatusBadge status={w.enabled ? "enabled" : "disabled"} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {w.description && (
                      <p className="mb-2 text-xs text-zinc-400 line-clamp-2">
                        {w.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(w.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
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
