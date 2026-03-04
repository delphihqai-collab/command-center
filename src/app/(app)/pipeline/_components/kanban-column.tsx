"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { SortableCard } from "./pipeline-kanban";
import type { Lead } from "@/lib/types";

interface KanbanColumnProps {
  stage: string;
  leads: (Lead & { agents?: { name: string } | null })[];
  onCardClick: (lead: Lead & { agents?: { name: string } | null }) => void;
}

function formatStage(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STAGE_COLORS: Record<string, string> = {
  prospecting: "border-t-zinc-500",
  qualification: "border-t-blue-500",
  initial_contact: "border-t-cyan-500",
  demo: "border-t-violet-500",
  needs_analysis: "border-t-amber-500",
  proposal_sent: "border-t-orange-500",
  negotiation: "border-t-indigo-500",
  closed_won: "border-t-emerald-500",
  closed_lost: "border-t-red-500",
};

export function KanbanColumn({ stage, leads, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] w-64 shrink-0 flex-col rounded-lg border border-t-2 border-zinc-800 bg-zinc-900 p-2",
        STAGE_COLORS[stage] ?? "border-t-zinc-500",
        isOver && "ring-2 ring-indigo-500/50"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-medium text-zinc-400 capitalize">
          {formatStage(stage)}
        </h3>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {leads.length}
        </span>
      </div>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {leads.map((lead) => (
            <SortableCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
