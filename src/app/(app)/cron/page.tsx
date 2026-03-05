import { Card, CardContent } from "@/components/ui/card";
import { CronJobList } from "./_components/cron-job-list";
import { execFile } from "child_process";
import { promisify } from "util";
import { Clock, AlertTriangle } from "lucide-react";

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

function groupJobsByAgent(jobs: CronJob[]) {
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
        <CronJobList groups={groups} />
      )}
    </div>
  );
}
