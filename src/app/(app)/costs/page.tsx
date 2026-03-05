import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { CostChart } from "./_components/cost-chart";
import { CostExportButton } from "./_components/cost-export-button";
import { execFile } from "child_process";
import { promisify } from "util";
import { calculateCost } from "@/lib/model-costs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN ?? "/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw";
const CRON_DIR = process.env.OPENCLAW_CRON_DIR ?? "/home/delphi/.openclaw/cron";

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

interface CronRunEntry {
  ts: number;
  jobId: string;
  status: string;
  model?: string;
  usage?: { input_tokens: number; output_tokens: number; total_tokens?: number };
}

interface CronJob {
  id: string;
  agentId: string;
  name: string;
}

interface OpenClawSession {
  key: string;
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  updatedAt: number;
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
    const jobsData = JSON.parse(jobsRaw) as { jobs: CronJob[] };
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
        const entry = JSON.parse(trimmed) as CronRunEntry;
        const usage = entry.usage;
        if (!usage || (!usage.input_tokens && !usage.output_tokens)) continue;
        const model = entry.model ?? "unknown";
        const job = jobMap.get(entry.jobId);
        const agentId = job?.agentId ?? "unknown";
        const cost = calculateCost(model, usage.input_tokens, usage.output_tokens);
        rows.push({
          agentId,
          model,
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          cost,
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
    const { stdout } = await execFileAsync(OPENCLAW_BIN, [
      "sessions",
      "--all-agents",
      "--json",
    ]);
    const data = JSON.parse(stdout) as { sessions: OpenClawSession[] };
    // Deduplicate: skip ":run:" session keys (they duplicate the parent cron session)
    const seen = new Set<string>();
    for (const s of data.sessions) {
      if (s.key.includes(":run:")) continue;
      if (seen.has(s.key)) continue;
      seen.add(s.key);
      if (!s.inputTokens && !s.outputTokens) continue;
      const cost = calculateCost(s.model, s.inputTokens, s.outputTokens);
      rows.push({
        agentId: s.agentId,
        model: s.model,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        cost,
        timestamp: s.updatedAt,
        source: "session",
      });
    }
  } catch {
    // sessions unavailable
  }
  return rows;
}

async function loadAllUsage(): Promise<UsageRow[]> {
  const [cronRows, sessionRows] = await Promise.all([
    loadCronRunUsage(),
    loadSessionUsage(),
  ]);
  return [...cronRows, ...sessionRows];
}

function CostKPIs({ rows }: { rows: UsageRow[] }) {
  const now = Date.now();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const day = new Date();
  const weekStart = new Date(day.getFullYear(), day.getMonth(), day.getDate() - day.getDay()).getTime();
  const monthStart = new Date(day.getFullYear(), day.getMonth(), 1).getTime();

  const sum = (from: number) =>
    rows.filter((r) => r.timestamp >= from).reduce((s, r) => s + r.cost, 0);

  const kpis = [
    { label: "Today", value: sum(todayStart) },
    { label: "This Week", value: sum(weekStart) },
    { label: "This Month", value: sum(monthStart) },
    { label: "All Time", value: rows.reduce((s, r) => s + r.cost, 0) },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              ${kpi.value.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AgentBreakdownTable({ rows, agents }: { rows: UsageRow[]; agents: { id: string; slug: string; name: string }[] }) {
  const agentStats = agents.map((agent) => {
    const agentRows = rows.filter(
      (r) => r.agentId === agent.slug || (agent.slug === "hermes" && r.agentId === "main")
    );
    const totalInput = agentRows.reduce((s, r) => s + r.inputTokens, 0);
    const totalOutput = agentRows.reduce((s, r) => s + r.outputTokens, 0);
    const totalCost = agentRows.reduce((s, r) => s + r.cost, 0);
    const models = [...new Set(agentRows.map((r) => r.model).filter(Boolean))];
    const lastTimestamp = agentRows.length
      ? Math.max(...agentRows.map((r) => r.timestamp))
      : null;

    return {
      ...agent,
      totalInput,
      totalOutput,
      totalCost,
      model: models.join(", ") || "—",
      lastRecorded: lastTimestamp,
    };
  });

  return (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Model</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Input Tokens</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Output Tokens</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">Cost (USD)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">Last Recorded</th>
              </tr>
            </thead>
            <tbody>
              {agentStats.map((agent) => (
                <tr key={agent.id} className="border-b border-zinc-800">
                  <td className="px-3 py-2 text-zinc-50">{agent.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">{agent.model}</td>
                  <td className="px-3 py-2 text-right text-zinc-300">{agent.totalInput.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-zinc-300">{agent.totalOutput.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-50">${agent.totalCost.toFixed(4)}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">
                    {agent.lastRecorded
                      ? new Date(agent.lastRecorded).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CostTrendSection({ rows, agents }: { rows: UsageRow[]; agents: { slug: string; name: string }[] }) {
  // Group by date and agent
  const dateMap: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const date = new Date(r.timestamp).toISOString().slice(0, 10);
    const slug = r.agentId === "main" ? "hermes" : r.agentId;
    if (!dateMap[date]) dateMap[date] = {};
    dateMap[date][slug] = (dateMap[date][slug] ?? 0) + r.cost;
  }

  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, agentCosts]) => ({ date, ...agentCosts }));

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Cost Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No cost data yet.</p>
        ) : (
          <CostChart data={chartData} agents={agents} />
        )}
      </CardContent>
    </Card>
  );
}

export default async function CostsPage() {
  const [allUsage, supabaseResult] = await Promise.all([
    loadAllUsage(),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("agents")
        .select("id, slug, name")
        .order("created_at", { ascending: true });
    })(),
  ]);

  const agents = supabaseResult.data ?? [];

  // For export: serialize usage rows as JSON in a script tag
  const exportData = allUsage.map((r) => ({
    agent: AGENT_DISPLAY_NAMES[r.agentId] ?? r.agentId,
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cost: r.cost,
    source: r.source,
    timestamp: new Date(r.timestamp).toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-zinc-400" />
          <h1 className="text-2xl font-semibold text-zinc-50">Token & Cost Tracking</h1>
        </div>
        <CostExportButton data={exportData} />
      </div>

      <CostKPIs rows={allUsage} />

      <AgentBreakdownTable rows={allUsage} agents={agents} />

      <CostTrendSection rows={allUsage} agents={agents} />
    </div>
  );
}
