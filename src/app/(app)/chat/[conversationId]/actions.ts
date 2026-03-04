"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<ServerActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Unauthorized" };

    const trimmed = content.trim();
    if (!trimmed) return { success: false, error: "Message cannot be empty" };

    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: trimmed,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/chat/${conversationId}`);
    revalidatePath("/chat");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
