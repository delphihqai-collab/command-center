import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_targets")
    .select("*")
    .eq("date", today)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_targets")
    .upsert({
      date: body.date ?? today,
      leads_target: body.leads_target ?? 0,
      leads_actual: body.leads_actual ?? 0,
      outreach_target: body.outreach_target ?? 0,
      outreach_actual: body.outreach_actual ?? 0,
      meetings_target: body.meetings_target ?? 0,
      meetings_actual: body.meetings_actual ?? 0,
      revenue_target: body.revenue_target ?? 0,
      revenue_actual: body.revenue_actual ?? 0,
      notes: body.notes ?? null,
    }, { onConflict: "date" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
