import { createClient } from "@/lib/supabase/server";
import { NerveCenter } from "./_components/nerve-center";
import { Building2 } from "lucide-react";
import { RealtimeRefresh } from "@/components/realtime-refresh";

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
      type: agent.type ?? "worker",
      last_heartbeat_at: latestHeartbeat?.fired_at ?? null,
      recentLogs,
    };
  });

  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-semibold text-zinc-50">The Office</h1>
        <span className="text-sm text-zinc-500">
          {activeCount} active · {agents.length} total
        </span>
      </div>
      <p className="text-sm text-zinc-400">
        Hermes is the central brain. All agents report to him. You communicate only with Hermes.
      </p>
      <RealtimeRefresh table="agents" />
      <NerveCenter agents={agentsWithMeta} />
    </div>
  );
}
