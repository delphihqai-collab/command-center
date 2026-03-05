import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHmac } from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: webhook, error: whError } = await supabase
    .from("webhooks")
    .select("*")
    .eq("id", id)
    .single();

  if (whError || !webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const payload = {
    event: "test",
    timestamp: new Date().toISOString(),
    data: { message: "Test delivery from Mission Control" },
  };

  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", webhook.secret)
    .update(body)
    .digest("hex");

  const startTime = Date.now();
  let statusCode = 0;
  let responseText = "";
  let success = false;

  try {
    const resp = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    statusCode = resp.status;
    responseText = await resp.text().catch(() => "");
    success = resp.ok;
  } catch (err) {
    responseText = err instanceof Error ? err.message : "Unknown error";
  }

  const durationMs = Date.now() - startTime;

  await supabase.from("webhook_deliveries").insert({
    webhook_id: id,
    event_type: "test",
    payload,
    status_code: statusCode || null,
    response: responseText.slice(0, 1000),
    duration_ms: durationMs,
    success,
  });

  return NextResponse.json({ success, status_code: statusCode, duration_ms: durationMs });
}
