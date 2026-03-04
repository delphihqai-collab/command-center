import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ results: {} });

  const supabase = await createClient();
  const tsquery = q.trim().split(/\s+/).join(" & ");

  const [leads, clients, proposals] = await Promise.all([
    supabase
      .from("leads")
      .select("id, company_name, sector, stage")
      .textSearch("search_vector", tsquery)
      .limit(5),
    supabase
      .from("clients")
      .select("id, company_name, sector")
      .textSearch("search_vector", tsquery)
      .limit(5),
    supabase
      .from("proposals")
      .select("id, scope_summary, status")
      .textSearch("search_vector", tsquery)
      .limit(5),
  ]);

  return NextResponse.json({
    results: {
      leads: leads.data ?? [],
      clients: clients.data ?? [],
      proposals: proposals.data ?? [],
    },
  });
}
