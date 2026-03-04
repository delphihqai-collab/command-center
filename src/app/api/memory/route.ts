import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEMORY_PATHS } from "@/lib/memory-paths";
import { readdir, readFile } from "fs/promises";
import { resolve, normalize } from "path";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const agent = searchParams.get("agent");
  const file = searchParams.get("file");
  const search = searchParams.get("search");

  if (!agent || !(agent in MEMORY_PATHS)) {
    return NextResponse.json(
      { error: "Invalid agent parameter" },
      { status: 400 }
    );
  }

  const basePath = MEMORY_PATHS[agent];

  // Search mode: grep across all files for the agent
  if (search) {
    try {
      const files = await readdir(basePath);
      const results: { file: string; matches: string[] }[] = [];
      const query = search.toLowerCase();

      for (const f of files) {
        const fullPath = resolve(basePath, f);
        const normalized = normalize(fullPath);
        if (!normalized.startsWith(basePath)) continue;

        try {
          const content = await readFile(normalized, "utf-8");
          const lines = content.split("\n");
          const matchingLines = lines.filter((line) =>
            line.toLowerCase().includes(query)
          );
          if (matchingLines.length > 0) {
            results.push({ file: f, matches: matchingLines.slice(0, 10) });
          }
        } catch {
          // skip unreadable files
        }
      }

      return NextResponse.json({ results });
    } catch {
      return NextResponse.json({ results: [] });
    }
  }

  // File content mode
  if (file) {
    const fullPath = resolve(basePath, file);
    const normalized = normalize(fullPath);

    // Path traversal prevention
    if (!normalized.startsWith(basePath)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    try {
      const content = await readFile(normalized, "utf-8");
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  // List mode: return filenames
  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort();
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
