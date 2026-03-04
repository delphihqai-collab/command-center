import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stdout } = await execFileAsync("journalctl", [
      "--user",
      "-u",
      "command-center",
      "-n",
      "100",
      "--no-pager",
      "--output=json",
    ]);

    const lines = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          const entry = JSON.parse(line);
          return {
            timestamp: entry.__REALTIME_TIMESTAMP
              ? new Date(
                  Number(entry.__REALTIME_TIMESTAMP) / 1000
                ).toISOString()
              : entry._SOURCE_REALTIME_TIMESTAMP
                ? new Date(
                    Number(entry._SOURCE_REALTIME_TIMESTAMP) / 1000
                  ).toISOString()
                : null,
            message: entry.MESSAGE ?? "",
            priority: entry.PRIORITY ?? "6",
            unit: entry._SYSTEMD_USER_UNIT ?? "",
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ entries: lines });
  } catch {
    return NextResponse.json({ entries: [], error: "Failed to read journal" });
  }
}
