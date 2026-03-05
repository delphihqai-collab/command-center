import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const AGENT_BLOCKED_STATUSES = ["done"];

export async function GET(req: NextRequest) {
  const authError = validateAgentKey(req);
  if (authError) return authError;

  const supabase = createAdminClient();
  const status = req.nextUrl.searchParams.get("status");
  const assigned_to = req.nextUrl.searchParams.get("assigned_to");

  let query = supabase
    .from("tasks")
    .select("*, assigned_agent:assigned_to(id, name, slug)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const authError = validateAgentKey(req);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "inbox",
      priority: body.priority ?? "medium",
      assigned_to: body.assigned_to ?? null,
      project_id: body.project_id ?? null,
      labels: body.labels ?? [],
      created_by: body.created_by ?? "hermes-agent",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const authError = validateAgentKey(req);
  if (authError) return authError;

  const supabase = createAdminClient();
  const body = await req.json();
  const id = body.id;

  if (!id) {
    return NextResponse.json({ error: "Missing task id" }, { status: 400 });
  }

  // Agents cannot move tasks to "done" — only humans can
  if (body.status && AGENT_BLOCKED_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Agents cannot move tasks to '${body.status}'. Only humans can mark tasks done.` },
      { status: 403 }
    );
  }

  const { id: _id, ...updates } = body;
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
