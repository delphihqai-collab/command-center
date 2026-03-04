import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";
import { SessionsTableClient } from "./_components/sessions-table-client";

export default async function SessionsPage() {
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("id, slug, name, status")
    .order("created_at", { ascending: true });

  // Try to fetch gateway sessions
  let gatewaySessions: {
    session_key: string;
    agent_slug: string;
    status: string;
    started_at: string;
    last_activity_at: string;
    estimated_cost_usd: number;
  }[] = [];

  try {
    const res = await fetch("http://localhost:18789/sessions", { cache: "no-store" });
    if (res.ok) {
      gatewaySessions = await res.json();
    }
  } catch {
    // Gateway not reachable — fall back to empty
  }

  // Fallback: use agent_logs for recent activity if no gateway sessions
  const { data: recentLogs } = await supabase
    .from("agent_logs")
    .select("agent_id, action, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const allAgents = agents ?? [];
  const allLogs = recentLogs ?? [];

  // Build session data: left-join agents against gateway sessions
  const sessionRows = allAgents.map((agent) => {
    const session = gatewaySessions.find((s) => s.agent_slug === agent.slug);
    const lastLog = allLogs.find((l) => l.agent_id === agent.id);

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentSlug: agent.slug,
      agentStatus: agent.status,
      sessionKey: session?.session_key ?? null,
      sessionStatus: session?.status ?? null,
      startedAt: session?.started_at ?? null,
      lastActivity: session?.last_activity_at ?? lastLog?.created_at ?? null,
      estimatedCost: session?.estimated_cost_usd ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-semibold text-zinc-50">Sessions</h1>
        <span className="text-sm text-zinc-500">
          {gatewaySessions.length > 0
            ? `${gatewaySessions.filter((s) => s.status === "active").length} active`
            : "Gateway offline — showing fallback data"}
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
