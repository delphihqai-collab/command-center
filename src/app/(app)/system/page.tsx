import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Settings2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { format, formatDistanceToNow } from "date-fns";
import { execFile } from "child_process";
import { promisify } from "util";
import { SystemTabs } from "./_components/system-tabs";
import { CronJobList } from "../cron/_components/cron-job-list";
import { LogViewer } from "../logs/_components/log-viewer";
import { MemoryBrowser } from "../memory/_components/memory-browser";
import { WebhookActions } from "../webhooks/_components/webhook-actions";
import { CreateWebhookDialog } from "../webhooks/_components/create-webhook-dialog";
import { SignOutButton } from "../settings/_components/sign-out-button";
import {
  SchedulerTab,
  DataRetentionTab,
  AgentModelsTab,
} from "../settings/_components/settings-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  "main", "hermes", "sdr", "account-executive", "account-manager",
  "finance", "legal", "market-intelligence", "knowledge-curator",
];

function agentSortKey(agentId: string): number {
  const idx = AGENT_ORDER.indexOf(agentId);
  return idx === -1 ? AGENT_ORDER.length : idx;
}

function groupJobsByAgent(jobs: CronJob[]) {
  const grouped = new Map<string, CronJob[]>();
  for (const job of jobs) {
    const existing = grouped.get(job.agentId);
    if (existing) existing.push(job);
    else grouped.set(job.agentId, [job]);
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => agentSortKey(a) - agentSortKey(b))
    .map(([agentId, agentJobs]) => ({
      agentId,
      label: AGENT_DISPLAY_NAMES[agentId] ?? agentId,
      jobs: agentJobs,
    }));
}

async function AuditLogTable() {
  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-8 text-center text-red-400">
          Failed to load audit log: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-8 text-center text-zinc-500">
          No audit log entries found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Agent/User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Action</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Entity</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Changes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry) => (
            <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
              <td className="px-4 py-3 text-xs text-zinc-400" title={format(new Date(entry.created_at), "yyyy-MM-dd HH:mm:ss")}>
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </td>
              <td className="px-4 py-3 text-xs text-zinc-300">{entry.user_email ?? "—"}</td>
              <td className="px-4 py-3">
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-indigo-400">{entry.action}</span>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-400">{entry.entity_type}</td>
              <td className="max-w-xs px-4 py-3 text-xs text-zinc-500">
                {entry.new_values ? (
                  <details>
                    <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">View</summary>
                    <div className="mt-1 space-y-1">
                      {entry.old_values && (
                        <pre className="whitespace-pre-wrap rounded bg-zinc-950 p-2 text-xs text-red-400">
                          - {JSON.stringify(entry.old_values, null, 2)}
                        </pre>
                      )}
                      <pre className="whitespace-pre-wrap rounded bg-zinc-950 p-2 text-xs text-emerald-400">
                        + {JSON.stringify(entry.new_values, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function SystemPage() {
  const supabase = await createClient();

  // Cron data
  let cronJobs: CronJob[] = [];
  let cronError: string | null = null;
  try {
    const { stdout } = await execFileAsync(OPENCLAW_BIN, ["cron", "list", "--json"]);
    const data = JSON.parse(stdout) as { jobs: CronJob[] };
    cronJobs = data.jobs;
  } catch {
    cronError = "Failed to fetch cron jobs from OpenClaw CLI";
  }
  const cronGroups = groupJobsByAgent(cronJobs);

  // Webhooks data
  const { data: webhooks } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false });
  const webhookItems = webhooks ?? [];

  // Settings data
  const [userRes, agentsRes, configRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("agents").select("id, name, slug, status, type, model").order("slug"),
    supabase.from("system_config").select("*"),
  ]);
  const user = userRes.data.user;
  const agents = agentsRes.data ?? [];
  const configs = (configRes.data ?? []).map((c) => ({ key: c.key, value: c.value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-zinc-50">
          <Settings2 className="h-6 w-6 text-indigo-400" />
          System
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Scheduler, logs, memory, webhooks, audit trail, and settings
        </p>
      </div>

      <SystemTabs>
        {{
          scheduler: (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                {cronJobs.length} cron job{cronJobs.length !== 1 ? "s" : ""} managed by OpenClaw
              </p>
              {cronError && (
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="flex items-center gap-3 py-4 text-sm text-red-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {cronError}
                  </CardContent>
                </Card>
              )}
              {!cronError && cronJobs.length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="py-12 text-center text-sm text-zinc-500">
                    No scheduled tasks configured.
                  </CardContent>
                </Card>
              ) : (
                <CronJobList groups={cronGroups} />
              )}
            </div>
          ),
          logs: <LogViewer />,
          memory: <MemoryBrowser />,
          webhooks: (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{webhookItems.length} configured webhooks</p>
                <CreateWebhookDialog />
              </div>
              {webhookItems.length === 0 ? (
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="py-8 text-center text-sm text-zinc-500">
                    No webhooks configured. Create one to start receiving events.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {webhookItems.map((wh) => (
                    <Card key={wh.id} className="border-zinc-800 bg-zinc-900">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium text-zinc-50">{wh.name}</CardTitle>
                            <StatusBadge status={wh.enabled ? "enabled" : "disabled"} />
                          </div>
                          <WebhookActions mode="manage" webhookId={wh.id} enabled={wh.enabled} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-zinc-500">URL: </span>
                            <span className="font-mono text-zinc-400">{wh.url}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Events: </span>
                            <span className="text-zinc-400">
                              {(wh.events as string[]).join(", ") || "none"}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-zinc-500">Failures: </span>
                              <span className={wh.consecutive_failures > 0 ? "text-red-400" : "text-zinc-400"}>
                                {wh.consecutive_failures}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Created: </span>
                              <span className="text-zinc-400">
                                {format(new Date(wh.created_at), "dd MMM yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
          audit: (
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
              <AuditLogTable />
            </Suspense>
          ),
          settings: (
            <Tabs defaultValue="account" className="space-y-4">
              <TabsList className="border-zinc-800 bg-zinc-900">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
                <TabsTrigger value="agents">Agents</TabsTrigger>
                <TabsTrigger value="retention">Data Retention</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="space-y-4">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-400">Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm text-zinc-50">{user?.email ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">User ID</p>
                      <p className="font-mono text-sm text-zinc-400">{user?.id ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Last Sign In</p>
                      <p className="text-sm text-zinc-400">
                        {user?.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleString("en-GB")
                          : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-zinc-400">System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Version</p>
                      <p className="text-sm text-zinc-50">V10 — Mission Control</p>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div>
                      <p className="text-xs text-zinc-500">Environment</p>
                      <p className="text-sm text-zinc-400">PC2 · Port 9069 · Supabase Cloud</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-red-900/50 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-red-400">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SignOutButton />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="scheduler">
                <SchedulerTab configs={configs} />
              </TabsContent>
              <TabsContent value="agents">
                <AgentModelsTab agents={agents} />
              </TabsContent>
              <TabsContent value="retention">
                <DataRetentionTab configs={configs} />
              </TabsContent>
            </Tabs>
          ),
        }}
      </SystemTabs>
    </div>
  );
}
