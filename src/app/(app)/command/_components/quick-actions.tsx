"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Users,
  Building2,
  FileText,
  Hammer,
  CheckCircle,
  BarChart3,
  Mail,
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
  defaultMessage: string;
  group: "prospect" | "build" | "outreach" | "monitor";
}

const QUICK_ACTIONS: QuickAction[] = [
  // ── Prospecting ─────────────────────────────────────────────
  {
    id: "find-companies",
    label: "Find Companies",
    description: "Discover European companies in a sector/region",
    icon: Search,
    color: "text-sky-400 bg-sky-950/30 border-sky-800",
    needsInput: true,
    inputPlaceholder: "e.g. dental clinics in Lisbon",
    defaultMessage: "Find and research European companies matching ICP",
    group: "prospect",
  },
  {
    id: "research-company",
    label: "Research Company",
    description: "Deep-dive analysis on a specific company",
    icon: Building2,
    color: "text-amber-400 bg-amber-950/30 border-amber-800",
    needsInput: true,
    inputPlaceholder: "e.g. Clínica Dental Porto",
    defaultMessage:
      "Research company: website quality, online presence, decision makers, ICP fit score, pain signals",
    group: "prospect",
  },
  // ── Build ───────────────────────────────────────────────────
  {
    id: "request-atlas-build",
    label: "Request Atlas Build",
    description: "Send qualified lead to Atlas for demo build",
    icon: Hammer,
    color: "text-purple-400 bg-purple-950/30 border-purple-800",
    needsInput: true,
    inputPlaceholder: "Company name or lead ID",
    defaultMessage:
      "Package this qualified lead and send Atlas build request via #briefings",
    group: "build",
  },
  {
    id: "check-atlas-status",
    label: "Atlas Status",
    description: "Check status of pending Atlas builds",
    icon: CheckCircle,
    color: "text-violet-400 bg-violet-950/30 border-violet-800",
    needsInput: false,
    defaultMessage:
      "Check status of all leads in atlas_build stage. Any deliveries pending? Any overdue >7 days?",
    group: "build",
  },
  // ── Outreach ────────────────────────────────────────────────
  {
    id: "compose-outreach",
    label: "Compose Outreach",
    description: "Draft outreach email for a product-ready lead",
    icon: Mail,
    color: "text-emerald-400 bg-emerald-950/30 border-emerald-800",
    needsInput: true,
    inputPlaceholder: "Company name or lead ID",
    defaultMessage:
      "Compose personalised outreach email for this lead including their demo website/chatbot link",
    group: "outreach",
  },
  {
    id: "launch-outreach",
    label: "Launch Outreach",
    description: "Start outreach to all approved leads",
    icon: Send,
    color: "text-indigo-400 bg-indigo-950/30 border-indigo-800",
    needsInput: false,
    defaultMessage:
      "Start outreach cadence for all approved product-ready leads awaiting outreach",
    group: "outreach",
  },
  // ── Monitor ─────────────────────────────────────────────────
  {
    id: "pipeline-report",
    label: "Pipeline Report",
    description: "Full pipeline performance report",
    icon: FileText,
    color: "text-indigo-400 bg-indigo-950/30 border-indigo-800",
    needsInput: false,
    defaultMessage:
      "Generate pipeline report: leads by stage, engagement rates, conversion rates, forecast",
    group: "monitor",
  },
  {
    id: "team-status",
    label: "Team Status",
    description: "Status update from all agents",
    icon: Users,
    color: "text-zinc-400 bg-zinc-800/50 border-zinc-700",
    needsInput: false,
    defaultMessage:
      "Give me a status update from all agents: current tasks, blockers, pipeline progress",
    group: "monitor",
  },
  {
    id: "engagement-report",
    label: "Engagement Report",
    description: "Email engagement and lead temperature overview",
    icon: BarChart3,
    color: "text-orange-400 bg-orange-950/30 border-orange-800",
    needsInput: false,
    defaultMessage:
      "Generate engagement report: email opens, clicks, replies, lead temperatures, hot leads requiring follow-up",
    group: "monitor",
  },
];

const GROUP_LABELS: Record<QuickAction["group"], string> = {
  prospect: "Prospecting",
  build: "Build",
  outreach: "Outreach",
  monitor: "Monitor",
};

const GROUP_ORDER: QuickAction["group"][] = ["prospect", "build", "outreach", "monitor"];

export function QuickActions() {
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleExecute(action: QuickAction, input?: string) {
    startTransition(async () => {
      const message = input
        ? `${action.label}: ${input}`
        : action.defaultMessage;

      // Send as a chat message to Hermes — NOT as an operation
      const res = await fetch("/api/command/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        toast.error("Failed to send command");
        return;
      }

      toast.success(`Sent to Hermes: ${action.label}`);
      setActiveAction(null);
      setInputValue("");

      // Navigate to Fleet to see the response in chat
      router.push("/fleet");
    });
  }

  return (
    <>
      <div className="space-y-3">
        {GROUP_ORDER.map((group) => {
          const groupActions = QUICK_ACTIONS.filter((a) => a.group === group);
          return (
            <div key={group}>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {GROUP_LABELS[group]}
              </p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {groupActions.map((action) => (
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
                    <span className="text-[10px] opacity-60">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
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
              {isPending ? "Sending to Hermes..." : "Send to Hermes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
