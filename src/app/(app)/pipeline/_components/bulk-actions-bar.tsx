"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { bulkAdvanceStage, bulkArchiveLeads } from "../actions";
import { toast } from "sonner";
import { Archive, ChevronRight, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { PIPELINE_STAGES } from "@/lib/types";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClear: () => void;
}

function formatStage(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BulkActionsBar({ selectedIds, onClear }: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition();
  const [targetStage, setTargetStage] = useState("");

  if (selectedIds.length === 0) return null;

  function handleAdvance() {
    if (!targetStage) {
      toast.error("Select a stage first");
      return;
    }
    startTransition(async () => {
      const result = await bulkAdvanceStage(selectedIds, targetStage);
      if (result.success) {
        toast.success(`Moved ${selectedIds.length} leads to ${formatStage(targetStage)}`);
        onClear();
        setTargetStage("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await bulkArchiveLeads(selectedIds);
      if (result.success) {
        toast.success(`Archived ${selectedIds.length} leads`);
        onClear();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl md:bottom-6">
      <span className="text-sm font-medium text-zinc-50">
        {selectedIds.length} selected
      </span>
      <div className="h-4 w-px bg-zinc-700" />
      <div className="flex items-center gap-2">
        <Select value={targetStage} onValueChange={setTargetStage}>
          <SelectTrigger className="h-8 w-36 border-zinc-700 bg-zinc-950 text-xs text-zinc-300">
            <SelectValue placeholder="Move to…" />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((s) => (
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
          disabled={isPending || !targetStage}
          className="h-8 gap-1 border-zinc-700 bg-zinc-950 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <ChevronRight className="h-3 w-3" /> Move
        </Button>
      </div>
      <div className="h-4 w-px bg-zinc-700" />
      <Button
        size="sm"
        variant="outline"
        onClick={handleArchive}
        disabled={isPending}
        className="h-8 gap-1 border-zinc-700 bg-red-950 text-xs text-red-400 hover:bg-red-900"
      >
        <Archive className="h-3 w-3" /> Archive
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onClear}
        className="h-8 w-8 text-zinc-400 hover:text-zinc-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
