"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Agent {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
}

interface Lead {
  id: string;
  company_name: string;
  deal_value_eur: number | null;
  stage: string;
}

const AGENT_EMOJIS: Record<string, string> = {
  hermes: "🪶",
  sdr: "📞",
  "account-executive": "🤝",
  "account-manager": "👥",
  finance: "💰",
  legal: "⚖️",
  "market-intelligence": "🔭",
  "knowledge-curator": "📚",
};

export function WarRoomCreateButton({
  agents,
  leads,
}: {
  agents: Agent[];
  leads: Lead[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [leadId, setLeadId] = useState("");
  const [priority, setPriority] = useState("high");
  const [objective, setObjective] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("War room name is required");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/war-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          lead_id: leadId || undefined,
          priority,
          objective: objective.trim() || undefined,
          agent_ids: selectedAgents,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to create war room");
        return;
      }

      toast.success("War room activated");
      setOpen(false);
      setName("");
      setLeadId("");
      setObjective("");
      setSelectedAgents([]);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-red-600 text-sm hover:bg-red-700">
          <Plus className="h-4 w-4" />
          New War Room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-50">
            <Shield className="h-5 w-5 text-red-400" />
            Activate War Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-zinc-400">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Phoenix Close"
              className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-50"
            />
          </div>

          {/* Linked deal */}
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Linked Deal (optional)
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
            >
              <option value="">No linked deal</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name}
                  {lead.deal_value_eur
                    ? ` (€${lead.deal_value_eur.toLocaleString()})`
                    : ""}{" "}
                  — {lead.stage.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Priority
            </label>
            <div className="mt-1 flex gap-2">
              {["critical", "high", "standard"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    priority === p
                      ? p === "critical"
                        ? "border-red-700 bg-red-950/30 text-red-400"
                        : p === "high"
                          ? "border-amber-700 bg-amber-950/30 text-amber-400"
                          : "border-zinc-600 bg-zinc-800 text-zinc-300"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Objective */}
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Objective
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What should this war room achieve?"
              rows={2}
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600"
            />
          </div>

          {/* Agent selection */}
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Team Members (first selected = lead)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {agents.map((agent) => {
                const isSelected = selectedAgents.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex items-center gap-2 rounded-md border p-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "border-indigo-700 bg-indigo-950/20 text-zinc-200"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                    }`}
                  >
                    <span>{AGENT_EMOJIS[agent.slug] ?? "🤖"}</span>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-[10px] text-zinc-600">{agent.type}</p>
                    </div>
                    {isSelected && selectedAgents[0] === agent.id && (
                      <span className="ml-auto text-[10px] text-indigo-400">
                        Lead
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="w-full gap-2 bg-red-600 hover:bg-red-700"
          >
            <Shield className="h-4 w-4" />
            {isPending ? "Activating..." : "Activate War Room"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
