import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export async function RecentLeads() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("pipeline_leads")
    .select(
      "id, company_name, stage, deal_value_eur, confidence, created_at, agents:assigned_agent_id(name)"
    )
    .not("stage", "in", '("won","lost","disqualified")')
    .order("created_at", { ascending: false })
    .limit(10);

  const items = leads ?? [];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-400">
          Recent Leads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RealtimeRefresh table="pipeline_leads" />
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No active leads yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((lead) => (
              <Link
                key={lead.id}
                href={`/pipeline/${lead.id}`}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-50">{lead.company_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={lead.stage} />
                    {lead.deal_value_eur && (
                      <span className="text-xs text-emerald-400">
                        {"\u20AC"}
                        {lead.deal_value_eur.toLocaleString("en-GB")}
                      </span>
                    )}
                    {lead.agents && (
                      <span className="text-xs text-zinc-500">
                        {
                          (lead.agents as unknown as { name: string })
                            ?.name
                        }
                      </span>
                    )}
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-500">
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
