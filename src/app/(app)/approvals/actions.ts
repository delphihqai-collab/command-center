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

export async function approveAction(
  approvalId: string,
  notes?: string
): Promise<ServerActionResult> {
  try {
    const { supabase, user } = await verifyAuth();

    const { error } = await supabase
      .from("approvals")
      .update({
        status: "approved",
        decision_at: new Date().toISOString(),
        decided_at: new Date().toISOString(),
        approved_by_user_id: user.id,
        decided_by: user.email ?? "boss",
        approval_notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", approvalId)
      .eq("status", "pending");

    if (error) return { success: false, error: error.message };

    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function rejectAction(
  approvalId: string,
  notes?: string
): Promise<ServerActionResult> {
  try {
    const { supabase, user } = await verifyAuth();

    const { error } = await supabase
      .from("approvals")
      .update({
        status: "rejected",
        decision_at: new Date().toISOString(),
        decided_at: new Date().toISOString(),
        approved_by_user_id: user.id,
        decided_by: user.email ?? "boss",
        decision_reason: notes ?? null,
        approval_notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", approvalId)
      .eq("status", "pending");

    if (error) return { success: false, error: error.message };

    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
