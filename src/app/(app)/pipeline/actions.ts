"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult, PipelineStage } from "@/lib/types";
import { TERMINAL_STAGES } from "@/lib/types";

export async function moveLead(
  leadId: string,
  newStage: PipelineStage
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const closedAt = TERMINAL_STAGES.includes(newStage)
    ? new Date().toISOString()
    : null;

  const { error } = await supabase
    .from("pipeline_leads")
    .update({ stage: newStage, closed_at: closedAt })
    .eq("id", leadId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/pipeline");
  revalidatePath("/war-room");
  return { success: true };
}

export async function createLead(input: {
  company_name: string;
  contact_name: string;
  contact_email?: string;
  contact_role?: string;
  source?: string;
}): Promise<ServerActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("pipeline_leads")
    .insert({
      company_name: input.company_name,
      contact_name: input.contact_name,
      contact_email: input.contact_email ?? null,
      contact_role: input.contact_role ?? null,
      source: input.source ?? "manual",
      stage: "discovery",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/pipeline");
  return { success: true, data: { id: data.id } };
}

export async function notifyHermes(
  type: "task" | "pipeline",
  id: string,
  message?: string
): Promise<ServerActionResult<{ response: string | null }>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const res = await fetch("http://localhost:9069/api/agent/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id, message }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    return { success: false, error: body.error ?? "Failed to notify Hermes" };
  }

  const data = await res.json();
  return { success: true, data: { response: data.response } };
}
