"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CostExportButton() {
  async function handleExport() {
    const supabase = createClient();
    const { data } = await supabase
      .from("agent_token_usage")
      .select("*, agents!agent_token_usage_agent_id_fkey(name, slug)")
      .order("recorded_at", { ascending: false });

    if (!data || data.length === 0) return;

    const header = "agent,model,input_tokens,output_tokens,cost_usd,session_key,task_description,recorded_at";
    const rows = data.map((r) => {
      const agentName = (r.agents as unknown as { name: string } | null)?.name ?? "";
      return [
        agentName,
        r.model,
        r.input_tokens,
        r.output_tokens,
        r.cost_usd,
        r.session_key ?? "",
        (r.task_description ?? "").replace(/,/g, ";"),
        r.recorded_at,
      ].join(",");
    });

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
      className="gap-1 border-zinc-700 text-xs"
    >
      <Download className="h-3 w-3" />
      Export CSV
    </Button>
  );
}
