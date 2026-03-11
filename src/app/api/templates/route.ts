import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("outreach_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, category, channel, subject, body: templateBody, variables } = body as {
    name: string;
    category?: string;
    channel?: string;
    subject?: string;
    body: string;
    variables?: string[];
  };

  if (!name || !templateBody) {
    return NextResponse.json({ error: "name and body are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("outreach_templates")
    .insert({
      name,
      category: category ?? "outreach",
      channel: channel ?? "email",
      subject: subject ?? null,
      body: templateBody,
      variables: variables ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
