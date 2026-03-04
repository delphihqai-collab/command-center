"use client";

import { useState, useTransition } from "react";
import { advanceLeadStage } from "../actions";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEXT_STAGES: Record<string, string[]> = {
  prospecting: ["qualification"],
  qualification: ["initial_contact", "closed_lost"],
  initial_contact: ["demo"],
  demo: ["needs_analysis", "closed_lost"],
  needs_analysis: ["proposal_sent"],
  proposal_sent: ["negotiation", "closed_won", "closed_lost"],
  negotiation: ["closed_won", "closed_lost"],
};

function formatStage(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function QuickAdvanceButton({
  leadId,
  currentStage,
}: {
  leadId: string;
  currentStage: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedStage, setSelectedStage] = useState<string>("");

  const nextStages = NEXT_STAGES[currentStage];
  if (!nextStages || nextStages.length === 0) return null;

  function handleAdvance() {
    const target = selectedStage || nextStages[0];
    startTransition(async () => {
      const result = await advanceLeadStage(leadId, target);
      if (result.success) {
        toast.success(`Advanced to ${formatStage(target)}`);
        setSelectedStage("");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (nextStages.length === 1) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdvance}
        disabled={isPending}
        className="h-7 gap-1 border-zinc-700 bg-zinc-950 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
      >
        {isPending ? "..." : formatStage(nextStages[0])}
        <ChevronRight className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Select value={selectedStage} onValueChange={setSelectedStage}>
        <SelectTrigger className="h-7 w-28 border-zinc-700 bg-zinc-950 text-xs text-zinc-300">
          <SelectValue placeholder="Next..." />
        </SelectTrigger>
        <SelectContent>
          {nextStages.map((s) => (
            <SelectItem key={s} value={s}>
              {formatStage(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdvance}
        disabled={isPending || !selectedStage}
        className="h-7 gap-1 border-zinc-700 bg-zinc-950 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
      >
        {isPending ? "..." : "Go"}
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
