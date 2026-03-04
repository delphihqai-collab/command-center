import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { StageAdvanceButton } from "./_components/stage-advance-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [leadRes, historyRes, proposalsRes, logsRes] = await Promise.all([
    supabase
      .from("leads")
      .select("*, agents!leads_assigned_agent_id_fkey(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("lead_stage_history")
      .select("*, agents!lead_stage_history_changed_by_agent_id_fkey(name)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("proposals")
      .select("*")
      .eq("lead_id", id)
      .order("version", { ascending: false }),
    supabase
      .from("agent_logs")
      .select("*, agents!agent_logs_agent_id_fkey(name)")
      .eq("related_entity_type", "lead")
      .eq("related_entity_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!leadRes.data) notFound();
  const lead = leadRes.data;
  const history = historyRes.data ?? [];
  const proposals = proposalsRes.data ?? [];
  const logs = logsRes.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/pipeline"
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← Pipeline
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">
            {lead.company_name}
          </h1>
          <StatusBadge status={lead.stage} />
          <StageAdvanceButton leadId={lead.id} currentStage={lead.stage} />
        </div>
        <div className="mt-1 flex gap-4 text-sm text-zinc-400">
          {lead.contact_name && <span>{lead.contact_name}</span>}
          {lead.contact_role && <span>{lead.contact_role}</span>}
          {lead.sector && <span>{lead.sector}</span>}
          <span>{lead.country}</span>
          {(lead.agents as unknown as { name: string } | null)?.name && (
            <span>
              Assigned: {(lead.agents as unknown as { name: string }).name}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stage History */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Stage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500">No stage changes recorded.</p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 border-l-2 border-zinc-700 pl-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {entry.from_stage && (
                          <>
                            <StatusBadge status={entry.from_stage} />
                            <span className="text-zinc-500">→</span>
                          </>
                        )}
                        <StatusBadge status={entry.to_stage} />
                      </div>
                      {entry.note && (
                        <p className="mt-1 text-xs text-zinc-400">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      <div>
                        {format(new Date(entry.created_at), "dd MMM yyyy HH:mm")}
                      </div>
                      {(entry.agents as unknown as { name: string } | null)?.name && (
                        <div>{(entry.agents as unknown as { name: string }).name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SDR Brief / MEDDIC */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Qualification & Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-medium uppercase text-zinc-500">
                SDR Brief
              </h4>
              {lead.sdr_brief ? (
                <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-950 p-2 font-mono text-xs text-zinc-300">
                  {JSON.stringify(lead.sdr_brief, null, 2)}
                </pre>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">Not yet completed.</p>
              )}
            </div>
            <Separator className="bg-zinc-800" />
            <div>
              <h4 className="text-xs font-medium uppercase text-zinc-500">
                MEDDIC
              </h4>
              {lead.meddic ? (
                <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-950 p-2 font-mono text-xs text-zinc-300">
                  {JSON.stringify(lead.meddic, null, 2)}
                </pre>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">Not yet completed.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <p className="text-sm text-zinc-500">No proposals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Version</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Value</TableHead>
                  <TableHead className="text-zinc-400">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id} className="border-zinc-800">
                    <TableCell className="text-zinc-50">
                      <Link
                        href={`/proposals/${p.id}`}
                        className="hover:text-indigo-400"
                      >
                        v{p.version}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {p.value
                        ? `€${Number(p.value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {p.outcome ? (
                        <StatusBadge status={p.outcome} />
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity logged.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-950 p-2"
                >
                  <div className="flex-1">
                    <p className="text-sm text-zinc-50">{log.action}</p>
                    {log.detail && (
                      <p className="text-xs text-zinc-400">{log.detail}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <div>
                      {format(new Date(log.created_at), "dd MMM HH:mm")}
                    </div>
                    {(log.agents as unknown as { name: string } | null)?.name && (
                      <div>{(log.agents as unknown as { name: string }).name}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
