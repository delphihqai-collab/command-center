import { createClient } from "@/lib/supabase/server";
import { OfficeFloor } from "./_components/office-floor";
import { Building2 } from "lucide-react";
import { RealtimeRefresh } from "@/components/realtime-refresh";

const AGENT_RANKS: Record<string, "director" | "senior" | "standard" | "support" | "research"> = {
  hermes: "director",
  ae: "senior",
  am: "standard",
  sdr: "standard",
  finance: "support",
  legal: "support",
  "market-intelligence": "research",
  "knowledge-curator": "research",
};

export default async function OfficePage() {
  const supabase = await createClient();

  const [agentsRes, heartbeatsRes, logsRes] = await Promise.all([
    supabase.from("agents").select("*").order("created_at", { ascending: true }),
    supabase
      .from("heartbeats")
      .select("*")
      .order("fired_at", { ascending: false })
      .limit(50),
    supabase
      .from("agent_logs")
      .select("*, agents!agent_logs_agent_id_fkey(name)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const agents = agentsRes.data ?? [];
  const heartbeats = heartbeatsRes.data ?? [];
  const logs = logsRes.data ?? [];

  const agentsWithMeta = agents.map((agent) => {
    const latestHeartbeat = heartbeats.find(
      (h) => h.job_name?.toLowerCase().includes(agent.slug)
    );
    const recentLogs = logs
      .filter((l) => l.agent_id === agent.id)
      .slice(0, 3);

    return {
      ...agent,
      rank: AGENT_RANKS[agent.slug] ?? "standard",
      last_heartbeat_at: latestHeartbeat?.fired_at ?? null,
      recentLogs,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-semibold text-zinc-50">The Office</h1>
        <span className="text-sm text-zinc-500">
          {agents.filter((a) => a.status === "active").length} active · {agents.length} total
        </span>
      </div>
      <RealtimeRefresh table="agents" />
      <OfficeFloor agents={agentsWithMeta} />
    </div>
  );
}
