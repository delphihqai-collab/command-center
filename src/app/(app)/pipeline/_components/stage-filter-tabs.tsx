"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES } from "@/lib/types";

export function StageFilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStage = searchParams.get("stage") ?? "all";

  function setStage(stage: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (stage === "all") {
      params.delete("stage");
    } else {
      params.set("stage", stage);
    }
    router.push(`/pipeline?${params.toString()}`);
  }

  const tabs = [
    { value: "all", label: "All" },
    ...PIPELINE_STAGES.filter(
      (s) => s !== "closed_won" && s !== "closed_lost"
    ).map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
    { value: "closed_won", label: "Won" },
    { value: "closed_lost", label: "Lost" },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setStage(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            currentStage === tab.value
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
