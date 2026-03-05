import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const ALLOWED_UNITS = ["openclaw-gateway", "command-center"] as const;
type Unit = (typeof ALLOWED_UNITS)[number];

const UNIT_MAP: Record<string, Unit[]> = {
  all: [...ALLOWED_UNITS],
  gateway: ["openclaw-gateway"],
  app: ["command-center"],
};

/** Parse gateway log messages like `2026-03-05T17:40:07.479Z [discord] some msg` */
function parseGatewayMessage(message: string): {
  component: string;
  text: string;
} {
  const match = message.match(
    /^\d{4}-\d{2}-\d{2}T[\d:.]+Z?\s*\[([^\]]+)]\s*(.*)$/
  );
  if (match) {
    return { component: match[1], text: match[2] };
  }
  // Also handle: `2026-03-05T17:45:04.522+00:00 [tools] ...`
  const matchOffset = message.match(
    /^\d{4}-\d{2}-\d{2}T[\d:.]+[+-]\d{2}:\d{2}\s*\[([^\]]+)]\s*(.*)$/
  );
  if (matchOffset) {
    return { component: matchOffset[1], text: matchOffset[2] };
  }
  return { component: "system", text: message };
}

async function readJournal(
  units: Unit[],
  since: string | null,
  lines: number,
  grep: string | null
): Promise<
  Array<{
    id: string;
    timestamp: string;
    source: string;
    component: string;
    message: string;
    priority: string;
  }>
> {
  const results: Array<{
    id: string;
    timestamp: string;
    source: string;
    component: string;
    message: string;
    priority: string;
  }> = [];

  const perUnit = Math.ceil(lines / units.length);

  const fetches = units.map(async (unit) => {
    const args = [
      "--user",
      "-u",
      unit,
      "-n",
      String(perUnit),
      "--no-pager",
      "--output=json",
    ];
    if (since) {
      args.push("--since", since);
    }
    if (grep) {
      args.push("--grep", grep);
    }

    try {
      const { stdout } = await execFileAsync("journalctl", args, {
        maxBuffer: 5 * 1024 * 1024,
      });
      const source =
        unit === "openclaw-gateway" ? "Gateway" : "App";
      return stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            const entry = JSON.parse(line) as Record<string, string>;
            const rawMessage = entry.MESSAGE ?? "";
            const timestamp = entry.__REALTIME_TIMESTAMP
              ? new Date(
                  Number(entry.__REALTIME_TIMESTAMP) / 1000
                ).toISOString()
              : new Date().toISOString();
            const { component, text } =
              unit === "openclaw-gateway"
                ? parseGatewayMessage(rawMessage)
                : { component: "next", text: rawMessage };
            return {
              id: `${unit}-${entry.__CURSOR ?? timestamp}`,
              timestamp,
              source,
              component,
              message: text,
              priority: entry.PRIORITY ?? "6",
            };
          } catch {
            return null;
          }
        })
        .filter(
          (
            e
          ): e is {
            id: string;
            timestamp: string;
            source: string;
            component: string;
            message: string;
            priority: string;
          } => e !== null
        );
    } catch {
      return [];
    }
  });

  const allResults = await Promise.all(fetches);
  results.push(...allResults.flat());

  // Sort by timestamp descending (newest first)
  results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return results.slice(0, lines);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const source = searchParams.get("source") ?? "all";
  const since = searchParams.get("since");
  const linesParam = searchParams.get("lines");
  const grep = searchParams.get("grep");

  const units = UNIT_MAP[source] ?? UNIT_MAP.all;
  const lines = Math.min(Math.max(Number(linesParam) || 500, 1), 1000);

  const entries = await readJournal(units, since, lines, grep);

  return NextResponse.json({ entries });
}
