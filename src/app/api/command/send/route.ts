import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const OPENCLAW_BIN = "/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw";

export const dynamic = "force-dynamic";

/** Get or create the singleton "chat" war room for Hermes conversations. */
async function getChatRoomId(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Try to find existing chat room
  const { data: existing } = await supabase
    .from("war_rooms")
    .select("id")
    .eq("type", "chat")
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Create singleton chat room
  const { data: created, error } = await supabase
    .from("war_rooms")
    .insert({
      name: "Hermes Chat",
      type: "chat",
      priority: "standard",
      status: "active",
      config: {} as Record<string, string | number>,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create chat room");
  return created.id;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message } = body as { message: string };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // Use singleton chat room — not a new operation per message
  const chatRoomId = await getChatRoomId(supabase);

  // Log the user message
  await supabase.from("war_room_activity").insert({
    war_room_id: chatRoomId,
    action: "user_message",
    detail: message,
  });

  // Send to Hermes via OpenClaw CLI
  const prompt = `Boss command from Mission Control:\n\n${message}\n\nRespond with your plan and take action.`;

  try {
    const { stdout } = await execFileAsync(
      OPENCLAW_BIN,
      ["agent", "--agent", "main", "--message", prompt, "--json"],
      { timeout: 120_000 }
    );

    const result = JSON.parse(stdout);
    const responseText =
      result.result?.payloads?.[0]?.text ?? "Command received. Working on it.";

    // Log Hermes response
    await supabase.from("war_room_activity").insert({
      war_room_id: chatRoomId,
      action: "hermes_response",
      detail: responseText,
      metadata: { runId: result.runId } as Record<string, string>,
    });

    return NextResponse.json({
      success: true,
      response: responseText,
      runId: result.runId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";

    // Log the failure
    await supabase.from("war_room_activity").insert({
      war_room_id: chatRoomId,
      action: "hermes_response",
      detail: `Failed to reach Hermes: ${errMsg}`,
    });

    return NextResponse.json({
      success: true,
      response: `Hermes is currently unreachable (${errMsg}). Command has been queued.`,
      error: errMsg,
    });
  }
}
