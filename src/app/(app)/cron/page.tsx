import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow, format } from "date-fns";
import { CronActions } from "./_components/cron-actions";
import { execFile } from "child_process";
import { promisify } from "util";
import { Clock, AlertTriangle, Bot } from "lucide-react";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN ?? "/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw";

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
  payload: { kind: string; text?: string; message?: string };
  state: CronState;
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  main: "Hermes",
  hermes: "Hermes",
  sdr: "SDR",
  "account-executive": "Account Executive",
  "account-manager": "Account Manager",
  finance: "Finance",
  legal: "Legal",
  "market-intelligence": "Market Intelligence",
  "knowledge-curator": "Knowledge Curator",
};

const AGENT_ORDER = [
  "main",
  "hermes",
  "sdr",
  "account-executive",
  "account-manager",
  "finance",
  "legal",
  "market-intelligence",
  "knowledge-curator",
];

function agentSortKey(agentId: string): number {
  const idx = AGENT_ORDER.indexOf(agentId);
  return idx === -1 ? AGENT_ORDER.length : idx;
}

function formatSchedule(schedule: CronSchedule): string {
  if (schedule.kind === "cron") {
    const tz = schedule.tz ? ` (${schedule.tz})` : "";
    return `${schedule.expr}${tz}`;
  }
  return `${schedule.kind}: ${schedule.expr}`;
}

function groupJobsByAgent(jobs: CronJob[]): { agentId: string; label: string; jobs: CronJob[] }[] {
  const grouped = new Map<string, CronJob[]>();
  for (const job of jobs) {
    const existing = grouped.get(job.agentId);
    if (existing) {
      existing.push(job);
    } else {
      grouped.set(job.agentId, [job]);
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => agentSortKey(a) - agentSortKey(b))
    .map(([agentId, agentJobs]) => ({
      agentId,
      label: AGENT_DISPLAY_NAMES[agentId] ?? agentId,
      jobs: agentJobs,
    }));
}

export default async function CronPage() {
  let jobs: CronJob[] = [];
  let cliError: string | null = null;

  try {
    const { stdout } = await execFileAsync(OPENCLAW_BIN, ["cron", "list", "--json"]);
    const data = JSON.parse(stdout) as { jobs: CronJob[] };
    jobs = data.jobs;
  } catch {
    cliError = "Failed to fetch cron jobs from OpenClaw CLI";
  }

  const groups = groupJobsByAgent(jobs);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Scheduler</h1>
          <p className="text-sm text-zinc-400">
            {jobs.length} cron job{jobs.length !== 1 ? "s" : ""} managed by OpenClaw
          </p>
        </div>
      </div>

      {cliError && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {cliError}
          </CardContent>
        </Card>
      )}

      {!cliError && jobs.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No scheduled tasks configured.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
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
                              {job.state.consecutiveErrors} consecutive error{job.state.consecutiveErrors !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <span>
                            Schedule: <code className="text-zinc-400">{formatSchedule(job.schedule)}</code>
                          </span>
                          <span>
                            Target: <code className="text-zinc-400">{job.sessionTarget}</code>
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
                              Next: {format(new Date(job.state.nextRunAtMs), "MMM d, HH:mm")}
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
      )}
    </div>
  );
}
