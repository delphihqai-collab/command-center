import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { FleetTabs } from "./_components/fleet-tabs";
import { FleetGrid } from "./_components/fleet-grid";
import { SessionsTableClient } from "../sessions/_components/sessions-table-client";
import { execFile } from "child_process";
import { promisify } from "util";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { calculateCost } from "@/lib/model-costs";
import { CostChart } from "../costs/_components/cost-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN ?? "/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw";
const CRON_DIR = process.env.OPENCLAW_CRON_DIR ?? "/home/delphi/.openclaw/cron";

interface OpenClawSession {
  key: string;
  agentId: string;
  kind: string;
  model: string;
  modelProvider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  contextTokens: number;
  updatedAt: number;
  ageMs: number;
  sessionId: string;
}

interface UsageRow {
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
  source: "cron" | "session";
}

async function loadCronRunUsage(): Promise<UsageRow[]> {
  const rows: UsageRow[] = [];
  try {
    const jobsRaw = await readFile(join(CRON_DIR, "jobs.json"), "utf-8");
    const jobsData = JSON.parse(jobsRaw) as { jobs: { id: string; agentId: string; name: string }[] };
    const jobMap = new Map(jobsData.jobs.map((j) => [j.id, j]));
    const runsDir = join(CRON_DIR, "runs");
    let files: string[] = [];
    try {
      files = (await readdir(runsDir)).filter((f) => f.endsWith(".jsonl"));
    } catch {
      return rows;
    }
    for (const file of files) {
      const content = await readFile(join(runsDir, file), "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const entry = JSON.parse(trimmed) as {
          ts: number;
          jobId: string;
          model?: string;
          usage?: { input_tokens: number; output_tokens: number };
        };
        const usage = entry.usage;
        if (!usage || (!usage.input_tokens && !usage.output_tokens)) continue;
        const model = entry.model ?? "unknown";
        const job = jobMap.get(entry.jobId);
        const agentId = job?.agentId ?? "unknown";
        rows.push({
          agentId,
          model,
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          cost: calculateCost(model, usage.input_tokens, usage.output_tokens),
          timestamp: entry.ts,
          source: "cron",
        });
      }
    }
  } catch {
    // cron data unavailable
  }
  return rows;
}

async function loadSessionUsage(): Promise<UsageRow[]> {
  const rows: UsageRow[] = [];
  try {
    const { stdout } = await execFileAsync(OPENCLAW_BIN, ["sessions", "--all-agents", "--json"]);
    const data = JSON.parse(stdout) as { sessions: OpenClawSession[] };
    const seen = new Set<string>();
    for (const s of data.sessions) {
      if (s.key.includes(":run:")) continue;
      if (seen.has(s.key)) continue;
      seen.add(s.key);
      if (!s.inputTokens && !s.outputTokens) continue;
      rows.push({
        agentId: s.agentId,
        model: s.model,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        cost: calculateCost(s.model, s.inputTokens, s.outputTokens),
        timestamp: s.updatedAt,
        source: "session",
      });
    }
  } catch {
    // sessions unavailable
  }
  return rows;
}

export default async function FleetPage() {
  const supabase = await createClient();

  const [
    { data: agents },
    { data: activeOps },
  ] = await Promise.all([
    supabase.from("agents").select("*").order("slug"),
    supabase
      .from("war_room_agents")
      .select("agent_id, war_room:war_rooms!inner(id, name, status, type)")
      .eq("war_rooms.status", "active"),
  ]);

  const agentsList = agents ?? [];

  // Agent operations map
  const agentOps: Record<string, { id: string; name: string; type: string | null }[]> = {};
  for (const row of activeOps ?? []) {
    const wr = row.war_room as unknown as { id: string; name: string; status: string; type: string | null };
    if (!wr) continue;
    if (!agentOps[row.agent_id]) agentOps[row.agent_id] = [];
    agentOps[row.agent_id].push({ id: wr.id, name: wr.name, type: wr.type });
  }

  // Sessions data
  interface SessionRowType {
    agentId: string;
    agentName: string;
    agentSlug: string;
    sessionKey: string | null;
    sessionKind: string | null;
    model: string | null;
    totalTokens: number | null;
    contextTokens: number | null;
    estimatedCost: number | null;
    lastActivity: string | null;
    contextUsagePercent: number | null;
  }
  let sessionRows: SessionRowType[] = [];

  try {
    const { stdout } = await execFileAsync(OPENCLAW_BIN, ["sessions", "--all-agents", "--json"]);
    const sessData = JSON.parse(stdout) as { sessions: OpenClawSession[] };
    const filtered = sessData.sessions.filter((s) => !/:run:[0-9a-f-]+$/.test(s.key));
    const sessionsByAgent = new Map<string, OpenClawSession[]>();
    for (const s of filtered) {
      const existing = sessionsByAgent.get(s.agentId) ?? [];
      existing.push(s);
      sessionsByAgent.set(s.agentId, existing);
    }
    sessionRows = agentsList.flatMap((agent): SessionRowType[] => {
      const agentSessions = sessionsByAgent.get(agent.slug) ?? [];
      if (agentSessions.length === 0) {
        return [{
          agentId: agent.id, agentName: agent.name, agentSlug: agent.slug,
          sessionKey: null, sessionKind: null, model: null,
          totalTokens: null, contextTokens: null, estimatedCost: null,
          lastActivity: null, contextUsagePercent: null,
        }];
      }
      return agentSessions.sort((a, b) => a.ageMs - b.ageMs).map((s) => ({
        agentId: agent.id, agentName: agent.name, agentSlug: agent.slug,
        sessionKey: s.key, sessionKind: s.kind, model: s.model,
        totalTokens: s.totalTokens, contextTokens: s.contextTokens,
        estimatedCost: s.inputTokens && s.outputTokens ? calculateCost(s.model, s.inputTokens, s.outputTokens) : null,
        lastActivity: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
        contextUsagePercent: s.totalTokens && s.contextTokens ? Math.round((s.totalTokens / s.contextTokens) * 100) : null,
      }));
    });
  } catch {
    // CLI unavailable
  }

  // Costs data
  const [cronUsage, sessionUsage] = await Promise.all([loadCronRunUsage(), loadSessionUsage()]);
  const allUsage = [...cronUsage, ...sessionUsage];

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const day = new Date();
  const weekStart = new Date(day.getFullYear(), day.getMonth(), day.getDate() - day.getDay()).getTime();
  const monthStart = new Date(day.getFullYear(), day.getMonth(), 1).getTime();
  const sumCost = (from: number) => allUsage.filter((r) => r.timestamp >= from).reduce((s, r) => s + r.cost, 0);

  const costKPIs = [
    { label: "Today", value: sumCost(todayStart) },
    { label: "This Week", value: sumCost(weekStart) },
    { label: "This Month", value: sumCost(monthStart) },
    { label: "All Time", value: allUsage.reduce((s, r) => s + r.cost, 0) },
  ];

  // Agent cost breakdown
  const agentCostStats = agentsList.map((agent) => {
    const agentRows = allUsage.filter((r) => r.agentId === agent.slug || (agent.slug === "hermes" && r.agentId === "main"));
    return {
      name: agent.name, slug: agent.slug,
      totalInput: agentRows.reduce((s, r) => s + r.inputTokens, 0),
      totalOutput: agentRows.reduce((s, r) => s + r.outputTokens, 0),
      totalCost: agentRows.reduce((s, r) => s + r.cost, 0),
    };
  });

  // Chart data
  const dateMap: Record<string, Record<string, number>> = {};
  for (const r of allUsage) {
    const date = new Date(r.timestamp).toISOString().slice(0, 10);
    const slug = r.agentId === "main" ? "hermes" : r.agentId;
    if (!dateMap[date]) dateMap[date] = {};
    dateMap[date][slug] = (dateMap[date][slug] ?? 0) + r.cost;
  }
  const chartData = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, costs]) => ({ date, ...costs }));

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="agents" />

      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-zinc-50">
          <Users className="h-6 w-6 text-indigo-400" />
          Fleet
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {agentsList.length} agents · {agentsList.filter((a) => a.status === "active").length} active
        </p>
      </div>

      <FleetTabs>
        {{
          overview: (
            <div className="space-y-6">
              <FleetGrid
                agents={agentsList.map((a) => ({
                  id: a.id, slug: a.slug, name: a.name, type: a.type,
                  status: a.status, model: a.model, last_seen: a.last_seen,
                  operations: agentOps[a.id] ?? [],
                }))}
              />
            </div>
          ),
          sessions: (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-0">
                <SessionsTableClient sessions={sessionRows} />
              </CardContent>
            </Card>
          ),
          costs: (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {costKPIs.map((kpi) => (
                  <Card key={kpi.label} className="border-zinc-800 bg-zinc-900">
                    <CardContent className="p-4">
                      <p className="text-xs text-zinc-400">{kpi.label}</p>
                      <p className="mt-1 text-2xl font-bold text-zinc-50">${kpi.value.toFixed(4)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-400">Agent Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Agent</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Input</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Output</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentCostStats.map((a) => (
                          <tr key={a.slug} className="border-b border-zinc-800">
                            <td className="px-3 py-2 text-zinc-50">{a.name}</td>
                            <td className="px-3 py-2 text-right text-zinc-300">{a.totalInput.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-zinc-300">{a.totalOutput.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-medium text-zinc-50">${a.totalCost.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-400">Cost Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-500">No cost data yet.</p>
                  ) : (
                    <CostChart data={chartData} agents={agentsList.map((a) => ({ slug: a.slug, name: a.name }))} />
                  )}
                </CardContent>
              </Card>
            </div>
          ),
        }}
      </FleetTabs>
    </div>
  );
}
