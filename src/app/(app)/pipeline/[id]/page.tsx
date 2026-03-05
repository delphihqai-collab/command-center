import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PIPELINE_STAGE_LABELS } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { FileDown } from "lucide-react";
import { NotifyHermesButton } from "../_components/notify-hermes-button";
import { StageActions } from "../_components/stage-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PipelineDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("pipeline_leads")
    .select("*, assigned_agent:assigned_agent_id(id, name, slug)")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const agent = lead.assigned_agent as unknown as { id: string; name: string; slug: string } | null;
  const stageLabel = PIPELINE_STAGE_LABELS[lead.stage as PipelineStage] ?? lead.stage;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pipeline" className="text-sm text-zinc-400 hover:text-zinc-50">
          ← Pipeline
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">{lead.company_name}</h1>
          <StatusBadge status={lead.stage} />
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          {lead.contact_name}
          {lead.contact_role && ` · ${lead.contact_role}`}
          {lead.contact_email && ` · ${lead.contact_email}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <NotifyHermesButton type="pipeline" id={lead.id} />
        <a
          href={`/pipeline/${lead.id}/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
        >
          <FileDown className="h-4 w-4" />
          Download PDF
        </a>
        <StageActions leadId={lead.id} currentStage={lead.stage as PipelineStage} />
      </div>

      {/* Info Card */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Stage</p>
              <p className="text-sm text-zinc-50">{stageLabel}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Source</p>
              <p className="text-sm text-zinc-50">{lead.source}</p>
            </div>
            {agent && (
              <div>
                <p className="text-xs text-zinc-500">Assigned To</p>
                <Link href={`/agents/${agent.slug}`} className="text-sm text-indigo-400 hover:underline">
                  {agent.name}
                </Link>
              </div>
            )}
            {lead.deal_value_eur && (
              <div>
                <p className="text-xs text-zinc-500">Deal Value</p>
                <p className="text-sm text-emerald-400">
                  €{Number(lead.deal_value_eur).toLocaleString("en")}
                </p>
              </div>
            )}
            {lead.confidence !== null && lead.confidence !== undefined && (
              <div>
                <p className="text-xs text-zinc-500">Confidence</p>
                <p className="text-sm text-zinc-50">{lead.confidence}%</p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="text-sm text-zinc-400">
                {format(new Date(lead.created_at), "dd MMM yyyy HH:mm")}
                {" · "}
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </p>
            </div>
            {lead.closed_at && (
              <div>
                <p className="text-xs text-zinc-500">Closed</p>
                <p className="text-sm text-zinc-400">
                  {format(new Date(lead.closed_at), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SDR Brief */}
      {lead.sdr_brief && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">SDR Handoff Brief</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-md bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
              {lead.sdr_brief}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Discovery Notes */}
      {lead.discovery_notes && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Discovery Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-md bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
              {lead.discovery_notes}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {lead.metadata && Object.keys(lead.metadata as Record<string, unknown>).length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap rounded-md bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
              {JSON.stringify(lead.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
