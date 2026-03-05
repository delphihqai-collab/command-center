"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportRow {
  agent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  source: string;
  timestamp: string;
}

export function CostExportButton({ data }: { data: ExportRow[] }) {
  function handleExport() {
    if (data.length === 0) return;

    const header = "agent,model,input_tokens,output_tokens,cost_usd,source,timestamp";
    const rows = data.map((r) =>
      [
        r.agent,
        r.model,
        r.inputTokens,
        r.outputTokens,
        r.cost.toFixed(6),
        r.source,
        r.timestamp,
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={data.length === 0}
      className="gap-1 border-zinc-700 text-xs"
    >
      <Download className="h-3 w-3" />
      Export CSV
    </Button>
  );
}
