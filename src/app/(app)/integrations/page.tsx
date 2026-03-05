import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import { IntegrationActions } from "./_components/integration-actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();

  const { data: integrations } = await supabase
    .from("integrations")
    .select("*")
    .order("created_at", { ascending: false });

  const items = integrations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Integrations</h1>
        <p className="text-sm text-zinc-400">
          Third-party connections and sync status
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No integrations configured yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <Card key={i.id} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-50">
                    {i.name}
                  </CardTitle>
                  <StatusBadge status={i.enabled ? "enabled" : "disabled"} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5">
                    {i.type}
                  </span>
                  {i.last_sync_at && (
                    <span>
                      Synced{" "}
                      {formatDistanceToNow(new Date(i.last_sync_at), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <IntegrationActions id={i.id} enabled={i.enabled} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
