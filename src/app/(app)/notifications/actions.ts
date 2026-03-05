"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function markAsRead(id: string): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllRead(): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) return { success: false, error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}
