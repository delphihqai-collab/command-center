import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export async function ActivityFeed() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("agent_logs")
    .select("id, action, detail, created_at, agents!inner(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const items = logs ?? [];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RealtimeRefresh table="agent_logs" />
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {items.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-indigo-400">
                      {(log.agents as unknown as { name: string })?.name}
                    </span>
                    <span className="text-sm text-zinc-50">{log.action}</span>
                  </div>
                  {log.detail && (
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {log.detail}
                    </p>
                  )}
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(log.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
