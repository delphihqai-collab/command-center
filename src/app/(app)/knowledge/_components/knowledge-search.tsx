"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function KnowledgeSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.push(`/knowledge?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, router, searchParams]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search learnings..."
        className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-50 placeholder:text-zinc-500"
      />
    </div>
  );
}
