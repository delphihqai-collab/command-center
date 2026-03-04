import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Props {
  params: Promise<{ id: string }>;
}

const signalColors: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

function SignalDot({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-zinc-500">—</span>;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${signalColors[value] ?? "bg-zinc-500"}`} />
      <span className="text-xs text-zinc-400">{value}</span>
    </span>
  );
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [clientRes, healthRes, invoicesRes, reportsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*, agents!clients_assigned_am_id_fkey(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("client_health_history")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .order("due_date", { ascending: false }),
    supabase
      .from("agent_reports")
      .select("*, agents!inner(name)")
      .eq("related_entity_type", "client")
      .eq("related_entity_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!clientRes.data) notFound();
  const client = clientRes.data;
  const healthHistory = healthRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const latestHealth = healthHistory[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/clients"
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← Clients
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">
            {client.company_name}
          </h1>
          <StatusBadge status={client.health_status} />
        </div>
        <div className="mt-1 flex gap-4 text-sm text-zinc-400">
          {client.contact_email && <span>{client.contact_email}</span>}
          {client.sector && <span>{client.sector}</span>}
          <span>
            {format(new Date(client.contract_start), "dd MMM yyyy")} →{" "}
            {format(new Date(client.contract_end), "dd MMM yyyy")}
          </span>
          <span className="font-mono">
            €{Number(client.monthly_value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}/mo
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health Signals */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Health Signals (Latest)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!latestHealth ? (
              <p className="text-sm text-zinc-500">No health checks recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Product Activity</p>
                  <SignalDot value={latestHealth.product_activity_signal} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Invoice Status</p>
                  <SignalDot value={latestHealth.invoice_status_signal} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Communication</p>
                  <SignalDot value={latestHealth.communication_signal} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Sentiment</p>
                  <SignalDot value={latestHealth.sentiment_signal} />
                </div>
                {latestHealth.note && (
                  <div className="col-span-2">
                    <p className="text-xs text-zinc-500">Note</p>
                    <p className="mt-1 text-sm text-zinc-300">{latestHealth.note}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health History */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Health History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthHistory.length === 0 ? (
              <p className="text-sm text-zinc-500">No history.</p>
            ) : (
              <div className="space-y-2">
                {healthHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-2"
                  >
                    <StatusBadge status={h.health_status} />
                    <span className="text-xs text-zinc-500">
                      {format(new Date(h.created_at), "dd MMM yyyy HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-zinc-500">No invoices.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Reference</TableHead>
                  <TableHead className="text-zinc-400">Amount</TableHead>
                  <TableHead className="text-zinc-400">Due Date</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-zinc-800">
                    <TableCell className="font-mono text-zinc-50">
                      {inv.invoice_reference ?? inv.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-400">
                      €{Number(inv.amount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {format(new Date(inv.due_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {inv.overdue_days ? `${inv.overdue_days}d` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Agent Reports */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Agent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-zinc-500">No reports.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-50">
                        {(r.agents as unknown as { name: string })?.name}
                      </span>
                      <StatusBadge status={r.report_type} />
                      {r.flagged && <StatusBadge status={r.flag_level ?? "MEDIUM"} />}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {format(new Date(r.created_at), "dd MMM HH:mm")}
                    </span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-zinc-400">
                    {JSON.stringify(r.content, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
