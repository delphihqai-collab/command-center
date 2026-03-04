import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

function GateRow({
  label,
  cleared,
  clearedAt,
  notes,
}: {
  label: string;
  cleared: boolean;
  clearedAt: string | null;
  notes?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      {cleared ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
      ) : (
        <Clock className="mt-0.5 h-4 w-4 text-amber-400" />
      )}
      <div>
        <p className="text-sm text-zinc-50">
          {label} — {cleared ? "Cleared" : "Pending"}
        </p>
        {clearedAt && (
          <p className="text-xs text-zinc-500">
            {format(new Date(clearedAt), "dd MMM yyyy HH:mm")}
          </p>
        )}
        {notes && <p className="mt-1 text-xs text-zinc-400">{notes}</p>}
      </div>
    </div>
  );
}

export default async function ProposalDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, leads!inner(company_name, id)")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const lead = proposal.leads as unknown as { company_name: string; id: string };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/proposals"
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← Proposals
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">
            {lead.company_name} — v{proposal.version}
          </h1>
          <StatusBadge status={proposal.status} />
        </div>
        <div className="mt-1 flex gap-4 text-sm text-zinc-400">
          <Link
            href={`/pipeline/${lead.id}`}
            className="hover:text-indigo-400"
          >
            View lead →
          </Link>
          {proposal.value && (
            <span className="font-mono">
              €{Number(proposal.value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
            </span>
          )}
          {proposal.monthly_value && (
            <span className="font-mono">
              €{Number(proposal.monthly_value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}/mo
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gates */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Approval Gates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposal.gate_atlas_required && (
              <GateRow
                label="ATLAS Estimate"
                cleared={proposal.gate_atlas_cleared}
                clearedAt={proposal.gate_atlas_cleared_at}
              />
            )}
            <GateRow
              label="Legal Review"
              cleared={proposal.gate_legal_cleared}
              clearedAt={proposal.gate_legal_cleared_at}
              notes={proposal.gate_legal_notes}
            />
            <GateRow
              label="Finance Review"
              cleared={proposal.gate_finance_cleared}
              clearedAt={proposal.gate_finance_cleared_at}
              notes={proposal.gate_finance_notes}
            />
            <Separator className="bg-zinc-800" />
            <GateRow
              label="Boss Approval"
              cleared={proposal.boss_approved}
              clearedAt={proposal.boss_approved_at}
            />
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500">Payment Terms</p>
              <p className="text-sm text-zinc-50">{proposal.payment_terms}</p>
            </div>
            {proposal.scope_summary && (
              <div>
                <p className="text-xs text-zinc-500">Scope</p>
                <p className="text-sm text-zinc-300">{proposal.scope_summary}</p>
              </div>
            )}
            <Separator className="bg-zinc-800" />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-zinc-500">Sent</p>
                <p className="text-sm text-zinc-50">
                  {proposal.sent_at
                    ? format(new Date(proposal.sent_at), "dd MMM yyyy")
                    : "Not sent"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Outcome</p>
                {proposal.outcome ? (
                  <StatusBadge status={proposal.outcome} />
                ) : (
                  <p className="text-sm text-zinc-500">Pending</p>
                )}
              </div>
              <div>
                <p className="text-xs text-zinc-500">Follow-ups</p>
                <div className="flex gap-1 text-xs">
                  <span className={proposal.follow_up_48h_sent ? "text-emerald-400" : "text-zinc-600"}>
                    48h
                  </span>
                  <span className={proposal.follow_up_5d_sent ? "text-emerald-400" : "text-zinc-600"}>
                    5d
                  </span>
                  <span className={proposal.follow_up_10d_sent ? "text-emerald-400" : "text-zinc-600"}>
                    10d
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
