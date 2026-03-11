import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("review_queue")
    .select("*, lead:pipeline_leads(id, company_name, contact_name, stage, deal_value_eur, icp_score, intent_score, company_industry, trigger_event), requested_by_agent:agents!review_queue_requested_by_fkey(id, slug, name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { lead_id, requested_by, review_type, context } = body as {
    lead_id: string;
    requested_by?: string;
    review_type?: string;
    context?: string;
  };

  if (!lead_id) return NextResponse.json({ error: "lead_id is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("review_queue")
    .insert({
      lead_id,
      requested_by: requested_by ?? null,
      review_type: review_type ?? "stage_gate",
      context: context ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
