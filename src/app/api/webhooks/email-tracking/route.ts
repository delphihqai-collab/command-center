import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/email-tracking
 * Webhook for email tracking events (opens, clicks, replies).
 * Body: { lead_id, event: "open" | "click" | "reply", reply_sentiment?: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.lead_id !== "string") {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  const event = body.event;
  if (!event || !["open", "click", "reply"].includes(event)) {
    return NextResponse.json({ error: "event must be open, click, or reply" }, { status: 400 });
  }

  const { data: lead, error: fetchError } = await supabase
    .from("pipeline_leads")
    .select("id, engagement_score, lead_temperature")
    .eq("id", body.lead_id)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const currentScore = lead.engagement_score ?? 0;

  // Engagement scoring: open +5, click +15, reply +30
  const scoreMap: Record<string, number> = { open: 5, click: 15, reply: 30 };
  const newScore = currentScore + (scoreMap[event] ?? 0);

  // Derive temperature from engagement score
  let temperature: string;
  if (newScore >= 50) temperature = "on_fire";
  else if (newScore >= 30) temperature = "hot";
  else if (newScore >= 10) temperature = "warm";
  else temperature = "cold";

  const update: Record<string, unknown> = {
    engagement_score: newScore,
    lead_temperature: temperature,
  };

  // If reply event, also update stage and sentiment
  if (event === "reply") {
    update.stage = "engaged";
    if (typeof body.reply_sentiment === "string") {
      update.reply_sentiment = body.reply_sentiment;
    }
  }

  const { error } = await supabase
    .from("pipeline_leads")
    .update(update)
    .eq("id", body.lead_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    lead_id: body.lead_id,
    engagement_score: newScore,
    temperature,
  });
}
