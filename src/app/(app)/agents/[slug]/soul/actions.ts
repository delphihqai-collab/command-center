"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

export async function updateSoul(
  agentId: string,
  content: string
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("agent_souls")
    .upsert({ agent_id: agentId, content, updated_at: new Date().toISOString() }, { onConflict: "agent_id" });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/agents`);
  return { success: true };
}
