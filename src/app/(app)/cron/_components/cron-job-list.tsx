"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow, format } from "date-fns";
import { Bot } from "lucide-react";
import { CronActions } from "./cron-actions";

interface CronSchedule {
  kind: "cron" | "at" | "every";
  expr: string;
  tz?: string;
}

interface CronState {
  nextRunAtMs?: number;
  lastRunAtMs?: number;
  lastRunStatus?: string;
  lastStatus?: string;
  lastDurationMs?: number;
  consecutiveErrors?: number;
}

interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  schedule: CronSchedule;
  sessionTarget: string;
  state: CronState;
}

interface AgentGroup {
  agentId: string;
  label: string;
  jobs: CronJob[];
}

function formatSchedule(schedule: CronSchedule): string {
  if (schedule.kind === "cron") {
    const tz = schedule.tz ? ` (${schedule.tz})` : "";
    return `${schedule.expr}${tz}`;
  }
  return `${schedule.kind}: ${schedule.expr}`;
}

export function CronJobList({ groups }: { groups: AgentGroup[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? groups.filter((g) => g.agentId === filter)
    : groups;

  const totalFiltered = filtered.reduce((s, g) => s + g.jobs.length, 0);

  return (
    <div className="space-y-4">
      {/* Agent filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          className={
            filter === null
              ? "h-7 bg-indigo-600 text-xs text-zinc-50 hover:bg-indigo-700"
              : "h-7 border-zinc-700 text-xs text-zinc-400 hover:text-zinc-50"
          }
          onClick={() => setFilter(null)}
        >
          All
        </Button>
        {groups.map((group) => (
          <Button
            key={group.agentId}
            variant={filter === group.agentId ? "default" : "outline"}
            size="sm"
            className={
              filter === group.agentId
                ? "h-7 bg-indigo-600 text-xs text-zinc-50 hover:bg-indigo-700"
                : "h-7 border-zinc-700 text-xs text-zinc-400 hover:text-zinc-50"
            }
            onClick={() => setFilter(group.agentId)}
          >
            {group.label}
            <span className="ml-1 text-zinc-500">{group.jobs.length}</span>
          </Button>
        ))}
      </div>

      {/* Job groups */}
      <div className="space-y-6">
        {filtered.map((group) => (
          <div key={group.agentId} className="space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-300">
                {group.label}
              </h2>
              <span className="text-xs text-zinc-500">
                {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {group.jobs.map((job) => (
                <Card key={job.id} className="border-zinc-800 bg-zinc-900">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-50">{job.name}</p>
                        <StatusBadge status={job.enabled ? "enabled" : "disabled"} />
                        {job.state.lastStatus && (
                          <StatusBadge status={job.state.lastStatus} />
                        )}
                        {(job.state.consecutiveErrors ?? 0) > 0 && (
                          <span className="text-xs text-red-400">
                            {job.state.consecutiveErrors} consecutive error
                            {job.state.consecutiveErrors !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span>
                          Schedule:{" "}
                          <code className="text-zinc-400">
                            {formatSchedule(job.schedule)}
                          </code>
                        </span>
                        <span>
                          Target:{" "}
                          <code className="text-zinc-400">{job.sessionTarget}</code>
                        </span>
                        {job.state.lastRunAtMs && (
                          <span>
                            Last run:{" "}
                            {formatDistanceToNow(new Date(job.state.lastRunAtMs), {
                              addSuffix: true,
                            })}
                            {job.state.lastDurationMs != null && (
                              <> ({(job.state.lastDurationMs / 1000).toFixed(1)}s)</>
                            )}
                          </span>
                        )}
                        {job.state.nextRunAtMs && (
                          <span>
                            Next:{" "}
                            {format(new Date(job.state.nextRunAtMs), "MMM d, HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                    <CronActions id={job.id} enabled={job.enabled} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
