import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { data: agents, error: agentsErr },
    { data: topology, error: topoErr },
    { data: warRooms, error: wrErr },
    { data: pools, error: poolsErr },
    { data: experiments, error: expErr },
    { data: comms, error: commsErr },
    { data: leads, error: leadsErr },
  ] = await Promise.all([
    supabase.from("agents").select("*").order("slug"),
    supabase
      .from("team_topology")
      .select(
        "*, from_agent:agents!team_topology_from_agent_id_fkey(id, slug, name, type), to_agent:agents!team_topology_to_agent_id_fkey(id, slug, name, type)"
      )
      .eq("enabled", true),
    supabase
      .from("war_rooms")
      .select(
        "*, lead:pipeline_leads(id, company_name, deal_value_eur, stage), agents:war_room_agents(agent_id, role, agent:agents(id, slug, name, type))"
      )
      .in("status", ["active", "resolved"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("agent_pools").select("*, base_agent:agents!agent_pools_base_agent_id_fkey(id, slug, name)").order("capability"),
    supabase
      .from("fleet_experiments")
      .select("*, agent:agents(id, slug, name)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("agent_comms")
      .select(
        "id, from_agent_id, to_agent_id, channel, created_at, from_agent:agents!agent_comms_from_agent_id_fkey(slug, name), to_agent:agents!agent_comms_to_agent_id_fkey(slug, name)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("pipeline_leads")
      .select("id, stage, deal_value_eur, assigned_agent_id, created_at, closed_at")
      .not("stage", "in", "(closed_lost,disqualified)"),
  ]);

  if (agentsErr || topoErr || wrErr || poolsErr || expErr || commsErr || leadsErr) {
    return NextResponse.json(
      { error: "Failed to load team analysis data" },
      { status: 500 }
    );
  }

  // Compute communication frequency between agent pairs
  const commFrequency: Record<string, number> = {};
  for (const comm of comms ?? []) {
    const key = [comm.from_agent_id, comm.to_agent_id].sort().join("-");
    commFrequency[key] = (commFrequency[key] ?? 0) + 1;
  }

  // Pipeline metrics per agent
  const agentPipelineMetrics: Record<string, { activeLeads: number; totalValue: number }> = {};
  for (const lead of leads ?? []) {
    if (lead.assigned_agent_id) {
      const existing = agentPipelineMetrics[lead.assigned_agent_id] ?? { activeLeads: 0, totalValue: 0 };
      existing.activeLeads += 1;
      existing.totalValue += lead.deal_value_eur ?? 0;
      agentPipelineMetrics[lead.assigned_agent_id] = existing;
    }
  }

  return NextResponse.json({
    agents: agents ?? [],
    topology: topology ?? [],
    warRooms: warRooms ?? [],
    pools: pools ?? [],
    experiments: experiments ?? [],
    commFrequency,
    agentPipelineMetrics,
    totalLeads: (leads ?? []).length,
    totalPipelineValue: (leads ?? []).reduce((sum, l) => sum + (l.deal_value_eur ?? 0), 0),
  });
}
