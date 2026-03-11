"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Users,
  Building2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  needsInput: boolean;
  inputPlaceholder?: string;
  defaultObjective: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "find-leads",
    label: "Find Leads",
    description: "Discover companies in a sector or region",
    icon: Search,
    color: "text-sky-400 bg-sky-950/30 border-sky-800",
    needsInput: true,
    inputPlaceholder: "e.g. fintech companies in DACH region",
    defaultObjective: "Find and qualify new leads matching ICP",
  },
  {
    id: "outreach-campaign",
    label: "Launch Outreach",
    description: "Start outreach to approved leads",
    icon: Send,
    color: "text-purple-400 bg-purple-950/30 border-purple-800",
    needsInput: false,
    defaultObjective: "Start outreach cadence for all approved leads in the review queue",
  },
  {
    id: "team-status",
    label: "Team Status",
    description: "Get status update from all agents",
    icon: Users,
    color: "text-emerald-400 bg-emerald-950/30 border-emerald-800",
    needsInput: false,
    defaultObjective: "Compile status update from all agents: current tasks, blockers, pipeline progress",
  },
  {
    id: "research-company",
    label: "Research Company",
    description: "Deep-dive analysis on a specific company",
    icon: Building2,
    color: "text-amber-400 bg-amber-950/30 border-amber-800",
    needsInput: true,
    inputPlaceholder: "e.g. Stripe, Datadog, Shopify",
    defaultObjective: "Research company: size, tech stack, decision makers, pain points, ICP fit",
  },
  {
    id: "pipeline-report",
    label: "Pipeline Report",
    description: "Generate full pipeline performance report",
    icon: FileText,
    color: "text-indigo-400 bg-indigo-950/30 border-indigo-800",
    needsInput: false,
    defaultObjective: "Generate pipeline report: leads by stage, conversion rates, weekly trends, forecast",
  },
];

export function QuickActions() {
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleExecute(action: QuickAction, input?: string) {
    startTransition(async () => {
      const objective = input
        ? `${action.defaultObjective}: ${input}`
        : action.defaultObjective;

      const res = await fetch("/api/war-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input
            ? `${action.label}: ${input}`
            : action.label,
          priority: "standard",
          objective,
          agent_ids: [],
        }),
      });

      if (!res.ok) {
        toast.error("Failed to create operation");
        return;
      }

      toast.success(`Operation created: ${action.label}`);
      setActiveAction(null);
      setInputValue("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.needsInput) {
                setActiveAction(action);
              } else {
                handleExecute(action);
              }
            }}
            disabled={isPending}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all hover:scale-[1.02] ${action.color}`}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
            <span className="text-[10px] opacity-60">{action.description}</span>
          </button>
        ))}
      </div>

      <Dialog
        open={activeAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveAction(null);
            setInputValue("");
          }
        }}
      >
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-50">
              {activeAction && <activeAction.icon className="h-5 w-5" />}
              {activeAction?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={activeAction?.inputPlaceholder}
              className="border-zinc-800 bg-zinc-900 text-zinc-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  handleExecute(activeAction!, inputValue.trim());
                }
              }}
              autoFocus
            />
            <Button
              onClick={() => handleExecute(activeAction!, inputValue.trim())}
              disabled={isPending || !inputValue.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? "Creating..." : "Execute"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
