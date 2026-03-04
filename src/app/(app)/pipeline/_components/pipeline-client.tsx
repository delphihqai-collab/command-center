"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineKanban } from "./pipeline-kanban";
import { PipelineTableView } from "./pipeline-table-view";
import { BulkActionsBar } from "./bulk-actions-bar";
import { PipelineForecast } from "./pipeline-forecast";
import type { Lead } from "@/lib/types";

type LeadWithAgent = Lead & { agents?: { name: string } | null };

interface PipelineClientProps {
  leads: LeadWithAgent[];
}

export function PipelineClient({ leads }: PipelineClientProps) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showForecast, setShowForecast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pipeline-view");
    if (saved === "kanban" || saved === "table") setView(saved);
  }, []);

  const toggleView = useCallback((v: "table" | "kanban") => {
    setView(v);
    localStorage.setItem("pipeline-view", v);
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  return (
    <>
      {/* View toggle + forecast toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-zinc-800 bg-zinc-900">
          <button
            onClick={() => toggleView("table")}
            className={cn(
              "flex items-center gap-1 rounded-l-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "table"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-50"
            )}
          >
            <List className="h-3.5 w-3.5" /> Table
          </button>
          <button
            onClick={() => toggleView("kanban")}
            className={cn(
              "flex items-center gap-1 rounded-r-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "kanban"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-50"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
        <button
          onClick={() => setShowForecast((p) => !p)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            showForecast
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-50"
          )}
        >
          Forecast
        </button>
        <span className="text-sm text-zinc-400">{leads.length} leads</span>
      </div>

      <div className={cn("flex gap-4", showForecast && "items-start")}>
        <div className="min-w-0 flex-1">
          {view === "table" ? (
            <PipelineTableView
              leads={leads}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          ) : (
            <PipelineKanban leads={leads} />
          )}
        </div>
        {showForecast && (
          <div className="hidden w-72 shrink-0 lg:block">
            <PipelineForecast leads={leads} />
          </div>
        )}
      </div>

      <BulkActionsBar selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
    </>
  );
}
