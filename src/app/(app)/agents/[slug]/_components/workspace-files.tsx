"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sparkles,
  User,
  Bot,
  Wrench,
  HeartPulse,
  Rocket,
  Power,
  Brain,
  Shield,
  FileText,
  Loader2,
  Save,
  Info,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  ChevronsUpDown,
  FileCode,
} from "lucide-react";

// ── Types & markdown parsing ────────────────────────────────────

interface MdSection {
  id: string;
  heading: string;
  content: string;
}

interface ParsedFile {
  preamble: string;
  sections: MdSection[];
}

let _counter = 0;
function uid(): string {
  return `s${++_counter}${Math.random().toString(36).slice(2, 6)}`;
}

function parseMd(text: string): ParsedFile {
  const lines = text.split("\n");
  const sections: MdSection[] = [];
  let buf: string[] = [];
  let curHeading: string | null = null;
  let preambleBuf: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (curHeading !== null) {
        sections.push({
          id: uid(),
          heading: curHeading,
          content: buf.join("\n").trim(),
        });
      } else {
        preambleBuf = [...buf];
      }
      curHeading = line.slice(3);
      buf = [];
    } else {
      buf.push(line);
    }
  }

  if (curHeading !== null) {
    sections.push({
      id: uid(),
      heading: curHeading,
      content: buf.join("\n").trim(),
    });
  } else {
    preambleBuf = buf;
  }

  return { preamble: preambleBuf.join("\n").trimEnd(), sections };
}

function assembleMd(p: ParsedFile): string {
  const parts: string[] = [];
  if (p.preamble) parts.push(p.preamble);
  for (const s of p.sections) {
    let block = `## ${s.heading}`;
    if (s.content) block += "\n" + s.content;
    parts.push(block);
  }
  return parts.join("\n\n") + "\n";
}

// ── File metadata ───────────────────────────────────────────────

const FILE_META: Record<
  string,
  { label: string; icon: React.ElementType; description: string }
> = {
  "SOUL.md": {
    label: "Soul",
    icon: Sparkles,
    description: "Core personality, mission, principles",
  },
  "IDENTITY.md": {
    label: "Identity",
    icon: Bot,
    description: "Name, creature type, vibe, emoji, avatar",
  },
  "USER.md": {
    label: "User",
    icon: User,
    description: "Owner context, communication preferences",
  },
  "AGENTS.md": {
    label: "Agents",
    icon: Shield,
    description: "Delegation rules, security, approval protocol, pipeline",
  },
  "TOOLS.md": {
    label: "Tools",
    icon: Wrench,
    description: "Discord channels, machines, CRM, cron, gateway, skills",
  },
  "HEARTBEAT.md": {
    label: "Heartbeat",
    icon: HeartPulse,
    description: "Periodic check-in schedule, daily/weekly reviews",
  },
  "BOOTSTRAP.md": {
    label: "Bootstrap",
    icon: Rocket,
    description: "First-run initialization sequence",
  },
  "BOOT.md": {
    label: "Boot",
    icon: Power,
    description: "Regular session startup instructions",
  },
  "MEMORY.md": {
    label: "Memory",
    icon: Brain,
    description: "Curated long-term memory, playbook/runbook registries",
  },
  "SUBAGENT-POLICY.md": {
    label: "Subagent Policy",
    icon: Shield,
    description: "Delegation governance, concurrent limits, failure handling",
  },
};

// ── Component ───────────────────────────────────────────────────

interface Props {
  agentId: string;
}

export function WorkspaceFiles({ agentId }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Record<string, ParsedFile>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, startSaving] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const loadedRef = useRef(new Set<string>());

  // Load file list
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agents/${agentId}/workspace`);
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.files as string[]) ?? [];
        setFiles(list);
        if (list.length > 0) setActiveFile(list[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId]);

  // Load + parse file content when active file changes
  useEffect(() => {
    if (!activeFile || loadedRef.current.has(activeFile)) return;
    loadedRef.current.add(activeFile);
    fetch(
      `/api/agents/${agentId}/workspace?file=${encodeURIComponent(activeFile)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setParsed((prev) => ({
            ...prev,
            [activeFile]: parseMd((data.content as string) ?? ""),
          }));
        }
      })
      .catch(() => {});
  }, [activeFile, agentId]);

  // Reset expanded sections when switching files
  useEffect(() => {
    setExpanded(new Set());
  }, [activeFile]);

  // ── Mutations ─────────────────────────────────────────────────

  function markDirty(file: string) {
    setDirty((prev) => new Set(prev).add(file));
  }

  function updatePreamble(file: string, value: string) {
    setParsed((prev) => ({
      ...prev,
      [file]: { ...prev[file], preamble: value },
    }));
    markDirty(file);
  }

  function updateHeading(file: string, sectionId: string, heading: string) {
    setParsed((prev) => ({
      ...prev,
      [file]: {
        ...prev[file],
        sections: prev[file].sections.map((s) =>
          s.id === sectionId ? { ...s, heading } : s
        ),
      },
    }));
    markDirty(file);
  }

  function updateContent(file: string, sectionId: string, content: string) {
    setParsed((prev) => ({
      ...prev,
      [file]: {
        ...prev[file],
        sections: prev[file].sections.map((s) =>
          s.id === sectionId ? { ...s, content } : s
        ),
      },
    }));
    markDirty(file);
  }

  function addSection(file: string) {
    const s: MdSection = { id: uid(), heading: "New Section", content: "" };
    setParsed((prev) => ({
      ...prev,
      [file]: { ...prev[file], sections: [...prev[file].sections, s] },
    }));
    setExpanded((prev) => new Set(prev).add(s.id));
    markDirty(file);
  }

  function removeSection(file: string, sectionId: string) {
    setParsed((prev) => ({
      ...prev,
      [file]: {
        ...prev[file],
        sections: prev[file].sections.filter((s) => s.id !== sectionId),
      },
    }));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
    markDirty(file);
  }

  function toggleSection(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(file: string) {
    const fp = parsed[file];
    if (!fp) return;
    const ids = fp.sections.map((s) => s.id);
    const allOpen = ids.length > 0 && ids.every((id) => expanded.has(id));
    setExpanded((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOpen ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  // ── Save ──────────────────────────────────────────────────────

  function handleSave(file: string) {
    const fp = parsed[file];
    if (!fp) return;
    const content = assembleMd(fp);
    startSaving(async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}/workspace`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, content }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? "Failed to save");
          return;
        }
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(file);
          return next;
        });
        toast.success(`Saved ${file}`);
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-medium text-zinc-400">Workspace Files</h2>
        <p className="mt-2 text-sm text-zinc-500">
          No workspace files found. Check workspace path.
        </p>
      </div>
    );
  }

  const fp = activeFile ? parsed[activeFile] : null;
  const activeMeta = activeFile ? FILE_META[activeFile] : null;
  const ActiveIcon = activeMeta?.icon ?? FileText;
  const activeLabel =
    activeMeta?.label ?? activeFile?.replace(".md", "") ?? "";
  const activeDescription =
    activeMeta?.description ?? "Workspace configuration file";
  const isActiveDirty = activeFile ? dirty.has(activeFile) : false;
  const hasSections = fp && fp.sections.length > 0;
  const sectionCount = fp?.sections.length ?? 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">
          Workspace Files
          <span className="ml-1.5 text-zinc-600">({files.length})</span>
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <Info className="h-3 w-3" />
          <span>Changes take effect on next session</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden h-[650px]">
        {/* File list sidebar */}
        <nav className="w-52 shrink-0 border-r border-zinc-800 bg-zinc-950/50">
          <ul className="py-1.5">
            {files.map((file) => {
              const meta = FILE_META[file];
              const Icon = meta?.icon ?? FileText;
              const label = meta?.label ?? file.replace(".md", "");
              const isDirty = dirty.has(file);
              const isActive = file === activeFile;

              return (
                <li key={file}>
                  <button
                    onClick={() => setActiveFile(file)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-800/80 text-zinc-50"
                        : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500"}`}
                    />
                    <span className="truncate">{label}</span>
                    {isDirty && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {activeFile && fp ? (
            <>
              {/* File header bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ActiveIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-50">
                        {activeLabel}
                      </span>
                      <code className="text-xs text-zinc-600">
                        {activeFile}
                      </code>
                      {isActiveDirty && (
                        <span className="text-xs text-amber-500 font-medium">
                          unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {activeDescription}
                      {hasSections && (
                        <span className="text-zinc-600">
                          {" "}
                          · {sectionCount} sections
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasSections && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAll(activeFile)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 h-7 px-2"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
                      Toggle all
                    </Button>
                  )}
                  <Button
                    onClick={() => handleSave(activeFile)}
                    disabled={saving || !isActiveDirty}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                </div>
              </div>

              {/* Section editor / raw fallback */}
              <div className="flex-1 overflow-y-auto">
                {hasSections ? (
                  <>
                    {/* Preamble (file header) */}
                    {fp.preamble.trim() && (
                      <div className="border-b border-zinc-800/50">
                        <button
                          type="button"
                          onClick={() => toggleSection("__preamble__")}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800/30 ${
                            expanded.has("__preamble__")
                              ? "bg-zinc-800/20"
                              : ""
                          }`}
                        >
                          {expanded.has("__preamble__") ? (
                            <ChevronDown className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          )}
                          <FileCode className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span className="text-sm text-zinc-400">
                            File Header
                          </span>
                        </button>
                        {expanded.has("__preamble__") && (
                          <div className="px-4 pb-3 pl-10">
                            <textarea
                              value={fp.preamble}
                              onChange={(e) =>
                                updatePreamble(activeFile, e.target.value)
                              }
                              spellCheck={false}
                              rows={Math.min(
                                10,
                                Math.max(
                                  2,
                                  fp.preamble.split("\n").length + 1
                                )
                              )}
                              className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300 leading-relaxed resize-y focus:outline-none focus:border-zinc-700"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sections */}
                    {fp.sections.map((section) => {
                      const isOpen = expanded.has(section.id);
                      const lines = section.content
                        ? section.content.split("\n").length
                        : 0;
                      return (
                        <div
                          key={section.id}
                          className="border-b border-zinc-800/50"
                        >
                          {/* Collapsed row */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => toggleSection(section.id)}
                              className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800/30 ${
                                isOpen ? "bg-zinc-800/20" : ""
                              }`}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                              )}
                              <span
                                className={`text-sm ${isOpen ? "font-medium text-zinc-50" : "text-zinc-300"}`}
                              >
                                {section.heading}
                              </span>
                              <span className="ml-auto text-xs text-zinc-600 tabular-nums">
                                {lines} {lines === 1 ? "line" : "lines"}
                              </span>
                            </button>
                            {isOpen && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeSection(activeFile, section.id)
                                }
                                className="px-3 py-2.5 text-zinc-600 hover:text-red-400 transition-colors"
                                title="Delete section"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Expanded editor */}
                          {isOpen && (
                            <div className="px-4 pb-4 pl-10 space-y-3">
                              <div>
                                <label className="text-xs text-zinc-500 mb-1 block">
                                  Heading
                                </label>
                                <input
                                  type="text"
                                  value={section.heading}
                                  onChange={(e) =>
                                    updateHeading(
                                      activeFile,
                                      section.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-50 focus:outline-none focus:border-zinc-700"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-zinc-500 mb-1 block">
                                  Content
                                </label>
                                <textarea
                                  value={section.content}
                                  onChange={(e) =>
                                    updateContent(
                                      activeFile,
                                      section.id,
                                      e.target.value
                                    )
                                  }
                                  spellCheck={false}
                                  rows={Math.min(
                                    30,
                                    Math.max(
                                      3,
                                      section.content.split("\n").length + 1
                                    )
                                  )}
                                  className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300 leading-relaxed resize-y focus:outline-none focus:border-zinc-700"
                                  style={{ maxHeight: "500px" }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add section */}
                    <div className="p-3 pl-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addSection(activeFile)}
                        className="text-xs text-zinc-500 hover:text-zinc-300 h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Section
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Raw textarea fallback for files without ## sections */
                  <textarea
                    value={fp.preamble}
                    onChange={(e) => updatePreamble(activeFile, e.target.value)}
                    spellCheck={false}
                    className="w-full h-full resize-none bg-zinc-950/50 px-4 py-3 font-mono text-sm text-zinc-50 leading-relaxed placeholder:text-zinc-700 focus:outline-none border-0"
                    placeholder={`# ${activeFile}\n\nLoading...`}
                  />
                )}
              </div>
            </>
          ) : !activeFile ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-zinc-500">Select a file to edit</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
