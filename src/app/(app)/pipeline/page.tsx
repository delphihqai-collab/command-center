import { createClient } from "@/lib/supabase/server";
import { ACTIVE_PIPELINE_STAGES, PIPELINE_STAGE_LABELS, TERMINAL_STAGES } from "@/lib/types";
import type { PipelineStage } from "@/lib/types";
import { PipelineBoard } from "./_components/pipeline-board";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [leadsRes, agentsRes] = await Promise.all([
    supabase
      .from("pipeline_leads")
      .select("*, assigned_agent:assigned_agent_id(id, name, slug)")
      .order("updated_at", { ascending: false }),
    supabase.from("agents").select("id, name, slug").order("name"),
  ]);

  const leads = leadsRes.data ?? [];
  const agents = agentsRes.data ?? [];

  const closedLeads = leads.filter((l) =>
    TERMINAL_STAGES.includes(l.stage as PipelineStage)
  );

  const columns = Object.fromEntries(
    ACTIVE_PIPELINE_STAGES.map((stage) => [
      stage,
      leads.filter((l) => l.stage === stage),
    ])
  );

  const totalValue = leads
    .filter((l) => !TERMINAL_STAGES.includes(l.stage as PipelineStage))
    .reduce((sum, l) => sum + (l.deal_value_eur ? Number(l.deal_value_eur) : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Pipeline</h1>
          <p className="text-sm text-zinc-400">
            {leads.length} leads · €{totalValue.toLocaleString("en")} pipeline value
            {closedLeads.length > 0 && ` · ${closedLeads.length} closed`}
          </p>
        </div>
      </div>
      <PipelineBoard
        columns={columns}
        stageLabels={PIPELINE_STAGE_LABELS}
        agents={agents}
      />

      {/* Terminal stage summary */}
      {closedLeads.length > 0 && (
        <div className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          {(["meeting_completed", "proposal_sent", "won", "lost", "disqualified"] as const).map((stage) => {
            const count = leads.filter((l) => l.stage === stage).length;
            if (count === 0) return null;
            return (
              <div key={stage} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{PIPELINE_STAGE_LABELS[stage]}:</span>
                <span className="text-xs font-medium text-zinc-300">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <RealtimeRefresh table="pipeline_leads" />
    </div>
  );
}
