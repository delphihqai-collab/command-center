import { Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { LoadMoreButton } from "@/components/load-more-button";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/pagination";

function GateIcon({ cleared }: { cleared: boolean | null }) {
  return cleared ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  ) : (
    <Clock className="h-4 w-4 text-amber-400" />
  );
}

interface Props {
  searchParams: Promise<{ status?: string; outcome?: string; cursor?: string }>;
}

async function ProposalsTable({
  status,
  outcome,
  cursor,
}: {
  status?: string;
  outcome?: string;
  cursor?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("proposals")
    .select("*, leads!inner(company_name)")
    .order("updated_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (status) query = query.eq("status", status);
  if (outcome) query = query.eq("outcome", outcome);

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.lt("updated_at", decoded.sortValue);
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    return (
      <p className="text-sm text-red-400">
        Failed to load proposals: {error.message}
      </p>
    );
  }

  const proposals = rows ?? [];
  const hasMore = proposals.length > PAGE_SIZE;
  const displayed = hasMore ? proposals.slice(0, PAGE_SIZE) : proposals;
  const nextCursor = hasMore
    ? encodeCursor(
        displayed[displayed.length - 1].id,
        displayed[displayed.length - 1].updated_at
      )
    : null;

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Company</TableHead>
              <TableHead className="text-zinc-400">Ver.</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Value</TableHead>
              <TableHead className="text-center text-zinc-400">ATLAS</TableHead>
              <TableHead className="text-center text-zinc-400">Legal</TableHead>
              <TableHead className="text-center text-zinc-400">Finance</TableHead>
              <TableHead className="text-center text-zinc-400">Boss</TableHead>
              <TableHead className="text-zinc-400">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={9} className="text-center text-zinc-500">
                  No proposals found.
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <Link
                      href={`/proposals/${p.id}`}
                      className="font-medium text-zinc-50 hover:text-indigo-400"
                    >
                      {(p.leads as unknown as { company_name: string }).company_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-zinc-400">v{p.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="font-mono text-zinc-400">
                    {p.value
                      ? `€${Number(p.value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.gate_atlas_required ? (
                      <GateIcon cleared={p.gate_atlas_cleared} />
                    ) : (
                      <XCircle className="mx-auto h-4 w-4 text-zinc-600" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <GateIcon cleared={p.gate_legal_cleared} />
                  </TableCell>
                  <TableCell className="text-center">
                    <GateIcon cleared={p.gate_finance_cleared} />
                  </TableCell>
                  <TableCell className="text-center">
                    <GateIcon cleared={p.boss_approved} />
                  </TableCell>
                  <TableCell>
                    {p.outcome ? (
                      <StatusBadge status={p.outcome} />
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {nextCursor && <LoadMoreButton cursor={nextCursor} />}
    </>
  );
}

export default async function ProposalsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Proposals</h1>
        <p className="text-sm text-zinc-400">Proposal pipeline</p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <ProposalsTable
          status={params.status}
          outcome={params.outcome}
          cursor={params.cursor}
        />
      </Suspense>
    </div>
  );
}
