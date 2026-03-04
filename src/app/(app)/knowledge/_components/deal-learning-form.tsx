"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createDealLearning, updateDealLearning } from "../actions";

interface Lead {
  id: string;
  company_name: string;
}

interface DealLearningData {
  id: string;
  lead_id: string;
  key_learning: string;
  outcome: string;
  loss_reason_primary: string | null;
  competitor_name: string | null;
  competitor_involved: boolean | null;
  icp_match_quality: string | null;
  deal_velocity_days: number | null;
}

interface DealLearningFormProps {
  leads: Lead[];
  existing?: DealLearningData | null;
}

export function DealLearningForm({ leads, existing }: DealLearningFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState(existing?.outcome ?? "");
  const [leadId, setLeadId] = useState(existing?.lead_id ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("outcome", outcome);
    if (!existing) formData.set("lead_id", leadId);

    startTransition(async () => {
      const result = existing
        ? await updateDealLearning(existing.id, formData)
        : await createDealLearning(formData);

      if (result.success) {
        toast.success(existing ? "Learning updated" : "Learning created");
        router.push("/knowledge");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          {existing ? "Edit Deal Learning" : "New Deal Learning"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!existing && (
            <div>
              <label className="text-xs text-zinc-400">Lead *</label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger className="mt-1 border-zinc-800 bg-zinc-950 text-zinc-50">
                  <SelectValue placeholder="Select a lead…" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400">Key Learning *</label>
            <textarea
              name="key_learning"
              required
              defaultValue={existing?.key_learning ?? ""}
              rows={4}
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              placeholder="What was learned from this deal?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-400">Outcome *</label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="mt-1 border-zinc-800 bg-zinc-950 text-zinc-50">
                  <SelectValue placeholder="Select outcome…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="stalled">Stalled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-zinc-400">ICP Match Quality</label>
              <Select defaultValue={existing?.icp_match_quality ?? ""} name="icp_match_quality">
                <SelectTrigger className="mt-1 border-zinc-800 bg-zinc-950 text-zinc-50">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="weak">Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-400">Loss Reason</label>
              <input
                name="loss_reason_primary"
                defaultValue={existing?.loss_reason_primary ?? ""}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. pricing, timing, competitor"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Competitor Name</label>
              <input
                name="competitor_name"
                defaultValue={existing?.competitor_name ?? ""}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Acme Corp"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-zinc-400">Deal Velocity (days)</label>
              <input
                name="deal_velocity_days"
                type="number"
                min={0}
                defaultValue={existing?.deal_velocity_days ?? ""}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="hidden"
                  name="competitor_involved"
                  value="false"
                />
                <input
                  type="checkbox"
                  name="competitor_involved"
                  value="true"
                  defaultChecked={existing?.competitor_involved ?? false}
                  className="rounded border-zinc-700 bg-zinc-950"
                />
                Competitor involved
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/knowledge")}
              className="border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? "Saving…" : existing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
