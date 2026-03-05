"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function createWorkflow(data: {
  name: string;
  description?: string;
  steps: unknown[];
}): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("workflows").insert({
    name: data.name,
    description: data.description ?? null,
    steps: data.steps,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/workflows");
  return { success: true };
}

export async function toggleWorkflow(
  id: string,
  enabled: boolean
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workflows")
    .update({ enabled })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/workflows");
  return { success: true };
}
