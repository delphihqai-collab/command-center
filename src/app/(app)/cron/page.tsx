import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow, format } from "date-fns";
import { CronActions } from "./_components/cron-actions";

export default async function CronPage() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("scheduled_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  const items = tasks ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Scheduler</h1>
        <p className="text-sm text-zinc-400">
          Manage scheduled and recurring tasks
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No scheduled tasks configured.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id} className="border-zinc-800 bg-zinc-900">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-50">{t.name}</p>
                    <StatusBadge status={t.enabled ? "enabled" : "disabled"} />
                    {t.last_status && <StatusBadge status={t.last_status} />}
                  </div>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-zinc-400">{t.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>Schedule: <code className="text-zinc-400">{t.schedule}</code></span>
                    <span>Handler: <code className="text-zinc-400">{t.handler}</code></span>
                    {t.last_run && (
                      <span>
                        Last run:{" "}
                        {formatDistanceToNow(new Date(t.last_run), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                    {t.next_run && (
                      <span>
                        Next: {format(new Date(t.next_run), "MMM d, HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
                <CronActions id={t.id} enabled={t.enabled} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
