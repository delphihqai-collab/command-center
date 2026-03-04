"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function updateNotificationPreferences(
  formData: FormData
): Promise<ServerActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Unauthorized" };

    const prefs = {
      user_id: user.id,
      alert_channel: formData.get("alert_channel") as string,
      approval_channel: formData.get("approval_channel") as string,
      report_channel: formData.get("report_channel") as string,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(prefs, { onConflict: "user_id" });

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

export async function updatePipelineConfig(
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
      .from("pipeline_config")
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
