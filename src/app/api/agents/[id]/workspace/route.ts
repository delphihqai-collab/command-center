import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readdir, readFile, writeFile } from "fs/promises";
import { resolve, normalize, basename } from "path";

const ALLOWED_FILES = new Set([
  "SOUL.md",
  "IDENTITY.md",
  "USER.md",
  "AGENTS.md",
  "TOOLS.md",
  "HEARTBEAT.md",
  "BOOTSTRAP.md",
  "BOOT.md",
  "MEMORY.md",
  "SUBAGENT-POLICY.md",
]);

async function getWorkspacePath(agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, path: null };

  const { data: agent } = await supabase
    .from("agents")
    .select("workspace_path")
    .eq("id", agentId)
    .single();

  if (!agent?.workspace_path)
    return { error: "Agent not found" as const, path: null };

  return { error: null, path: agent.workspace_path };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, path: workspacePath } = await getWorkspacePath(id);
  if (error) {
    const status = error === "Unauthorized" ? 401 : 404;
    return NextResponse.json({ error }, { status });
  }

  const file = request.nextUrl.searchParams.get("file");

  // Single file mode
  if (file) {
    if (!ALLOWED_FILES.has(file)) {
      return NextResponse.json({ error: "File not allowed" }, { status: 400 });
    }

    const fullPath = resolve(workspacePath, file);
    const normalized = normalize(fullPath);
    if (!normalized.startsWith(normalize(workspacePath))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
      const content = await readFile(normalized, "utf-8");
      return NextResponse.json({ file, content });
    } catch {
      return NextResponse.json({ file, content: "" });
    }
  }

  // List mode — return all .md files in workspace root
  try {
    const entries = await readdir(workspacePath, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && ALLOWED_FILES.has(e.name))
      .map((e) => e.name)
      .sort();
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, path: workspacePath } = await getWorkspacePath(id);
  if (error) {
    const status = error === "Unauthorized" ? 401 : 404;
    return NextResponse.json({ error }, { status });
  }

  const body = await request.json();
  const file = body.file as string | undefined;
  const content = body.content as string | undefined;

  if (!file || typeof content !== "string") {
    return NextResponse.json(
      { error: "file and content required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: "File not allowed" }, { status: 400 });
  }

  const fullPath = resolve(workspacePath, file);
  const normalized = normalize(fullPath);
  if (!normalized.startsWith(normalize(workspacePath))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Verify the filename matches what we expect (extra safety)
  if (basename(normalized) !== file) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    await writeFile(normalized, content, "utf-8");

    // If it's SOUL.md, also sync to Supabase agent_souls table
    if (file === "SOUL.md") {
      const supabase = await createClient();
      await supabase
        .from("agent_souls")
        .upsert(
          {
            agent_id: id,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "agent_id" }
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to write file" },
      { status: 500 }
    );
  }
}
