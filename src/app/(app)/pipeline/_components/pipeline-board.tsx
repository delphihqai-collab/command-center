"use client";

import type { PipelineLead, PipelineStage } from "@/lib/types";
import { PipelineCard } from "./pipeline-card";

interface Props {
  columns: Record<string, (PipelineLead & { assigned_agent: { id: string; name: string; slug: string } | null })[]>;
  stageLabels: Record<string, string>;
  agents: { id: string; name: string; slug: string }[];
}

const stageColors: Record<string, string> = {
  discovery: "bg-zinc-500",
  enrichment: "bg-amber-500",
  human_review: "bg-purple-500",
  outreach: "bg-indigo-500",
  engaged: "bg-cyan-500",
  meeting_booked: "bg-blue-500",
};

export function PipelineBoard({ columns, stageLabels, agents }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {Object.entries(columns).map(([stage, leads]) => (
        <div
          key={stage}
          className="flex w-64 min-w-[16rem] flex-col rounded-lg border border-zinc-800 bg-zinc-950"
        >
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
            <div className={`h-2 w-2 rounded-full ${stageColors[stage] ?? "bg-zinc-500"}`} />
            <h3 className="text-xs font-semibold text-zinc-300">
              {stageLabels[stage] ?? stage}
            </h3>
            <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
              {leads.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2">
            {leads.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-600">No leads</p>
            ) : (
              leads.map((lead) => (
                <PipelineCard key={lead.id} lead={lead} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
