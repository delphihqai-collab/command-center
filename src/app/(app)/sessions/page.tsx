import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor } from "lucide-react";
import { SessionsTableClient } from "./_components/sessions-table-client";
import { execFile } from "child_process";
import { promisify } from "util";
import { calculateCost } from "@/lib/model-costs";

const execFileAsync = promisify(execFile);

// OpenClaw is installed via nvm — systemd doesn't inherit nvm PATH
const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN ?? "/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw";

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

export default async function SessionsPage() {
  const supabase = await createClient();

  // Fetch agents from Supabase + sessions from OpenClaw CLI in parallel
  const [agentsResult, sessionsResult] = await Promise.all([
    supabase
      .from("agents")
      .select("id, slug, name, status")
      .order("created_at", { ascending: true }),
    execFileAsync(OPENCLAW_BIN, ["sessions", "--all-agents", "--json"])
      .then((result) => {
        const data = JSON.parse(result.stdout) as {
          count: number;
          sessions: OpenClawSession[];
        };
        return { sessions: data.sessions, error: null };
      })
      .catch(() => ({ sessions: [] as OpenClawSession[], error: "CLI failed" })),
  ]);

  const allAgents = agentsResult.data ?? [];
  const { sessions: openclawSessions, error: cliError } = sessionsResult;

  // Filter out :run: child sessions — they duplicate the parent cron session data
  const filteredSessions = openclawSessions.filter(
    (s) => !/:run:[0-9a-f-]+$/.test(s.key)
  );

  // Build a map: agentSlug → array of sessions (an agent can have multiple)
  const sessionsByAgent = new Map<string, OpenClawSession[]>();
  for (const s of filteredSessions) {
    const existing = sessionsByAgent.get(s.agentId) ?? [];
    existing.push(s);
    sessionsByAgent.set(s.agentId, existing);
  }

  // Build session rows: one per OpenClaw session, grouped by agent
  const sessionRows = allAgents.flatMap((agent) => {
    const agentSessions = sessionsByAgent.get(agent.slug) ?? [];
    if (agentSessions.length === 0) {
      return [
        {
          agentId: agent.id,
          agentName: agent.name,
          agentSlug: agent.slug,
          sessionKey: null,
          sessionKind: null,
          model: null,
          totalTokens: null,
          contextTokens: null,
          estimatedCost: null,
          lastActivity: null,
          contextUsagePercent: null,
        },
      ];
    }
    return agentSessions
      .sort((a, b) => a.ageMs - b.ageMs) // most recent first
      .map((s) => ({
        agentId: agent.id,
        agentName: agent.name,
        agentSlug: agent.slug,
        sessionKey: s.key,
        sessionKind: s.kind,
        model: s.model,
        totalTokens: s.totalTokens,
        contextTokens: s.contextTokens,
        estimatedCost:
          s.inputTokens && s.outputTokens
            ? calculateCost(s.model, s.inputTokens, s.outputTokens)
            : null,
        lastActivity: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
        contextUsagePercent:
          s.totalTokens && s.contextTokens
            ? Math.round((s.totalTokens / s.contextTokens) * 100)
            : null,
      }));
  });

  const activeCount = filteredSessions.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-semibold text-zinc-50">Sessions</h1>
        <span className="text-sm text-zinc-500">
          {cliError
            ? "OpenClaw CLI unavailable"
            : `${activeCount} sessions across ${sessionsByAgent.size} agents`}
        </span>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          <SessionsTableClient sessions={sessionRows} />
        </CardContent>
      </Card>
    </div>
  );
}
