import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { decision, decision_notes } = body as {
    decision: "approved" | "rejected" | "needs_info";
    decision_notes?: string;
  };

  if (!decision) return NextResponse.json({ error: "decision is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("review_queue")
    .update({
      status: decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "needs_info",
      decision,
      decision_notes: decision_notes ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, move lead to outreach
  if (decision === "approved" && data.lead_id) {
    await supabase
      .from("pipeline_leads")
      .update({ stage: "outreach", review_decision: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", data.lead_id);
  }

  return NextResponse.json(data);
}
