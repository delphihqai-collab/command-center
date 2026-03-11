"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Check, X, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  lead_id: string;
  review_type: string;
  status: string;
  context: string | null;
  created_at: string;
  lead: {
    id: string;
    company_name: string;
    contact_name: string | null;
    stage: string;
    deal_value_eur: number | null;
    icp_score: number | null;
    intent_score: number | null;
    company_industry: string | null;
    trigger_event: string | null;
  } | null;
  requested_by_agent: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const pendingItems = items.filter((i) => i.status === "pending");

  function handleDecision(id: string, decision: "approved" | "rejected" | "needs_info") {
    startTransition(async () => {
      const res = await fetch(`/api/review-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        toast.success(`Lead ${decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "flagged for info"}`);
        router.refresh();
      } else {
        toast.error("Failed to process review");
      }
    });
  }

  if (pendingItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
        <p className="text-sm text-zinc-500">No items pending review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">
        Review Queue ({pendingItems.length})
      </h3>
      {pendingItems.map((item) => (
        <Card key={item.id} className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-50">
                    {item.lead?.company_name ?? "Unknown"}
                  </span>
                  <StatusBadge status={item.lead?.stage ?? "unknown"} />
                  {item.lead?.deal_value_eur && (
                    <span className="text-xs text-emerald-400">
                      &euro;{item.lead.deal_value_eur.toLocaleString("en")}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  {item.lead?.contact_name && <span>{item.lead.contact_name}</span>}
                  {item.lead?.company_industry && <span>{item.lead.company_industry}</span>}
                  {item.requested_by_agent && (
                    <span>via {item.requested_by_agent.name}</span>
                  )}
                </div>
                {item.context && (
                  <p className="mt-2 text-xs text-zinc-400">{item.context}</p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  {item.lead?.icp_score != null && (
                    <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                      ICP {item.lead.icp_score}
                    </span>
                  )}
                  {item.lead?.intent_score != null && (
                    <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      Intent {item.lead.intent_score}
                    </span>
                  )}
                  {item.lead?.trigger_event && (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {item.lead.trigger_event}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision(item.id, "approved")}
                  disabled={isPending}
                  className="gap-1 border-emerald-800 text-emerald-400 hover:bg-emerald-950"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision(item.id, "rejected")}
                  disabled={isPending}
                  className="gap-1 border-red-800 text-red-400 hover:bg-red-950"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision(item.id, "needs_info")}
                  disabled={isPending}
                  className="gap-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
