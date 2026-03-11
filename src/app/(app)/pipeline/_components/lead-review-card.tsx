"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  leadId: string;
  reviewId: string | null;
}

export function LeadReviewCard({ leadId, reviewId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!reviewId) return null;

  function handleDecision(decision: "approved" | "rejected") {
    startTransition(async () => {
      const res = await fetch(`/api/review-queue/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        toast.success(decision === "approved" ? "Lead approved — moved to Outreach" : "Lead rejected");
        router.refresh();
      } else {
        toast.error("Failed to process review");
      }
    });
  }

  return (
    <Card className="border-purple-800/30 bg-purple-950/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">Pending Human Review</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDecision("approved")}
            disabled={isPending}
            className="gap-1 border-emerald-800 text-emerald-400 hover:bg-emerald-950"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDecision("rejected")}
            disabled={isPending}
            className="gap-1 border-red-800 text-red-400 hover:bg-red-950"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
