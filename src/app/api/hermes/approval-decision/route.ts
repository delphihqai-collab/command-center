import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since =
    new URL(req.url).searchParams.get("since") ??
    new Date(Date.now() - 3600000).toISOString();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("approvals")
    .select(
      "id, status, action_summary, decided_by, decision_reason, decided_at"
    )
    .in("status", ["approved", "rejected"])
    .gte("decided_at", since);

  return NextResponse.json({ decisions: data ?? [] });
}
