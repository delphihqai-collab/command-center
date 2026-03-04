"use client";

import { cn } from "@/lib/utils";
import { calculateLeadScore, getScoreColor, getScoreBgColor } from "@/lib/lead-scoring";
import { differenceInDays } from "date-fns";
import type { Lead } from "@/lib/types";

interface KanbanCardProps {
  lead: Lead & { agents?: { name: string } | null };
  onClick: () => void;
}

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const score = calculateLeadScore(lead);
  const daysInStage = lead.last_activity_at
    ? differenceInDays(new Date(), new Date(lead.last_activity_at))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-50 truncate">{lead.company_name}</p>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold",
            getScoreBgColor(score),
            getScoreColor(score)
          )}
        >
          {score}
        </span>
      </div>
      {lead.contact_name && (
        <p className="mt-1 text-xs text-zinc-500 truncate">{lead.contact_name}</p>
      )}
      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
        {lead.sector && <span>{lead.sector}</span>}
        {daysInStage !== null && (
          <span className={cn(daysInStage > 5 && "text-red-400")}>
            {daysInStage}d
          </span>
        )}
      </div>
    </button>
  );
}
