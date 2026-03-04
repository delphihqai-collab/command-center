import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ApprovalActions } from "./_components/approval-actions";
import { RealtimeRefresh } from "@/components/realtime-refresh";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

async function ApprovalsList({ statusFilter }: { statusFilter?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("approvals")
    .select("*, agents!approvals_created_by_agent_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: approvals } = await query;

  const pendingCount =
    approvals?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <>
      <p className="text-sm text-zinc-400">
        {pendingCount} pending · {approvals?.length ?? 0} total
      </p>

      {!approvals || approvals.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-8 text-center text-zinc-500">
            No approvals found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => {
            const isPending = a.status === "pending";
            return (
              <Card
                key={a.id}
                className="border-zinc-800 bg-zinc-900"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Header row */}
                      <div className="flex items-center gap-2">
                        <StatusBadge status={a.urgency} />
                        <StatusBadge status={a.status} />
                        <span className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(a.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {/* Action summary */}
                      <p className="text-sm font-medium text-zinc-50">
                        {a.action_summary}
                      </p>

                      {/* Context */}
                      {a.context && (
                        <p className="text-sm text-zinc-400">{a.context}</p>
                      )}

                      {/* Draft content preview */}
                      {a.draft_content && (
                        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2">
                          <p className="text-xs text-zinc-500">Draft</p>
                          <p className="mt-1 line-clamp-3 text-xs text-zinc-300">
                            {a.draft_content}
                          </p>
                        </div>
                      )}

                      {/* Risk info */}
                      {a.risk_if_delayed && (
                        <p className="text-xs text-amber-400">
                          Risk if delayed: {a.risk_if_delayed}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                        {a.recipient && <span>To: {a.recipient}</span>}
                        {(a.agents as unknown as { name: string } | null)
                          ?.name && (
                          <span>
                            Agent:{" "}
                            {
                              (a.agents as unknown as { name: string })
                                .name
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPending && (
                      <div className="shrink-0">
                        <ApprovalActions approvalId={a.id} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default async function ApprovalsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Approvals</h1>
      </div>

      <RealtimeRefresh table="approvals" />

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <ApprovalsList statusFilter={params.status} />
      </Suspense>
    </div>
  );
}
