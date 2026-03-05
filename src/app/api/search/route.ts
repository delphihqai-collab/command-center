import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: { tasks: [], agents: [] } });
  }

  const tsQuery = q.split(/\s+/).filter(Boolean).join(" & ");

  const [tasksRes, agentsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority")
      .textSearch("search_vector", tsQuery)
      .is("archived_at", null)
      .limit(5),
    supabase
      .from("agents")
      .select("id, slug, name, status")
      .ilike("name", `%${q}%`)
      .limit(5),
  ]);

  return NextResponse.json({
    results: {
      tasks: tasksRes.data ?? [],
      agents: agentsRes.data ?? [],
    },
  });
}
