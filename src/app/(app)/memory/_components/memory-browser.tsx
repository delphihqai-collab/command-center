"use client";

import { useState, useEffect, useCallback } from "react";
import { MEMORY_PATHS } from "@/lib/memory-paths";
import { Search, FileText, FolderOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

  return (
    <div className="space-y-4">
      {/* Agent selector + search */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-50"
        >
          {agents.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <div className="flex flex-1 gap-2">
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
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500"
            />
          </div>
          <button
            onClick={doSearch}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Search
          </button>
        </div>
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

      {/* File list + viewer */}
      <div className="grid grid-cols-[240px_1fr] gap-4">
        {/* File list */}
        <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div className="flex items-center gap-2 pb-2 text-xs font-medium text-zinc-400">
            <FolderOpen className="h-3.5 w-3.5" />
            {files.length} files
          </div>
          {loading && files.length === 0 && (
            <p className="text-xs text-zinc-600">Loading...</p>
          )}
          {!loading && files.length === 0 && (
            <p className="text-xs text-zinc-600">No memory files found</p>
          )}
          {files.map((f) => (
            <button
              key={f}
              onClick={() => {
                setSelectedFile(f);
                fetchContent(f);
              }}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                selectedFile === f
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{f}</span>
            </button>
          ))}
        </div>

        {/* Content viewer */}
        <div className="min-h-[400px] rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          {selectedFile && content != null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="font-mono text-sm text-zinc-300">
                  {selectedFile}
                </h3>
                <span className="text-xs text-zinc-600">
                  {selectedAgent}
                </span>
              </div>
              {selectedFile.endsWith(".md") ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-300">
                  {content}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
