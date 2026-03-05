"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { moveLead } from "../actions";
import { toast } from "sonner";
import type { PipelineStage } from "@/lib/types";
import { PIPELINE_STAGE_LABELS } from "@/lib/types";
import { ArrowRight, X, Trophy } from "lucide-react";

interface Props {
  leadId: string;
  currentStage: PipelineStage;
}

const stageOrder: PipelineStage[] = [
  "new_lead", "sdr_qualification", "qualified", "discovery",
  "proposal", "negotiation", "closed_won",
];

export function StageActions({ leadId, currentStage }: Props) {
  const [isPending, startTransition] = useTransition();

  const currentIndex = stageOrder.indexOf(currentStage);
  const isClosed = ["closed_won", "closed_lost", "disqualified"].includes(currentStage);

  function handleMove(stage: PipelineStage) {
    startTransition(async () => {
      const result = await moveLead(leadId, stage);
      if (result.success) {
        toast.success(`Lead moved to ${PIPELINE_STAGE_LABELS[stage]}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (isClosed) return null;

  const nextStage = currentIndex < stageOrder.length - 1
    ? stageOrder[currentIndex + 1]
    : null;

  return (
    <div className="flex gap-2">
      {nextStage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleMove(nextStage)}
          disabled={isPending}
          className="gap-1.5 border-emerald-800 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Move to {PIPELINE_STAGE_LABELS[nextStage]}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleMove("closed_won")}
        disabled={isPending}
        className="gap-1.5 border-emerald-800 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
      >
        <Trophy className="h-3.5 w-3.5" />
        Closed Won
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleMove("closed_lost")}
        disabled={isPending}
        className="gap-1.5 border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
      >
        <X className="h-3.5 w-3.5" />
        Lost
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleMove("disqualified")}
        disabled={isPending}
        className="gap-1.5 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
      >
        <X className="h-3.5 w-3.5" />
        Disqualify
      </Button>
    </div>
  );
}
