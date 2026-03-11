import { createClient } from "@/lib/supabase/server";
import { Crosshair, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { HermesChat } from "./_components/hermes-chat";
import { QuickActions } from "./_components/quick-actions";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const supabase = await createClient();

  const [{ data: chatActivity }, { data: operations }, { data: agents }] =
    await Promise.all([
      // Recent chat messages (user_message + hermes_response from all command operations)
      supabase
        .from("war_room_activity")
        .select(
          "id, action, detail, created_at, agent:agents(slug, name)"
        )
        .in("action", ["user_message", "hermes_response"])
        .order("created_at", { ascending: true })
        .limit(50),
      // Recent operations
      supabase
        .from("war_rooms")
        .select(
          "id, name, status, priority, objective, type, created_at, resolved_at"
        )
        .neq("type", "core_pipeline")
        .order("created_at", { ascending: false })
        .limit(10),
      // Agent list for quick actions
      supabase
        .from("agents")
        .select("id, slug, name, type, status")
        .order("slug"),
    ]);

  const chatMessages = chatActivity ?? [];
  const recentOps = operations ?? [];
  const activeOps = recentOps.filter((op) => op.status === "active");

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="war_rooms" />
      <RealtimeRefresh table="war_room_activity" />

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
          <Crosshair className="h-7 w-7 text-indigo-400" />
          Command
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Issue commands to Hermes and manage operations
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Quick Actions
        </h2>
        <QuickActions />
      </div>

      {/* Hermes Chat */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Hermes
        </h2>
        <HermesChat initialMessages={chatMessages} />
      </div>

      {/* Recent Operations */}
      {recentOps.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Recent Operations{" "}
              {activeOps.length > 0 && `(${activeOps.length} active)`}
            </h2>
            <Link
              href="/operations"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentOps.slice(0, 5).map((op) => (
              <Link key={op.id} href={`/operations/${op.id}`}>
                <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
                  <CardContent className="flex items-center gap-4 p-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        op.status === "active"
                          ? "bg-indigo-950/40 text-indigo-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {op.name}
                      </p>
                      {op.objective && (
                        <p className="truncate text-xs text-zinc-500">
                          {op.objective}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          op.status === "active"
                            ? "border-emerald-700 text-emerald-400"
                            : "border-zinc-700 text-zinc-500"
                        }
                      >
                        {op.status}
                      </Badge>
                      <span className="text-[10px] text-zinc-600">
                        {formatDistanceToNow(new Date(op.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
