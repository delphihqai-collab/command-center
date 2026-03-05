"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSystemConfig } from "../actions";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";

// --- Scheduler Tab ---
interface ConfigItem {
  key: string;
  value: unknown;
}

export function SchedulerTab({ configs }: { configs: ConfigItem[] }) {
  const [isPending, startTransition] = useTransition();

  const standupSchedule = String(configs.find((c) => c.key === "standup_schedule")?.value ?? "0 9 * * 1-5");
  const staleThreshold = String(configs.find((c) => c.key === "task_stale_threshold_hours")?.value ?? "48");
  const maxRetries = String(configs.find((c) => c.key === "webhook_max_retries")?.value ?? "5");

  const [standup, setStandup] = useState(standupSchedule);
  const [stale, setStale] = useState(staleThreshold);
  const [retries, setRetries] = useState(maxRetries);

  function handleSave() {
    startTransition(async () => {
      const r1 = await updateSystemConfig("standup_schedule", JSON.stringify(standup));
      const r2 = await updateSystemConfig("task_stale_threshold_hours", JSON.stringify(stale));
      const r3 = await updateSystemConfig("webhook_max_retries", JSON.stringify(retries));
      if (r1.success && r2.success && r3.success) toast.success("Scheduler config saved");
      else toast.error("Failed to save some settings");
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Scheduler Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-zinc-400">Standup Schedule (cron)</label>
          <input
            type="text"
            value={standup}
            onChange={(e) => setStandup(e.target.value)}
            className="mt-1 w-48 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Cron expression for auto-generated standup reports
          </p>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Task Stale Threshold (hours)</label>
          <input
            type="number"
            min={1}
            max={720}
            value={stale}
            onChange={(e) => setStale(e.target.value)}
            className="mt-1 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Tasks in_progress for longer than this are flagged as stalled
          </p>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Webhook Max Retries</label>
          <input
            type="number"
            min={1}
            max={20}
            value={retries}
            onChange={(e) => setRetries(e.target.value)}
            className="mt-1 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
          size="sm"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Data Retention Tab ---
export function DataRetentionTab({ configs }: { configs: ConfigItem[] }) {
  const [isPending, startTransition] = useTransition();
  const retainLogs = String(configs.find((c) => c.key === "agent_logs_retain_days")?.value ?? "90");
  const retainAudit = String(configs.find((c) => c.key === "audit_log_retain_days")?.value ?? "365");

  const [logs, setLogs] = useState(retainLogs);
  const [audit, setAudit] = useState(retainAudit);

  function handleSave() {
    startTransition(async () => {
      const r1 = await updateSystemConfig("agent_logs_retain_days", JSON.stringify(logs));
      const r2 = await updateSystemConfig("audit_log_retain_days", JSON.stringify(audit));
      if (r1.success && r2.success) toast.success("Retention settings saved");
      else toast.error("Failed to save");
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Data Retention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-zinc-400">Agent Logs (days)</label>
          <input
            type="number"
            min={7}
            max={365}
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            className="mt-1 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Audit Log (days)</label>
          <input
            type="number"
            min={30}
            max={730}
            value={audit}
            onChange={(e) => setAudit(e.target.value)}
            className="mt-1 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
          size="sm"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Agent Models Tab ---
interface AgentInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string | null;
  model: string | null;
}

export function AgentModelsTab({ agents }: { agents: AgentInfo[] }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          Agent Models ({agents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3"
            >
              <div>
                <p className="text-sm font-medium text-zinc-50">{agent.name}</p>
                <p className="text-xs text-zinc-500">
                  {agent.type ?? "agent"} · {agent.model ?? "default"}
                </p>
              </div>
              <StatusBadge status={agent.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
