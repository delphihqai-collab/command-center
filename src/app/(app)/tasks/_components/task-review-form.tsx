"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReview } from "../actions";
import { toast } from "sonner";

export function TaskReviewForm({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("approved");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitReview(taskId, status, notes || undefined);
      if (result.success) {
        toast.success("Review submitted");
        setNotes("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3 rounded border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs font-medium text-zinc-400">Submit Review</p>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40 border-zinc-800 bg-zinc-900 text-zinc-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="needs_changes">Needs Changes</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Review notes (optional)"
        rows={2}
        className="border-zinc-800 bg-zinc-900 text-zinc-50"
      />
      <Button
        onClick={handleSubmit}
        disabled={isPending}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </Button>
    </div>
  );
}
