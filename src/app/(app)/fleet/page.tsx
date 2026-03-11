import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { FleetView } from "./_components/fleet-view";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const supabase = await createClient();

  const [
    { data: agents },
    { data: topology },
    { data: comms },
    { data: activeOps },
  ] = await Promise.all([
    supabase.from("agents").select("*").order("slug"),
    supabase
      .from("team_topology")
      .select(
        "*, from_agent:agents!team_topology_from_agent_id_fkey(id, slug, name, type), to_agent:agents!team_topology_to_agent_id_fkey(id, slug, name, type)"
      )
      .eq("enabled", true),
    supabase
      .from("agent_comms")
      .select("from_agent_id, to_agent_id")
      .order("created_at", { ascending: false })
      .limit(500),
    // Get active operations per agent
    supabase
      .from("war_room_agents")
      .select(
        "agent_id, war_room:war_rooms!inner(id, name, status, type)"
      )
      .eq("war_rooms.status", "active"),
  ]);

  const agentsList = agents ?? [];
  const topoLinks = (topology ?? []) as unknown as {
    id: string;
    from_agent: { id: string; slug: string; name: string; type: string } | null;
    to_agent: { id: string; slug: string; name: string; type: string } | null;
    channel_type: string;
    description: string | null;
  }[];

  const commPairs: Record<string, number> = {};
  for (const c of comms ?? []) {
    const key = [c.from_agent_id, c.to_agent_id].sort().join("-");
    commPairs[key] = (commPairs[key] ?? 0) + 1;
  }

  // Map agent_id → active operations
  const agentOps: Record<
    string,
    { id: string; name: string; type: string | null }[]
  > = {};
  for (const row of activeOps ?? []) {
    const wr = row.war_room as unknown as {
      id: string;
      name: string;
      status: string;
      type: string | null;
    };
    if (!wr) continue;
    if (!agentOps[row.agent_id]) agentOps[row.agent_id] = [];
    agentOps[row.agent_id].push({
      id: wr.id,
      name: wr.name,
      type: wr.type,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="agents" />

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
          <Users className="h-7 w-7 text-indigo-400" />
          Fleet
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {agentsList.length} agents ·{" "}
          {agentsList.filter((a) => a.status === "active").length} active
        </p>
      </div>

      <FleetView
        agents={agentsList.map((a) => ({
          id: a.id,
          slug: a.slug,
          name: a.name,
          type: a.type,
          status: a.status,
          model: a.model,
          last_seen: a.last_seen,
          operations: agentOps[a.id] ?? [],
        }))}
        directLinks={topoLinks.map((t) => ({
          id: t.id,
          fromSlug: t.from_agent?.slug ?? "",
          toSlug: t.to_agent?.slug ?? "",
          fromName: t.from_agent?.name ?? "",
          toName: t.to_agent?.name ?? "",
          channelType: t.channel_type,
          description: t.description ?? "",
        }))}
        commFrequency={commPairs}
      />
    </div>
  );
}
