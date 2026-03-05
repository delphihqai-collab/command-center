import Link from "next/link";
import type { PipelineLead } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

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
      <div className="mt-2 flex items-center gap-2">
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
