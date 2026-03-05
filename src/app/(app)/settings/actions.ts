"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function updateSystemConfig(
  key: string,
  value: string
): Promise<ServerActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("system_config")
      .upsert(
        { key, value: JSON.parse(value), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
