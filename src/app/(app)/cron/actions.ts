"use server";

import { execFile } from "child_process";
import { promisify } from "util";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";

const execFileAsync = promisify(execFile);

const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN ?? "/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw";

export async function toggleCronJob(
  id: string,
  enabled: boolean
): Promise<ServerActionResult> {
  try {
    await execFileAsync(OPENCLAW_BIN, [
      "cron",
      "edit",
      id,
      "--enabled",
      String(enabled),
    ]);
    revalidatePath("/cron");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to toggle cron job";
    return { success: false, error: message };
  }
}

export async function triggerCronJob(
  id: string
): Promise<ServerActionResult> {
  try {
    await execFileAsync(OPENCLAW_BIN, ["cron", "run", id]);
    revalidatePath("/cron");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to trigger cron job";
    return { success: false, error: message };
  }
}
