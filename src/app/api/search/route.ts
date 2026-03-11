import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: { agents: [], leads: [] } });
  }

  const [agentsRes, leadsRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id, slug, name, status")
      .ilike("name", `%${q}%`)
      .limit(5),
    supabase
      .from("pipeline_leads")
      .select("id, company_name, stage")
      .ilike("company_name", `%${q}%`)
      .not("stage", "in", '("closed_won","closed_lost","disqualified")')
      .limit(5),
  ]);

  return NextResponse.json({
    results: {
      agents: agentsRes.data ?? [],
      leads: leadsRes.data ?? [],
    },
  });
}
