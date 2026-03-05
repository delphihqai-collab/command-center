"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";
import { createWebhookSchema, type CreateWebhookInput } from "@/lib/schemas";

export async function createWebhook(
  input: CreateWebhookInput
): Promise<ServerActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const parsed = createWebhookSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("webhooks")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/webhooks");
  return { success: true, data: { id: data.id } };
}

export async function toggleWebhook(
  id: string,
  enabled: boolean
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("webhooks")
    .update({ enabled })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/webhooks");
  return { success: true };
}

export async function deleteWebhook(id: string): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("webhooks").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/webhooks");
  return { success: true };
}
