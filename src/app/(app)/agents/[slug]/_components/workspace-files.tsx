"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
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
  Eye,
  Code,
} from "lucide-react";

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

interface Props {
  agentId: string;
}

export function WorkspaceFiles({ agentId }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, startSaving] = useTransition();
  const [mode, setMode] = useState<"preview" | "code">("preview");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agents/${agentId}/workspace`);
        if (!res.ok) return;
        const data = await res.json();
        const fileList = (data.files as string[]) ?? [];
        setFiles(fileList);
        if (fileList.length > 0) setActiveFile(fileList[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId]);

  const loadContent = useCallback(
    async (file: string) => {
      if (contents[file] !== undefined) return;
      try {
        const res = await fetch(
          `/api/agents/${agentId}/workspace?file=${encodeURIComponent(file)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setContents((prev) => ({ ...prev, [file]: data.content ?? "" }));
      } catch {
        // silent
      }
    },
    [agentId, contents]
  );

  useEffect(() => {
    if (activeFile) loadContent(activeFile);
  }, [activeFile, loadContent]);

  // Reset to preview when switching files
  useEffect(() => {
    setMode("preview");
  }, [activeFile]);

  function handleChange(file: string, value: string) {
    setContents((prev) => ({ ...prev, [file]: value }));
    setDirty((prev) => new Set(prev).add(file));
  }

  function handleSave(file: string) {
    startSaving(async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}/workspace`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, content: contents[file] ?? "" }),
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

  const activeMeta = activeFile ? FILE_META[activeFile] : null;
  const ActiveIcon = activeMeta?.icon ?? FileText;
  const activeLabel = activeMeta?.label ?? activeFile?.replace(".md", "") ?? "";
  const activeDescription =
    activeMeta?.description ?? "Workspace configuration file";
  const activeContent = activeFile ? contents[activeFile] ?? "" : "";
  const isActiveDirty = activeFile ? dirty.has(activeFile) : false;
  const lines = activeContent ? activeContent.split("\n").length : 0;

  return (
    <div className="space-y-3">
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
          {activeFile ? (
            <>
              {/* File header bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 shrink-0">
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
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Preview / Code toggle */}
                  <div className="flex rounded-md border border-zinc-700 overflow-hidden">
                    <button
                      onClick={() => setMode("preview")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
                        mode === "preview"
                          ? "bg-zinc-700 text-zinc-50"
                          : "text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => setMode("code")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border-l border-zinc-700 transition-colors ${
                        mode === "code"
                          ? "bg-zinc-700 text-zinc-50"
                          : "text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      <Code className="h-3.5 w-3.5" />
                      Code
                    </button>
                  </div>
                  <span className="text-xs text-zinc-600 tabular-nums">
                    {lines} lines
                  </span>
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

              {/* Content area */}
              {mode === "preview" ? (
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="prose prose-invert prose-zinc prose-sm max-w-none prose-headings:text-zinc-100 prose-headings:font-semibold prose-h1:text-xl prose-h1:border-b prose-h1:border-zinc-800 prose-h1:pb-2 prose-h2:text-lg prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-1.5 prose-h3:text-base prose-p:text-zinc-300 prose-p:leading-relaxed prose-strong:text-zinc-200 prose-code:text-indigo-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-li:text-zinc-300 prose-a:text-indigo-400 prose-hr:border-zinc-800 prose-table:text-zinc-300 prose-th:text-zinc-200 prose-td:border-zinc-800 prose-th:border-zinc-800">
                    {activeContent ? (
                      <ReactMarkdown>{activeContent}</ReactMarkdown>
                    ) : (
                      <p className="text-zinc-500 italic">Empty file</p>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  value={activeContent}
                  onChange={(e) => handleChange(activeFile, e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full resize-none bg-zinc-950/50 px-4 py-3 font-mono text-sm text-zinc-50 leading-relaxed placeholder:text-zinc-700 focus:outline-none border-0"
                  placeholder={`# ${activeFile}\n\nStart writing...`}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-zinc-500">Select a file to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
