import Link from "next/link";
import type { PipelineLead } from "@/lib/types";
import type { LeadTemperature } from "@/lib/types";
import { LEAD_TEMPERATURE_COLORS, LEAD_TEMPERATURE_LABELS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Globe, Bot } from "lucide-react";

interface Props {
  lead: PipelineLead & { assigned_agent: { id: string; name: string; slug: string } | null };
}

export function PipelineCard({ lead }: Props) {
  const agent = lead.assigned_agent as { id: string; name: string; slug: string } | null;

  return (
    <Link
      href={`/pipeline/${lead.id}`}
      className="block rounded-md border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
    >
      <p className="text-sm font-medium text-zinc-50">{lead.company_name}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{lead.contact_name}</p>
      {lead.contact_role && (
        <p className="text-xs text-zinc-500">{lead.contact_role}</p>
      )}

      {/* Stage-conditional info */}
      {lead.stage === "enrichment" && lead.icp_score != null && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
            ICP {lead.icp_score}
          </span>
          {lead.company_industry && (
            <span className="text-[10px] text-zinc-500">{lead.company_industry}</span>
          )}
        </div>
      )}
      {lead.stage === "atlas_build" && (
        <div className="mt-1.5">
          <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
            ⏳ Building {lead.product_type === "both" ? "website + chatbot" : lead.product_type ?? "product"}
          </span>
        </div>
      )}
      {lead.stage === "product_ready" && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {lead.atlas_website_url && (
            <span className="inline-flex items-center gap-0.5 rounded bg-sky-950 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
              <Globe className="h-2.5 w-2.5" /> Site
            </span>
          )}
          {lead.atlas_chatbot_url && (
            <span className="inline-flex items-center gap-0.5 rounded bg-violet-950 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
              <Bot className="h-2.5 w-2.5" /> Bot
            </span>
          )}
        </div>
      )}
      {lead.stage === "outreach" && lead.sequence_step != null && (
        <div className="mt-1.5">
          <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
            Step {lead.sequence_step} · {lead.touch_count ?? 0} touches
          </span>
        </div>
      )}
      {lead.stage === "engaged" && lead.reply_sentiment && (
        <div className="mt-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            lead.reply_sentiment === "positive" ? "bg-emerald-950 text-emerald-400" :
            lead.reply_sentiment === "negative" ? "bg-red-950 text-red-400" :
            "bg-zinc-800 text-zinc-400"
          }`}>
            {lead.reply_sentiment} reply
          </span>
        </div>
      )}
      {lead.stage === "meeting_booked" && lead.meeting_scheduled_at && (
        <div className="mt-1.5">
          <span className="rounded bg-blue-950 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
            {new Date(lead.meeting_scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {lead.lead_temperature && lead.lead_temperature !== "cold" && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${LEAD_TEMPERATURE_COLORS[lead.lead_temperature as LeadTemperature] ?? ""}`}>
            {LEAD_TEMPERATURE_LABELS[lead.lead_temperature as LeadTemperature] ?? lead.lead_temperature}
          </span>
        )}
        {lead.deal_value_eur && (
          <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
            €{Number(lead.deal_value_eur).toLocaleString("en")}
          </span>
        )}
        {lead.confidence !== null && lead.confidence !== undefined && (
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            {lead.confidence}%
          </span>
        )}
        {agent && (
          <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
            {agent.name}
          </span>
        )}
      </div>
      <p className="mt-2 text-[10px] text-zinc-600">
        {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
      </p>
    </Link>
  );
}
