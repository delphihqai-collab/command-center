import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";

const STAGE_COLORS: Record<string, string> = {
  discovery: "bg-zinc-500",
  enrichment: "bg-amber-500",
  human_review: "bg-purple-500",
  outreach: "bg-indigo-500",
  engaged: "bg-cyan-500",
  meeting_booked: "bg-blue-500",
  meeting_completed: "bg-teal-500",
  proposal_sent: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-red-500",
  disqualified: "bg-zinc-600",
};

export function PipelineFunnel({ stageCounts }: { stageCounts: Record<string, number> }) {
  const maxCount = Math.max(...Object.values(stageCounts), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-400">Pipeline Funnel</h3>
      <div className="space-y-1.5">
        {PIPELINE_STAGES.map((stage) => {
          const count = stageCounts[stage] ?? 0;
          const pct = (count / maxCount) * 100;
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-32 text-right text-xs text-zinc-500">
                {PIPELINE_STAGE_LABELS[stage]}
              </span>
              <div className="flex-1">
                <div className="h-5 rounded bg-zinc-800/50">
                  <div
                    className={`h-full rounded ${STAGE_COLORS[stage] ?? "bg-zinc-500"} flex items-center px-2 transition-all`}
                    style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  >
                    {count > 0 && (
                      <span className="text-[10px] font-medium text-white">{count}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
