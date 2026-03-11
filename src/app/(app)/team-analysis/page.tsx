import { createClient } from "@/lib/supabase/server";
import {
  Network,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  FlaskConical,
  Shield,
  Target,
  Scale,
  BarChart3,
  BookOpen,
  Megaphone,
  Handshake,
  UserCheck,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopologyVisualizer } from "./_components/topology-visualizer";
import { PoolsPanel } from "./_components/pools-panel";
import { ExperimentsPanel } from "./_components/experiments-panel";
import { OptimizationInsights } from "./_components/optimization-insights";

export const dynamic = "force-dynamic";

const AGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sdr: Megaphone,
  "account-executive": Handshake,
  "account-manager": UserCheck,
  finance: Calculator,
  legal: Scale,
  "market-intelligence": BarChart3,
  "knowledge-curator": BookOpen,
};

interface TopologyRow {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  channel_type: string;
  enabled: boolean;
  description: string | null;
  from_agent: { id: string; slug: string; name: string; type: string } | null;
  to_agent: { id: string; slug: string; name: string; type: string } | null;
}

interface PoolRow {
  id: string;
  capability: string;
  display_name: string;
  description: string | null;
  min_instances: number;
  max_instances: number;
  current_instances: number;
  scaling_strategy: string;
  enabled: boolean;
  base_agent: { id: string; slug: string; name: string } | null;
}

interface ExperimentRow {
  id: string;
  name: string;
  hypothesis: string;
  category: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  agent: { id: string; slug: string; name: string } | null;
}

export default async function TeamAnalysisPage() {
  const supabase = await createClient();

  const [
    { data: agents, error: agentsErr },
    { data: rawTopology, error: topoErr },
    { data: rawPools, error: poolsErr },
    { data: rawExperiments, error: expErr },
    { data: comms },
    { data: warRoomCount },
    { data: leads },
  ] = await Promise.all([
    supabase.from("agents").select("*").order("slug"),
    supabase
      .from("team_topology")
      .select(
        "*, from_agent:agents!team_topology_from_agent_id_fkey(id, slug, name, type), to_agent:agents!team_topology_to_agent_id_fkey(id, slug, name, type)"
      )
      .eq("enabled", true),
    supabase
      .from("agent_pools")
      .select("*, base_agent:agents!agent_pools_base_agent_id_fkey(id, slug, name)")
      .order("capability"),
    supabase
      .from("fleet_experiments")
      .select("*, agent:agents(id, slug, name)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("agent_comms")
      .select("from_agent_id, to_agent_id")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("war_rooms").select("id", { count: "exact" }).eq("status", "active"),
    supabase
      .from("pipeline_leads")
      .select("stage, deal_value_eur, assigned_agent_id")
      .not("stage", "in", "(closed_won,closed_lost,disqualified)"),
  ]);

  if (agentsErr || topoErr) {
    return (
      <div className="p-8 text-red-400">
        Failed to load team analysis data.
      </div>
    );
  }

  const agentsList = agents ?? [];
  const topology = (rawTopology ?? []) as unknown as TopologyRow[];
  const pools = (rawPools ?? []) as unknown as PoolRow[];
  const experiments = (rawExperiments ?? []) as unknown as ExperimentRow[];
  const activeWarRooms = warRoomCount?.length ?? 0;
  const activeLeads = leads ?? [];

  // Compute communication frequency
  const commPairs: Record<string, number> = {};
  for (const c of comms ?? []) {
    const key = [c.from_agent_id, c.to_agent_id].sort().join("-");
    commPairs[key] = (commPairs[key] ?? 0) + 1;
  }

  // KPI metrics
  const directChannels = topology.length;
  const totalPipelineValue = activeLeads.reduce(
    (sum, l) => sum + (l.deal_value_eur ?? 0),
    0
  );
  const activeAgents = agentsList.filter((a) => a.status === "active").length;
  const runningExperiments = experiments.filter(
    (e) => e.status === "running"
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
            <Network className="h-7 w-7 text-indigo-400" />
            Team Analysis
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Fleet intelligence, communication topology, and organizational
            optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-indigo-700 text-indigo-400"
          >
            Hybrid Topology
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-700 text-emerald-400"
          >
            {activeAgents}/{agentsList.length} Active
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Network className="h-3.5 w-3.5" />
              Direct Channels
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {directChannels}
            </p>
            <p className="text-xs text-zinc-500">peer-to-peer links</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Shield className="h-3.5 w-3.5" />
              War Rooms
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {activeWarRooms}
            </p>
            <p className="text-xs text-zinc-500">active collaborations</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Target className="h-3.5 w-3.5" />
              Pipeline
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {activeLeads.length}
            </p>
            <p className="text-xs text-zinc-500">
              {new Intl.NumberFormat("en-EU", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(totalPipelineValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FlaskConical className="h-3.5 w-3.5" />
              Experiments
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {runningExperiments}
            </p>
            <p className="text-xs text-zinc-500">
              {experiments.length} total
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Zap className="h-3.5 w-3.5" />
              Scaling
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {pools.filter((p) => p.enabled).length}/{pools.length}
            </p>
            <p className="text-xs text-zinc-500">pools enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Topology Visualization */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-50">
            <Network className="h-4 w-4 text-indigo-400" />
            Communication Topology
          </CardTitle>
          <p className="text-xs text-zinc-500">
            Hybrid architecture: hierarchical strategy through Hermes +
            peer-to-peer operational channels
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
            directLinks={topology.map((t) => ({
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

      {/* Two column: Optimization Insights + Experiments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OptimizationInsights
          agents={agentsList}
          topology={topology}
          pipelineLeads={activeLeads}
          commPairs={commPairs}
        />
        <ExperimentsPanel experiments={experiments} />
      </div>

      {/* Elastic Pools */}
      <PoolsPanel pools={pools} />

      {/* Direct Channel Registry */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-50">
            <ArrowRight className="h-4 w-4 text-cyan-400" />
            Direct Channel Registry
          </CardTitle>
          <p className="text-xs text-zinc-500">
            Operational peer-to-peer channels. Strategic decisions still route
            through Hermes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topology.map((link) => {
              const FromIcon =
                AGENT_ICONS[link.from_agent?.slug ?? ""] ?? Users;
              const ToIcon = AGENT_ICONS[link.to_agent?.slug ?? ""] ?? Users;
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center gap-2">
                    <FromIcon className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">
                      {link.from_agent?.name ?? "Unknown"}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                  <div className="flex items-center gap-2">
                    <ToIcon className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">
                      {link.to_agent?.name ?? "Unknown"}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-auto border-zinc-700 text-xs text-zinc-500"
                  >
                    {link.channel_type}
                  </Badge>
                  {link.description && (
                    <span className="hidden text-xs text-zinc-500 lg:block max-w-xs truncate">
                      {link.description}
                    </span>
                  )}
                </div>
              );
            })}
            {topology.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-500">
                No direct channels configured. All communication routes through
                Hermes.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
