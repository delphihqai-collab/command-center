"use client";

import { useState, useTransition } from "react";
import { advanceLeadStage } from "../../actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

const PIPELINE_STAGES = [
  "prospecting",
  "qualification",
  "initial_contact",
  "demo",
  "needs_analysis",
  "proposal_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export function StageAdvanceButton({ leadId, currentStage }: { leadId: string; currentStage: string }) {
  const [isPending, startTransition] = useTransition();
  const [selectedStage, setSelectedStage] = useState<string>("");

  const currentIdx = PIPELINE_STAGES.indexOf(currentStage as typeof PIPELINE_STAGES[number]);
  const availableStages = PIPELINE_STAGES.filter((_, i) => i > currentIdx);

  if (currentStage === "closed_won" || currentStage === "closed_lost") {
    return null;
  }

  function handleAdvance() {
    if (!selectedStage) return;
    startTransition(async () => {
      const result = await advanceLeadStage(leadId, selectedStage);
      if (result.success) {
        toast.success(`Stage advanced to ${selectedStage.replace(/_/g, " ")}`);
        setSelectedStage("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedStage} onValueChange={setSelectedStage}>
        <SelectTrigger className="h-8 w-44 border-zinc-700 bg-zinc-950 text-xs text-zinc-300">
          <SelectValue placeholder="Advance to…" />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900">
          {availableStages.map((stage) => (
            <SelectItem key={stage} value={stage} className="text-xs text-zinc-300">
              {stage.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={handleAdvance}
        disabled={isPending || !selectedStage}
        className="h-8 gap-1 bg-indigo-600 text-xs hover:bg-indigo-700"
      >
        <ArrowRight className="h-3 w-3" />
        {isPending ? "..." : "Advance"}
      </Button>
    </div>
  );
}
