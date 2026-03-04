"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

async function verifyAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function advanceLeadStage(
  leadId: string,
  toStage: string
): Promise<ServerActionResult> {
  try {
    const { supabase, user } = await verifyAuth();

    // The DB trigger validates the transition — just attempt the update
    const { error } = await supabase
      .from("leads")
      .update({
        stage: toStage,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (error) {
      // Trigger raises "Invalid stage transition" for bad transitions
      if (error.message.includes("Invalid stage transition")) {
        return { success: false, error: "Invalid stage transition" };
      }
      return { success: false, error: error.message };
    }

    // Record in stage history
    await supabase.from("lead_stage_history").insert({
      lead_id: leadId,
      to_stage: toStage,
      note: `Advanced by ${user.email} via Command Center`,
    });

    revalidatePath("/pipeline");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
