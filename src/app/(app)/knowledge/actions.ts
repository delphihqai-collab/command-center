"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function createDealLearning(
  formData: FormData
): Promise<ServerActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Unauthorized" };

    const lead_id = formData.get("lead_id") as string;
    const key_learning = formData.get("key_learning") as string;
    const outcome = formData.get("outcome") as string;

    if (!lead_id || !key_learning || !outcome) {
      return { success: false, error: "Missing required fields" };
    }

    const { error } = await supabase.from("deal_learnings").insert({
      lead_id,
      key_learning,
      outcome,
      loss_reason_primary: (formData.get("loss_reason_primary") as string) || null,
      competitor_name: (formData.get("competitor_name") as string) || null,
      competitor_involved: formData.get("competitor_involved") === "true",
      icp_match_quality: (formData.get("icp_match_quality") as string) || null,
      deal_velocity_days: formData.get("deal_velocity_days")
        ? Number(formData.get("deal_velocity_days"))
        : null,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/knowledge");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function updateDealLearning(
  id: string,
  formData: FormData
): Promise<ServerActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Unauthorized" };

    const key_learning = formData.get("key_learning") as string;
    const outcome = formData.get("outcome") as string;

    if (!key_learning || !outcome) {
      return { success: false, error: "Missing required fields" };
    }

    const { error } = await supabase
      .from("deal_learnings")
      .update({
        key_learning,
        outcome,
        loss_reason_primary: (formData.get("loss_reason_primary") as string) || null,
        competitor_name: (formData.get("competitor_name") as string) || null,
        competitor_involved: formData.get("competitor_involved") === "true",
        icp_match_quality: (formData.get("icp_match_quality") as string) || null,
        deal_velocity_days: formData.get("deal_velocity_days")
          ? Number(formData.get("deal_velocity_days"))
          : null,
      })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/knowledge");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
