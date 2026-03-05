"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function toggleScheduledTask(
  id: string,
  enabled: boolean
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_tasks")
    .update({ enabled })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/cron");
  return { success: true };
}

export async function triggerScheduledTask(
  id: string
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_tasks")
    .update({ last_run: new Date().toISOString(), last_status: "running" })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/cron");
  return { success: true };
}
