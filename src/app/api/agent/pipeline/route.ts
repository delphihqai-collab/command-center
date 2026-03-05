import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AGENT_ALLOWED_STAGES } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";

export async function GET(req: NextRequest) {
  const authError = validateAgentKey(req);
  if (authError) return authError;

  const supabase = createAdminClient();
  const stage = req.nextUrl.searchParams.get("stage");

  let query = supabase
    .from("pipeline_leads")
    .select("*, assigned_agent:assigned_agent_id(id, name, slug)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (stage) query = query.eq("stage", stage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}

export async function POST(req: NextRequest) {
  const authError = validateAgentKey(req);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("pipeline_leads")
    .insert({
      company_name: body.company_name,
      contact_name: body.contact_name,
      contact_email: body.contact_email ?? null,
      contact_role: body.contact_role ?? null,
      source: body.source ?? "inbound",
      stage: body.stage ?? "new_lead",
      assigned_agent_id: body.assigned_agent_id ?? null,
      deal_value_eur: body.deal_value_eur ?? null,
      confidence: body.confidence ?? null,
      sdr_brief: body.sdr_brief ?? null,
      discovery_notes: body.discovery_notes ?? null,
      metadata: body.metadata ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const authError = validateAgentKey(req);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await req.json();
  const id = body.id;

  if (!id) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  // Agents cannot close deals — only humans can
  if (body.stage && !AGENT_ALLOWED_STAGES.includes(body.stage as PipelineStage)) {
    return NextResponse.json(
      { error: `Agents cannot move leads to '${body.stage}'. Only humans can close deals.` },
      { status: 403 }
    );
  }

  const { id: _id, ...updates } = body;
  const { data, error } = await supabase
    .from("pipeline_leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
