"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function toggleIntegration(
  id: string,
  enabled: boolean
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .update({ enabled })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/integrations");
  return { success: true };
}
