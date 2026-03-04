"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Users, Target } from "lucide-react";
import useSWR from "swr";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResults {
  results: {
    leads: { id: string; company_name: string; sector: string | null; stage: string }[];
    clients: { id: string; company_name: string; sector: string | null }[];
    proposals: { id: string; scope_summary: string | null; status: string }[];
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
    ((results.leads?.length ?? 0) > 0 ||
      (results.clients?.length ?? 0) > 0 ||
      (results.proposals?.length ?? 0) > 0);

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
            placeholder="Search leads, clients, proposals..."
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
                  Leads
                </p>
                {results.leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigate(`/pipeline?stage=${lead.stage}`)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{lead.company_name}</span>
                    {lead.sector && (
                      <span className="text-xs text-zinc-500">
                        {lead.sector}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {results?.clients && results.clients.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-xs font-medium text-zinc-500">
                  Clients
                </p>
                {results.clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <Users className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{client.company_name}</span>
                  </button>
                ))}
              </div>
            )}

            {results?.proposals && results.proposals.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-zinc-500">
                  Proposals
                </p>
                {results.proposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    onClick={() => navigate("/proposals")}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-400" />
                    <span className="truncate">
                      {proposal.scope_summary ?? `Proposal (${proposal.status})`}
                    </span>
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
