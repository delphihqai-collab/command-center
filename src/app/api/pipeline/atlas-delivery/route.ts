import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/pipeline/atlas-delivery
 * Webhook for Atlas to report demo build completion.
 * Body: { lead_id, website_url?, chatbot_url? }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.lead_id !== "string") {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  const websiteUrl = typeof body.website_url === "string" ? body.website_url : null;
  const chatbotUrl = typeof body.chatbot_url === "string" ? body.chatbot_url : null;

  if (!websiteUrl && !chatbotUrl) {
    return NextResponse.json(
      { error: "At least one of website_url or chatbot_url is required" },
      { status: 400 },
    );
  }

  const { data: lead, error: fetchError } = await supabase
    .from("pipeline_leads")
    .select("id, stage")
    .eq("id", body.lead_id)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("pipeline_leads")
    .update({
      stage: "product_ready",
      atlas_website_url: websiteUrl,
      atlas_chatbot_url: chatbotUrl,
      atlas_delivered_at: new Date().toISOString(),
    })
    .eq("id", body.lead_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lead_id: body.lead_id, stage: "product_ready" });
}
