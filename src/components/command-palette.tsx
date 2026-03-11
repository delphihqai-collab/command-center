"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Bot, GitBranchPlus } from "lucide-react";
import useSWR from "swr";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResults {
  results: {
    agents: { id: string; slug: string; name: string; status: string }[];
    leads: { id: string; company_name: string; stage: string }[];
  };
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const { data } = useSWR<SearchResults>(
    query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    router.push(path);
  }

  const results = data?.results;
  const hasResults =
    results &&
    ((results.agents?.length ?? 0) > 0 ||
      (results.leads?.length ?? 0) > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900 p-0">
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center border-b border-zinc-800 px-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents, leads..."
            className="border-0 bg-transparent text-sm text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-0"
            autoFocus
          />
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            ESC
          </kbd>
        </div>

        {query.length >= 2 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {!hasResults && (
              <p className="p-4 text-center text-sm text-zinc-500">
                No results found.
              </p>
            )}

            {results?.leads && results.leads.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-zinc-500">
                  Pipeline Leads
                </p>
                {results.leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigate(`/pipeline/${lead.id}`)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <GitBranchPlus className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="truncate">{lead.company_name}</span>
                    <span className="ml-auto text-xs text-zinc-500">{lead.stage}</span>
                  </button>
                ))}
              </div>
            )}

            {results?.agents && results.agents.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-zinc-500">
                  Agents
                </p>
                {results.agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.slug}`)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <Bot className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{agent.name}</span>
                    <span className="ml-auto text-xs text-zinc-500">{agent.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
