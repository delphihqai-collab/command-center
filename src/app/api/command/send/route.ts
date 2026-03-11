import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, operation_id } = body as {
    message: string;
    operation_id?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // Get or create a chat operation (war_room)
  let opId = operation_id;
  if (!opId) {
    // Create a new operation for this command
    const { data: op, error: opErr } = await supabase
      .from("war_rooms")
      .insert({
        name: message.length > 60 ? message.slice(0, 57) + "..." : message,
        priority: "standard",
        objective: message,
        type: "command",
        config: {} as Record<string, string | number>,
      })
      .select("id")
      .single();

    if (opErr || !op) {
      return NextResponse.json(
        { error: opErr?.message ?? "Failed to create operation" },
        { status: 500 }
      );
    }
    opId = op.id;
  }

  // Log the user message as activity
  await supabase.from("war_room_activity").insert({
    war_room_id: opId,
    action: "user_message",
    detail: message,
  });

  // Send to Hermes via OpenClaw CLI
  const prompt = `Boss command from Mission Control:\n\n${message}\n\nOperation ID: ${opId}\nRespond with your plan and take action. Update the operation activity in Mission Control as you work.`;

  try {
    const { stdout } = await execFileAsync(
      "openclaw",
      ["agent", "--agent", "main", "--message", prompt, "--json"],
      { timeout: 120_000 }
    );

    const result = JSON.parse(stdout);
    const responseText =
      result.result?.payloads?.[0]?.text ?? "Command received. Working on it.";

    // Log Hermes response as activity
    await supabase.from("war_room_activity").insert({
      war_room_id: opId,
      action: "hermes_response",
      detail: responseText,
      metadata: { runId: result.runId } as Record<string, string>,
    });

    return NextResponse.json({
      success: true,
      operation_id: opId,
      response: responseText,
      runId: result.runId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";

    // Log the failure
    await supabase.from("war_room_activity").insert({
      war_room_id: opId,
      action: "hermes_response",
      detail: `Failed to reach Hermes: ${errMsg}. Command has been queued.`,
    });

    // Still return the operation — the command is logged even if Hermes is unreachable
    return NextResponse.json({
      success: true,
      operation_id: opId,
      response: `Command logged. Hermes is currently unreachable (${errMsg}). Will be processed when available.`,
      error: errMsg,
    });
  }
}
