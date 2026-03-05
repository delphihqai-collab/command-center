import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const assigned_to = url.searchParams.get("assigned_to");
  const project_id = url.searchParams.get("project_id");
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  let query = supabase
    .from("tasks")
    .select("*, assigned_agent:assigned_to(name, slug)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);
  if (project_id) query = query.eq("project_id", project_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      due_date: body.due_date ?? null,
      labels: body.labels ?? [],
      created_by: body.created_by ?? user.email ?? "api",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
