"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function addClientNote(
  clientId: string,
  content: string
): Promise<ServerActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase.from("client_notes").insert({
      client_id: clientId,
      content,
      author: user.email ?? "unknown",
    });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
