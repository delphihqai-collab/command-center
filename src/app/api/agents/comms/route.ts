import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channel = req.nextUrl.searchParams.get("channel");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);

  let query = supabase
    .from("agent_comms")
    .select("*, from_agent:from_agent_id(name, slug), to_agent:to_agent_id(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channel) query = query.eq("channel", channel);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("agent_comms")
    .insert({
      from_agent_id: body.from_agent_id,
      to_agent_id: body.to_agent_id ?? null,
      channel: body.channel ?? "general",
      message: body.message,
      metadata: body.metadata ?? {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comm: data }, { status: 201 });
}
