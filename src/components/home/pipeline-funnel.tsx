import { PIPELINE_STAGE_LABELS } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";

const STAGE_COLORS: Record<string, string> = {
  discovery: "bg-sky-500",
  enrichment: "bg-indigo-500",
  atlas_build: "bg-violet-500",
  product_ready: "bg-fuchsia-500",
  human_review: "bg-amber-500",
  outreach: "bg-purple-500",
  engaged: "bg-emerald-500",
  meeting_booked: "bg-emerald-400",
  meeting_completed: "bg-emerald-300",
  proposal_sent: "bg-orange-500",
  won: "bg-emerald-600",
  lost: "bg-red-500",
  disqualified: "bg-zinc-600",
};

interface Props {
  stageCounts: Record<string, number>;
}

export function PipelineFunnel({ stageCounts }: Props) {
  const funnelStages: PipelineStage[] = [
    "discovery",
    "enrichment",
    "atlas_build",
    "product_ready",
    "human_review",
    "outreach",
    "engaged",
    "meeting_booked",
    "won",
  ];

  const data = funnelStages.map((stage) => ({
    stage,
    count: stageCounts[stage] ?? 0,
    color: STAGE_COLORS[stage] ?? "bg-zinc-600",
  }));

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-1.5">
      {data.map((item) => {
        const widthPct = Math.max((item.count / maxCount) * 100, 2);
        return (
          <div key={item.stage} className="flex items-center gap-3">
            <span className="w-28 text-right text-xs text-zinc-400">
              {PIPELINE_STAGE_LABELS[item.stage]}
            </span>
            <div className="flex-1">
              <div
                className={`${item.color} h-5 rounded-sm transition-all`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs font-medium text-zinc-300">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
