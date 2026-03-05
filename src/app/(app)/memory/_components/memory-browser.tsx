"use client";

import { useState, useEffect, useCallback } from "react";
import { MEMORY_PATHS } from "@/lib/memory-paths";
import {
  Search,
  FileText,
  Eye,
  Code,
  Loader2,
  Crown,
  Megaphone,
  Handshake,
  UserCheck,
  Calculator,
  Scale,
  BarChart3,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const AGENT_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  hermes: { label: "Hermes", icon: Crown },
  sdr: { label: "SDR", icon: Megaphone },
  "account-executive": { label: "Account Executive", icon: Handshake },
  "account-manager": { label: "Account Manager", icon: UserCheck },
  finance: { label: "Finance", icon: Calculator },
  legal: { label: "Legal", icon: Scale },
  "market-intelligence": { label: "Market Intel", icon: BarChart3 },
  "knowledge-curator": { label: "Knowledge Curator", icon: BookOpen },
};

const agents = Object.keys(MEMORY_PATHS);

export function MemoryBrowser() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { file: string; matches: string[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"preview" | "code">("preview");

  const fetchFiles = useCallback(async (agent: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory?agent=${encodeURIComponent(agent)}`);
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContent = useCallback(
    async (file: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/memory?agent=${encodeURIComponent(selectedAgent)}&file=${encodeURIComponent(file)}`
        );
        const data = await res.json();
        setContent(data.content ?? null);
      } catch {
        setContent(null);
      } finally {
        setLoading(false);
      }
    },
    [selectedAgent]
  );

  const doSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/memory?agent=${encodeURIComponent(selectedAgent)}&search=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, searchQuery]);

  useEffect(() => {
    setSelectedFile(null);
    setContent(null);
    setSearchResults([]);
    setSearchQuery("");
    fetchFiles(selectedAgent);
  }, [selectedAgent, fetchFiles]);

  // Reset to preview when switching files
  useEffect(() => {
    setMode("preview");
  }, [selectedFile]);

  const lines = content ? content.split("\n").length : 0;
  const isMarkdown = selectedFile?.endsWith(".md") ?? false;

  return (
    <div className="space-y-3">
      {/* Agent selector tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {agents.map((agent) => {
          const meta = AGENT_META[agent];
          const Icon = meta?.icon ?? FileText;
          const label = meta?.label ?? agent;
          const isActive = agent === selectedAgent;

          return (
            <button
              key={agent}
              onClick={() => setSelectedAgent(agent)}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`}
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search across files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch();
            }}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
        </div>
        <button
          onClick={doSearch}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-2 rounded-lg border border-indigo-800/50 bg-indigo-950/20 p-4">
          <h3 className="text-sm font-medium text-indigo-400">
            Search Results ({searchResults.length} files)
          </h3>
          {searchResults.map((r) => (
            <div key={r.file} className="space-y-1">
              <button
                onClick={() => {
                  setSelectedFile(r.file);
                  fetchContent(r.file);
                  setSearchResults([]);
                }}
                className="text-sm font-medium text-indigo-300 hover:underline"
              >
                {r.file}
              </button>
              {r.matches.map((m, i) => (
                <p
                  key={i}
                  className="truncate pl-4 font-mono text-xs text-zinc-500"
                >
                  {m}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Split panel: file sidebar + content viewer */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden h-[650px]">
        {/* File sidebar */}
        <nav className="w-52 shrink-0 border-r border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-500 border-b border-zinc-800">
            <FileText className="h-3.5 w-3.5" />
            {loading && files.length === 0 ? "Loading…" : `${files.length} files`}
          </div>
          <ul className="py-1.5 overflow-y-auto" style={{ maxHeight: "calc(650px - 37px)" }}>
            {!loading && files.length === 0 && (
              <li className="px-3 py-2 text-xs text-zinc-600">
                No memory files found
              </li>
            )}
            {files.map((f) => {
              const isActive = f === selectedFile;

              return (
                <li key={f}>
                  <button
                    onClick={() => {
                      setSelectedFile(f);
                      fetchContent(f);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-800/80 text-zinc-50"
                        : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300"
                    }`}
                  >
                    <FileText
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500"}`}
                    />
                    <span className="truncate">{f}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedFile && content != null ? (
            <>
              {/* File header bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-50">
                        {selectedFile}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {AGENT_META[selectedAgent]?.label ?? selectedAgent}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Preview / Code toggle */}
                  {isMarkdown && (
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
                  )}
                  <span className="text-xs text-zinc-600 tabular-nums">
                    {lines} lines
                  </span>
                </div>
              </div>

              {/* Content area */}
              {isMarkdown && mode === "preview" ? (
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="prose prose-invert prose-zinc prose-sm max-w-none prose-headings:text-zinc-100 prose-headings:font-semibold prose-h1:text-xl prose-h1:border-b prose-h1:border-zinc-800 prose-h1:pb-2 prose-h2:text-lg prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-1.5 prose-h3:text-base prose-p:text-zinc-300 prose-p:leading-relaxed prose-strong:text-zinc-200 prose-code:text-indigo-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-li:text-zinc-300 prose-a:text-indigo-400 prose-hr:border-zinc-800 prose-table:text-zinc-300 prose-th:text-zinc-200 prose-td:border-zinc-800 prose-th:border-zinc-800">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <pre className="px-4 py-3 font-mono text-sm text-zinc-50 leading-relaxed whitespace-pre-wrap">
                    {content}
                  </pre>
                </div>
              )}
            </>
          ) : selectedFile && content == null && loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-zinc-500">
                Select a file to view its contents
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
