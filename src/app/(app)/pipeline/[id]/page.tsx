import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PIPELINE_STAGE_LABELS } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { FileDown, Globe, Bot, Thermometer } from "lucide-react";
import { NotifyHermesButton } from "../_components/notify-hermes-button";
import { StageActions } from "../_components/stage-actions";
import { EnrichmentCard } from "../_components/enrichment-card";
import { SequenceTimeline } from "../_components/sequence-timeline";
import { LeadReviewCard } from "../_components/lead-review-card";
import { LEAD_TEMPERATURE_LABELS, LEAD_TEMPERATURE_COLORS } from "@/lib/types";
import type { LeadTemperature } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PipelineDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead }, { data: sequences }, { data: reviewItem }] = await Promise.all([
    supabase
      .from("pipeline_leads")
      .select("*, assigned_agent:assigned_agent_id(id, name, slug)")
      .eq("id", id)
      .single(),
    supabase
      .from("outreach_sequences")
      .select("*")
      .eq("lead_id", id)
      .order("step_number", { ascending: true }),
    supabase
      .from("review_queue")
      .select("id")
      .eq("lead_id", id)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

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

      {/* Review Card (shown if in human_review with pending review) */}
      {lead.stage === "human_review" && (
        <LeadReviewCard leadId={lead.id} reviewId={reviewItem?.id ?? null} />
      )}

      {/* Atlas Delivery Card (shown for atlas_build / product_ready stages) */}
      {(lead.atlas_website_url || lead.atlas_chatbot_url || lead.stage === "atlas_build") && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Atlas Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {lead.product_type && (
                <div>
                  <p className="text-xs text-zinc-500">Product Type</p>
                  <p className="text-sm capitalize text-zinc-50">
                    {lead.product_type === "both" ? "Website + Chatbot" : lead.product_type}
                  </p>
                </div>
              )}
              {lead.atlas_brief_sent_at && (
                <div>
                  <p className="text-xs text-zinc-500">Brief Sent</p>
                  <p className="text-sm text-zinc-400">
                    {format(new Date(lead.atlas_brief_sent_at), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              )}
              {lead.atlas_delivered_at && (
                <div>
                  <p className="text-xs text-zinc-500">Delivered</p>
                  <p className="text-sm text-emerald-400">
                    {format(new Date(lead.atlas_delivered_at), "dd MMM yyyy HH:mm")}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              {lead.atlas_website_url && (
                <a
                  href={lead.atlas_website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-950 px-3 py-1.5 text-sm font-medium text-sky-400 hover:bg-sky-900"
                >
                  <Globe className="h-4 w-4" />
                  Demo Website
                </a>
              )}
              {lead.atlas_chatbot_url && (
                <a
                  href={lead.atlas_chatbot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-950 px-3 py-1.5 text-sm font-medium text-violet-400 hover:bg-violet-900"
                >
                  <Bot className="h-4 w-4" />
                  Demo Chatbot
                </a>
              )}
              {lead.stage === "atlas_build" && !lead.atlas_website_url && !lead.atlas_chatbot_url && (
                <p className="text-sm text-amber-400">
                  ⏳ Build in progress — waiting for Atlas delivery
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Card (shown when lead has temperature or engagement score) */}
      {(lead.lead_temperature || lead.engagement_score) && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Thermometer className="h-4 w-4" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {lead.lead_temperature && (
                <div>
                  <p className="text-xs text-zinc-500">Temperature</p>
                  <span className={`mt-1 inline-block rounded px-2 py-0.5 text-sm font-medium ${LEAD_TEMPERATURE_COLORS[lead.lead_temperature as LeadTemperature] ?? ""}`}>
                    {LEAD_TEMPERATURE_LABELS[lead.lead_temperature as LeadTemperature] ?? lead.lead_temperature}
                  </span>
                </div>
              )}
              {lead.engagement_score != null && lead.engagement_score > 0 && (
                <div>
                  <p className="text-xs text-zinc-500">Engagement Score</p>
                  <span className="mt-1 text-2xl font-bold text-indigo-400">{lead.engagement_score}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Scores */}
      {(lead.icp_score != null || lead.intent_score != null) && (
        <div className="flex gap-4">
          {lead.icp_score != null && (
            <Card className="flex-1 border-zinc-800 bg-zinc-900">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500">ICP Score</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-indigo-400">{lead.icp_score}</span>
                  <span className="text-xs text-zinc-600">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${lead.icp_score}%` }} />
                </div>
              </CardContent>
            </Card>
          )}
          {lead.intent_score != null && (
            <Card className="flex-1 border-zinc-800 bg-zinc-900">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-500">Intent Score</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-amber-400">{lead.intent_score}</span>
                  <span className="text-xs text-zinc-600">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${lead.intent_score}%` }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Enrichment Card */}
      <EnrichmentCard
        companySize={lead.company_size}
        companyIndustry={lead.company_industry}
        companyRevenue={lead.company_revenue}
        companyLocation={lead.company_location}
        companyTechStack={lead.company_tech_stack}
        companyWebsite={lead.company_website}
        linkedinUrl={lead.linkedin_url}
      />

      {/* Trigger Event */}
      {lead.trigger_event && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Trigger Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">{lead.trigger_event}</p>
          </CardContent>
        </Card>
      )}

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
            {lead.channel && (
              <div>
                <p className="text-xs text-zinc-500">Channel</p>
                <p className="text-sm text-zinc-50">{lead.channel}</p>
              </div>
            )}
            {lead.touch_count != null && lead.touch_count > 0 && (
              <div>
                <p className="text-xs text-zinc-500">Touches</p>
                <p className="text-sm text-zinc-50">{lead.touch_count}</p>
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

      {/* Meeting info */}
      {lead.meeting_scheduled_at && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">Meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-400">
              {format(new Date(lead.meeting_scheduled_at), "EEEE, dd MMM yyyy 'at' HH:mm")}
            </p>
            {lead.meeting_notes && (
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                {lead.meeting_notes}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Outreach Timeline */}
      <SequenceTimeline steps={(sequences ?? []).map((s) => ({
        id: s.id,
        step_number: s.step_number,
        channel: s.channel,
        status: s.status,
        sent_at: s.sent_at,
        opened_at: s.opened_at,
        clicked_at: s.clicked_at,
        replied_at: s.replied_at,
        reply_sentiment: s.reply_sentiment,
        message_preview: s.message_preview,
      }))} />

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
