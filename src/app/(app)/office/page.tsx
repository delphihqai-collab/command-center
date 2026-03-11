import { createClient } from "@/lib/supabase/server";
import { NerveCenter } from "./_components/nerve-center";
import { Building2, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RealtimeRefresh } from "@/components/realtime-refresh";

interface TopologyLink {
  id: string;
  from_agent: { slug: string } | null;
  to_agent: { slug: string } | null;
  description: string | null;
}

export default async function OfficePage() {
  const supabase = await createClient();

  const [agentsRes, heartbeatsRes, logsRes, topoRes] = await Promise.all([
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
    supabase
      .from("team_topology")
      .select(
        "id, description, from_agent:agents!team_topology_from_agent_id_fkey(slug), to_agent:agents!team_topology_to_agent_id_fkey(slug)"
      )
      .eq("enabled", true),
  ]);

  const agents = agentsRes.data ?? [];
  const heartbeats = heartbeatsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const rawTopology = (topoRes.data ?? []) as unknown as TopologyLink[];

  const directLinks = rawTopology.map((t) => ({
    fromSlug: t.from_agent?.slug ?? "",
    toSlug: t.to_agent?.slug ?? "",
    description: t.description ?? "",
  }));

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
        {directLinks.length > 0 && (
          <Badge variant="outline" className="ml-2 border-cyan-800 text-cyan-400 text-[10px]">
            <Network className="mr-1 h-3 w-3" />
            {directLinks.length} P2P channels
          </Badge>
        )}
      </div>
      <p className="text-sm text-zinc-400">
        Hybrid topology: Hermes orchestrates strategy. Agents communicate directly for operational tasks.
      </p>
      <RealtimeRefresh table="agents" />
      <NerveCenter agents={agentsWithMeta} directLinks={directLinks} />
    </div>
  );
}
