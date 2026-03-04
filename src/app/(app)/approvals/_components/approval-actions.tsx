"use client";

import { useState, useTransition } from "react";
import { approveAction, rejectAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [decided, setDecided] = useState<"approved" | "rejected" | null>(null);

  if (decided) {
    return (
      <span
        className={`text-xs font-medium ${
          decided === "approved" ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {decided === "approved" ? "Approved" : "Rejected"}
      </span>
    );
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveAction(approvalId);
      if (result.success) {
        setDecided("approved");
        toast.success("Approved");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectAction(approvalId);
      if (result.success) {
        setDecided("rejected");
        toast.success("Rejected");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleApprove}
        disabled={isPending}
        className="h-7 gap-1 border-emerald-800 bg-emerald-500/10 text-xs text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
      >
        <Check className="h-3 w-3" />
        {isPending ? "..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={isPending}
        className="h-7 gap-1 border-red-800 bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300"
      >
        <X className="h-3 w-3" />
        {isPending ? "..." : "Reject"}
      </Button>
    </div>
  );
}
