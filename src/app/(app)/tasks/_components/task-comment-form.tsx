"use client";

import { useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "../actions";
import { toast } from "sonner";

export function TaskCommentForm({ taskId }: { taskId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const content = fd.get("content") as string;
    if (!content.trim()) return;

    startTransition(async () => {
      const result = await addComment(taskId, content);
      if (result.success) {
        formRef.current?.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        name="content"
        placeholder="Add a comment..."
        rows={2}
        required
        className="border-zinc-800 bg-zinc-950 text-zinc-50"
      />
      <Button
        type="submit"
        disabled={isPending}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {isPending ? "Posting…" : "Comment"}
      </Button>
    </form>
  );
}
