import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [agentRes, taskRes, alertRes] = await Promise.all([
    supabase.from("agents").select("id, status").eq("status", "active"),
    supabase.from("tasks").select("id, status").is("archived_at", null),
    supabase.from("alert_events").select("id").eq("resolved", false),
  ]);

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    agents: {
      active: agentRes.data?.length ?? 0,
    },
    tasks: {
      total: taskRes.data?.length ?? 0,
      in_progress: taskRes.data?.filter((t) => t.status === "in_progress").length ?? 0,
    },
    alerts: {
      open: alertRes.data?.length ?? 0,
    },
  });
}
