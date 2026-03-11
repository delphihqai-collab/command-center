"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  operationId: string;
  operationName: string;
}

export function DeleteOperationButton({ operationId, operationName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/war-rooms/${operationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete operation");
        setConfirming(false);
        return;
      }

      toast.success(`Deleted: ${operationName}`);
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex shrink-0 gap-1">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700"
        >
          {isPending ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded bg-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 rounded p-2 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
      title="Delete operation"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
