import { createClient } from "@/lib/supabase/server";
import { Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopologyVisualizer } from "./_components/topology-visualizer";

export const dynamic = "force-dynamic";

export default async function OfficePage() {
  const supabase = await createClient();

  const [
    { data: agents },
    { data: topology },
    { data: comms },
  ] = await Promise.all([
    supabase.from("agents").select("id, slug, name, type, status").order("slug"),
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

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
          <Network className="h-7 w-7 text-indigo-400" />
          Office
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Fleet topology and communication visualization
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-50">
            <Network className="h-4 w-4 text-indigo-400" />
            Communication Topology
          </CardTitle>
          <p className="text-xs text-zinc-500">
            Hybrid architecture: hierarchical strategy through Hermes + peer-to-peer operational channels
          </p>
        </CardHeader>
        <CardContent>
          <TopologyVisualizer
            agents={agentsList.map((a) => ({
              id: a.id,
              slug: a.slug,
              name: a.name,
              type: a.type,
              status: a.status,
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
        </CardContent>
      </Card>
    </div>
  );
}
