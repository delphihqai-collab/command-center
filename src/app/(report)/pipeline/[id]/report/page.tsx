import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PIPELINE_STAGE_LABELS } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";
import { format } from "date-fns";
import { PrintTrigger, PrintToolbar } from "./_components/print-trigger";

interface Props {
  params: Promise<{ id: string }>;
}

function parseBriefSections(brief: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  // Remove the outer code fence if present
  const cleaned = brief.replace(/^```[\s\S]*?\n/, "").replace(/\n```\s*$/, "");
  // Split on the ────── separator lines
  const parts = cleaned.split(/─{10,}\n/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check if the first line looks like a section header (ALL CAPS or short title)
    const lines = trimmed.split("\n");
    const firstLine = lines[0].trim();

    // Headers: all caps, short, no colons at start
    if (
      firstLine.length < 80 &&
      firstLine === firstLine.toUpperCase() &&
      !firstLine.startsWith("DECISION") &&
      !firstLine.startsWith("BANT SCORE") &&
      !firstLine.startsWith("SDR HANDOFF BRIEF") &&
      lines.length > 1
    ) {
      sections.push({
        title: firstLine
          .replace(/[─\s]+$/, "")
          .split(" ")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" "),
        content: lines.slice(1).join("\n").trim(),
      });
    } else if (trimmed.length > 0) {
      // Content block without clear header — append to previous or create generic
      if (sections.length > 0) {
        sections[sections.length - 1].content += "\n" + trimmed;
      } else {
        sections.push({ title: "Summary", content: trimmed });
      }
    }
  }

  return sections;
}

export default async function PipelineReportPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("pipeline_leads")
    .select("*, assigned_agent:assigned_agent_id(id, name, slug)")
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const agent = lead.assigned_agent as unknown as {
    id: string;
    name: string;
    slug: string;
  } | null;
  const stageLabel =
    PIPELINE_STAGE_LABELS[lead.stage as PipelineStage] ?? lead.stage;
  const metadata = (lead.metadata ?? {}) as Record<string, unknown>;
  const briefSections = lead.sdr_brief
    ? parseBriefSections(lead.sdr_brief)
    : [];

  const painPoints = (metadata.pain_points as string[]) ?? [];
  const compliance = (metadata.compliance as string[]) ?? [];

  return (
    <>
      <PrintTrigger />

      {/* Print-only styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4;
              margin: 18mm 16mm 20mm 16mm;
            }
            @media print {
              body { 
                background: white !important; 
                color: #111 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none !important; }
              .page-break { page-break-before: always; }
            }
            @media screen {
              body { background: #18181b; }
            }
          `,
        }}
      />

      <div className="report-container mx-auto max-w-[210mm] bg-white font-sans text-zinc-900 print:max-w-none print:bg-white">
        {/* Screen-only toolbar */}
        <PrintToolbar backHref={`/pipeline/${id}`} />

        {/* Page 1: Cover + Executive Summary */}
        <div className="px-8 pt-10 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">
                DELPHI
              </p>
              <h1 className="mt-1 text-2xl font-bold text-zinc-900">
                Lead Qualification Report
              </h1>
            </div>
            <div className="text-right text-xs text-zinc-500">
              <p>{format(new Date(), "dd MMMM yyyy")}</p>
              <p>Ref: {id.slice(0, 8).toUpperCase()}</p>
              <p>Confidential</p>
            </div>
          </div>

          {/* Company banner */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="text-xl font-bold text-zinc-900">
              {lead.company_name}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {lead.contact_name}
              {lead.contact_role && ` — ${lead.contact_role}`}
            </p>
            {lead.contact_email && (
              <p className="text-sm text-zinc-500">{lead.contact_email}</p>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-md border border-zinc-200 p-3">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400">
                STAGE
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {stageLabel}
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-3">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400">
                DEAL VALUE
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {lead.deal_value_eur
                  ? `€${Number(lead.deal_value_eur).toLocaleString("en")}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-3">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400">
                CONFIDENCE
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {lead.confidence !== null && lead.confidence !== undefined
                  ? `${lead.confidence}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 p-3">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400">
                BANT SCORE
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {(metadata.bant_score as string) ?? "—"}
              </p>
            </div>
          </div>

          {/* Summary details */}
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between border-b border-zinc-100 py-1">
              <span className="text-zinc-500">Source</span>
              <span className="font-medium text-zinc-900">{lead.source}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 py-1">
              <span className="text-zinc-500">Assigned Agent</span>
              <span className="font-medium text-zinc-900">
                {agent?.name ?? "Unassigned"}
              </span>
            </div>
            {metadata.sector && (
              <div className="flex justify-between border-b border-zinc-100 py-1">
                <span className="text-zinc-500">Sector</span>
                <span className="font-medium capitalize text-zinc-900">
                  {metadata.sector as string}
                </span>
              </div>
            )}
            {metadata.location && (
              <div className="flex justify-between border-b border-zinc-100 py-1">
                <span className="text-zinc-500">Location</span>
                <span className="font-medium text-zinc-900">
                  {metadata.location as string}
                </span>
              </div>
            )}
            {metadata.estimated_labour_cost_eur && (
              <div className="flex justify-between border-b border-zinc-100 py-1">
                <span className="text-zinc-500">Est. Labour Cost</span>
                <span className="font-medium text-zinc-900">
                  €{Number(metadata.estimated_labour_cost_eur).toLocaleString("en")}/yr
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-zinc-100 py-1">
              <span className="text-zinc-500">Created</span>
              <span className="font-medium text-zinc-900">
                {format(new Date(lead.created_at), "dd MMM yyyy HH:mm")}
              </span>
            </div>
          </div>

          {/* Pain Points */}
          {painPoints.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold tracking-wider text-zinc-400">
                KEY PAIN POINTS
              </h3>
              <ul className="mt-2 space-y-1">
                {painPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span className="capitalize">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance */}
          {compliance.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold tracking-wider text-zinc-400">
                COMPLIANCE REQUIREMENTS
              </h3>
              <div className="mt-2 flex gap-2">
                {compliance.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Page 2+: SDR Handoff Brief */}
        {briefSections.length > 0 && (
          <div className="page-break px-8 pt-8 pb-8">
            <div className="mb-6 border-b-2 border-zinc-900 pb-3">
              <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">
                DELPHI — {lead.company_name}
              </p>
              <h2 className="mt-1 text-lg font-bold text-zinc-900">
                SDR Handoff Brief
              </h2>
            </div>

            <div className="space-y-5">
              {briefSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="mb-2 text-xs font-bold tracking-wider text-zinc-500">
                    {section.title.toUpperCase()}
                  </h3>
                  <pre className="whitespace-pre-wrap font-sans text-[11px] leading-[1.6] text-zinc-700">
                    {section.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw SDR Brief fallback (if sections couldn't be parsed) */}
        {briefSections.length === 0 && lead.sdr_brief && (
          <div className="page-break px-8 pt-8 pb-8">
            <div className="mb-6 border-b-2 border-zinc-900 pb-3">
              <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">
                DELPHI — {lead.company_name}
              </p>
              <h2 className="mt-1 text-lg font-bold text-zinc-900">
                SDR Handoff Brief
              </h2>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[10px] leading-[1.5] text-zinc-700">
              {lead.sdr_brief}
            </pre>
          </div>
        )}

        {/* Discovery Notes */}
        {lead.discovery_notes && (
          <div className="page-break px-8 pt-8 pb-8">
            <div className="mb-6 border-b-2 border-zinc-900 pb-3">
              <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">
                DELPHI — {lead.company_name}
              </p>
              <h2 className="mt-1 text-lg font-bold text-zinc-900">
                Discovery Notes
              </h2>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700">
              {lead.discovery_notes}
            </pre>
          </div>
        )}

        {/* Footer on every page (via print CSS) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @page {
                @bottom-center {
                  content: "Confidential — Delphi";
                  font-size: 8pt;
                  color: #a1a1aa;
                }
              }
            `,
          }}
        />
      </div>
    </>
  );
}
