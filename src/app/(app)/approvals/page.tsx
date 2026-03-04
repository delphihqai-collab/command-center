import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow, format } from "date-fns";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ApprovalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("approvals")
    .select("*, agents!approvals_created_by_agent_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: approvals } = await query;

  const pendingCount = approvals?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Approvals</h1>
        <p className="text-sm text-zinc-400">
          {pendingCount} pending · {approvals?.length ?? 0} total
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Approve/reject via Discord for V1. UI actions coming in Phase 4.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Urgency</TableHead>
              <TableHead className="text-zinc-400">Action</TableHead>
              <TableHead className="text-zinc-400">Recipient</TableHead>
              <TableHead className="text-zinc-400">Agent</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="text-zinc-400">Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!approvals || approvals.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center text-zinc-500">
                  No approvals found.
                </TableCell>
              </TableRow>
            ) : (
              approvals.map((a) => (
                <TableRow
                  key={a.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <StatusBadge status={a.urgency} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-zinc-50">{a.action_summary}</p>
                    {a.context && (
                      <p className="mt-0.5 text-xs text-zinc-400">{a.context}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {a.recipient ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {(a.agents as unknown as { name: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatDistanceToNow(new Date(a.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {a.decision_at
                      ? format(new Date(a.decision_at), "dd MMM HH:mm")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
