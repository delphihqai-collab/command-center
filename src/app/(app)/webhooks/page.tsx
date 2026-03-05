import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { WebhookActions } from "./_components/webhook-actions";
import { CreateWebhookDialog } from "./_components/create-webhook-dialog";
import { format } from "date-fns";

export default async function WebhooksPage() {
  const supabase = await createClient();

  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false });

  const items = webhooks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Webhooks</h1>
          <p className="text-sm text-zinc-400">{items.length} configured webhooks</p>
        </div>
        <CreateWebhookDialog />
      </div>

      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-8 text-center text-sm text-zinc-500">
            No webhooks configured. Create one to start receiving events.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((wh) => (
            <Card key={wh.id} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-zinc-50">
                      {wh.name}
                    </CardTitle>
                    <StatusBadge status={wh.enabled ? "enabled" : "disabled"} />
                  </div>
                  <WebhookActions mode="manage" webhookId={wh.id} enabled={wh.enabled} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500">URL: </span>
                    <span className="font-mono text-zinc-400">{wh.url}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Events: </span>
                    <span className="text-zinc-400">
                      {(wh.events as string[]).join(", ") || "none"}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-zinc-500">Failures: </span>
                      <span className={wh.consecutive_failures > 0 ? "text-red-400" : "text-zinc-400"}>
                        {wh.consecutive_failures}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Created: </span>
                      <span className="text-zinc-400">
                        {format(new Date(wh.created_at), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
