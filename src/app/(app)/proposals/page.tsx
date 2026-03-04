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
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

function GateIcon({ cleared }: { cleared: boolean | null }) {
  return cleared ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  ) : (
    <Clock className="h-4 w-4 text-amber-400" />
  );
}

interface Props {
  searchParams: Promise<{ status?: string; outcome?: string }>;
}

export default async function ProposalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("proposals")
    .select("*, leads!inner(company_name)")
    .order("updated_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.outcome) {
    query = query.eq("outcome", params.outcome);
  }

  const { data: proposals } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Proposals</h1>
        <p className="text-sm text-zinc-400">
          {proposals?.length ?? 0} proposals
        </p>
      </div>

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
            {!proposals || proposals.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={9} className="text-center text-zinc-500">
                  No proposals found.
                </TableCell>
              </TableRow>
            ) : (
              proposals.map((p) => (
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
    </div>
  );
}
