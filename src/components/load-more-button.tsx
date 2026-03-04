"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function LoadMoreButton({ cursor }: { cursor: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleLoadMore() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cursor", cursor);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex justify-center pt-4">
      <Button
        variant="outline"
        onClick={handleLoadMore}
        className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
      >
        <ChevronDown className="h-4 w-4" />
        Load More
      </Button>
    </div>
  );
}
