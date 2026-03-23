import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "fleet_mode")
    .maybeSingle();

  const mode = (data?.value as string) ?? "active";
  return NextResponse.json({ mode });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { mode?: string };
  const mode = body.mode;

  if (!mode || !["active", "paused", "stopped"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode. Must be active, paused, or stopped." }, { status: 400 });
  }

  const { error } = await supabase
    .from("system_config")
    .upsert(
      { key: "fleet_mode", value: JSON.parse(JSON.stringify(mode)), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ mode });
}
