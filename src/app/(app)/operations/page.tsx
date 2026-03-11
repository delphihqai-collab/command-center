import { createClient } from "@/lib/supabase/server";
import { Activity, CheckCircle2, Clock, Crosshair } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const supabase = await createClient();

  const { data: operations } = await supabase
    .from("war_rooms")
    .select(
      "*, agents:war_room_agents(id, agent_id, role, agent:agents(id, slug, name, type, status)), activity:war_room_activity(id, agent_id, action, detail, created_at)"
    )
    .neq("type", "core_pipeline")
    .order("created_at", { ascending: false })
    .limit(50);

  const ops = operations ?? [];
  const activeOps = ops.filter((op) => op.status === "active");
  const resolvedOps = ops.filter((op) => op.status === "resolved");
  const archivedOps = ops.filter(
    (op) => op.status !== "active" && op.status !== "resolved"
  );

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="war_rooms" />

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
          <Activity className="h-7 w-7 text-indigo-400" />
          Operations
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {activeOps.length} active · {resolvedOps.length} completed
        </p>
      </div>

      {/* Active */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Active ({activeOps.length})
        </h2>
        {activeOps.length > 0 ? (
          <div className="space-y-2">
            {activeOps.map((op) => (
              <OperationCard key={op.id} op={op} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-zinc-800 bg-zinc-900/50">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-zinc-500">
                No active operations. Go to{" "}
                <Link
                  href="/command"
                  className="text-indigo-400 hover:underline"
                >
                  Command
                </Link>{" "}
                to start one.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed */}
      {resolvedOps.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Completed ({resolvedOps.length})
          </h2>
          <div className="space-y-2">
            {resolvedOps.map((op) => (
              <OperationCard key={op.id} op={op} />
            ))}
          </div>
        </div>
      )}

      {/* Archived */}
      {archivedOps.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Other ({archivedOps.length})
          </h2>
          <div className="space-y-2">
            {archivedOps.map((op) => (
              <OperationCard key={op.id} op={op} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OperationCard({
  op,
}: {
  op: {
    id: string;
    name: string;
    status: string;
    priority: string | null;
    objective: string | null;
    type: string | null;
    created_at: string;
    resolved_at: string | null;
    agents: {
      id: string;
      agent_id: string;
      role: string;
      agent: { id: string; slug: string; name: string; type: string; status: string } | null;
    }[];
    activity: { id: string; action: string; detail: string | null; created_at: string }[];
  };
}) {
  const agentCount = op.agents?.length ?? 0;
  const activityCount = op.activity?.length ?? 0;
  const isActive = op.status === "active";
  const isResolved = op.status === "resolved";

  return (
    <Link href={`/operations/${op.id}`}>
      <Card
        className={`border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700 ${
          isResolved ? "opacity-70" : ""
        }`}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isActive
                ? "bg-indigo-950/40 text-indigo-400"
                : isResolved
                  ? "bg-emerald-950/40 text-emerald-400"
                  : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {isResolved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-100">{op.name}</p>
            {op.objective && (
              <p className="truncate text-xs text-zinc-500">{op.objective}</p>
            )}
            <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-600">
              {agentCount > 0 && (
                <span>{agentCount} agent{agentCount > 1 ? "s" : ""}</span>
              )}
              {activityCount > 0 && (
                <span>{activityCount} event{activityCount > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {op.priority && op.priority !== "standard" && (
                <Badge
                  variant="outline"
                  className={
                    op.priority === "critical"
                      ? "border-red-700 text-red-400"
                      : op.priority === "high"
                        ? "border-amber-700 text-amber-400"
                        : "border-zinc-700 text-zinc-400"
                  }
                >
                  {op.priority}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={
                  isActive
                    ? "border-emerald-700 text-emerald-400"
                    : isResolved
                      ? "border-zinc-700 text-zinc-500"
                      : "border-zinc-700 text-zinc-500"
                }
              >
                {op.status}
              </Badge>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-zinc-600">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(op.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
