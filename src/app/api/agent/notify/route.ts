import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, id, message } = body;

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  let prompt: string;

  if (type === "task") {
    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, labels")
      .eq("id", id)
      .single();

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    prompt = `Boss assigned you a new task in Mission Control.\n\nTask ID: ${task.id}\nTitle: ${task.title}\nPriority: ${task.priority}\nStatus: ${task.status}\n${task.description ? `Description: ${task.description}\n` : ""}${message ? `Boss notes: ${message}\n` : ""}\nPick this up. Decide which agent(s) to involve, move the board, and deliver. Use the MC API to update task status as you work. You can move it up to "review" — only Boss can move to "done".`;
  } else if (type === "pipeline") {
    const { data: lead } = await supabase
      .from("pipeline_leads")
      .select("id, company_name, contact_name, stage")
      .eq("id", id)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    prompt = `Boss wants you to work on a pipeline lead in Mission Control.\n\nLead ID: ${lead.id}\nCompany: ${lead.company_name}\nContact: ${lead.contact_name}\nStage: ${lead.stage}\n${message ? `Boss notes: ${message}\n` : ""}\nProgress this lead through the pipeline. Use the MC API to update the lead stage and data as you work.`;
  } else {
    return NextResponse.json({ error: "Unknown type. Use 'task' or 'pipeline'." }, { status: 400 });
  }

  try {
    const { stdout } = await execFileAsync("openclaw", [
      "agent",
      "--agent", "main",
      "--message", prompt,
      "--json",
    ], { timeout: 120_000 });

    const result = JSON.parse(stdout);
    return NextResponse.json({
      success: true,
      runId: result.runId,
      response: result.result?.payloads?.[0]?.text ?? null,
    });
  } catch (err) {
    const message2 = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to notify Hermes: ${message2}` }, { status: 502 });
  }
}
