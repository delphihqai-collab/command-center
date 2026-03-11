import { NextRequest, NextResponse } from "next/server";
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

  const { data, error } = await supabase
    .from("war_rooms")
    .select(
      "*, lead:pipeline_leads(id, company_name, deal_value_eur, stage, contact_name), agents:war_room_agents(id, agent_id, role, agent:agents(id, slug, name, type, status)), activity:war_room_activity(id, agent_id, action, detail, created_at, agent:agents(slug, name))"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, lead_id, priority, objective, agent_ids, type, config } = body as {
    name: string;
    lead_id?: string;
    priority?: string;
    objective?: string;
    agent_ids?: string[];
    type?: string;
    config?: Record<string, unknown>;
  };

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: warRoom, error: createErr } = await supabase
    .from("war_rooms")
    .insert({
      name,
      lead_id: lead_id ?? null,
      priority: priority ?? "high",
      objective: objective ?? null,
      type: type ?? "operation",
      config: config ?? {},
    })
    .select()
    .single();

  if (createErr || !warRoom) {
    return NextResponse.json({ error: createErr?.message ?? "Failed to create war room" }, { status: 500 });
  }

  // Add agents if provided
  if (agent_ids && agent_ids.length > 0) {
    const participants = agent_ids.map((agent_id, i) => ({
      war_room_id: warRoom.id,
      agent_id,
      role: i === 0 ? "lead" : "participant",
    }));

    await supabase.from("war_room_agents").insert(participants);
  }

  // Log creation activity
  await supabase.from("war_room_activity").insert({
    war_room_id: warRoom.id,
    action: "war_room_created",
    detail: `War room "${name}" activated with ${agent_ids?.length ?? 0} agents`,
  });

  return NextResponse.json(warRoom, { status: 201 });
}
