"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateNotificationPreferences, updatePipelineConfig } from "../actions";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";

// --- Notifications Tab ---
interface NotificationPrefs {
  alert_channel: string;
  approval_channel: string;
  report_channel: string;
}

export function NotificationsTab({ prefs }: { prefs: NotificationPrefs | null }) {
  const [isPending, startTransition] = useTransition();
  const [alert, setAlert] = useState(prefs?.alert_channel ?? "both");
  const [approval, setApproval] = useState(prefs?.approval_channel ?? "both");
  const [report, setReport] = useState(prefs?.report_channel ?? "in_app");

  function handleSave() {
    const fd = new FormData();
    fd.set("alert_channel", alert);
    fd.set("approval_channel", approval);
    fd.set("report_channel", report);

    startTransition(async () => {
      const result = await updateNotificationPreferences(fd);
      if (result.success) toast.success("Preferences saved");
      else toast.error(result.error);
    });
  }

  const channels = ["in_app", "discord", "both"];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Notification Channels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: "Alerts", value: alert, onChange: setAlert },
          { label: "Approvals", value: approval, onChange: setApproval },
          { label: "Reports", value: report, onChange: setReport },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">{item.label}</span>
            <Select value={item.value} onValueChange={item.onChange}>
              <SelectTrigger className="w-32 border-zinc-800 bg-zinc-950 text-xs text-zinc-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
          size="sm"
        >
          {isPending ? "Saving…" : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Pipeline Config Tab ---
interface PipelineConfigItem {
  key: string;
  value: unknown;
}

export function PipelineConfigTab({ configs }: { configs: PipelineConfigItem[] }) {
  const [isPending, startTransition] = useTransition();

  const stallThreshold = configs.find((c) => c.key === "stall_threshold_days");
  const retainLogs = configs.find((c) => c.key === "agent_logs_retain_days");
  const retainAudit = configs.find((c) => c.key === "audit_log_retain_days");

  const [stall, setStall] = useState(String(stallThreshold?.value ?? "5"));

  function handleSave() {
    startTransition(async () => {
      const result = await updatePipelineConfig("stall_threshold_days", stall);
      if (result.success) toast.success("Pipeline config saved");
      else toast.error(result.error);
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Pipeline Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-zinc-400">Stall Threshold (days)</label>
          <input
            type="number"
            min={1}
            max={90}
            value={stall}
            onChange={(e) => setStall(e.target.value)}
            className="mt-1 w-24 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Leads with no activity for this many days are flagged as stalled
          </p>
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
export function DataRetentionTab({ configs }: { configs: PipelineConfigItem[] }) {
  const [isPending, startTransition] = useTransition();
  const retainLogs = String(configs.find((c) => c.key === "agent_logs_retain_days")?.value ?? "90");
  const retainAudit = String(configs.find((c) => c.key === "audit_log_retain_days")?.value ?? "365");

  const [logs, setLogs] = useState(retainLogs);
  const [audit, setAudit] = useState(retainAudit);

  function handleSave() {
    startTransition(async () => {
      const r1 = await updatePipelineConfig("agent_logs_retain_days", logs);
      const r2 = await updatePipelineConfig("audit_log_retain_days", audit);
      if (r1.success && r2.success) toast.success("Retention settings saved");
      else toast.error(r1.error ?? r2.error ?? "Failed to save");
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
        <p className="text-xs text-zinc-500">
          HERMES reads these during weekly maintenance to clean old rows
        </p>
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
