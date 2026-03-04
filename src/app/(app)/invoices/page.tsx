import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Props {
  searchParams: Promise<{ status?: string; flag_level?: string }>;
}

export default async function InvoicesPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  // Summary queries
  const [allInvRes, queryRes] = await Promise.all([
    supabase.from("invoices").select("amount, status, due_date, paid_at"),
    (() => {
      let q = supabase
        .from("invoices")
        .select("*, clients!inner(company_name)")
        .order("overdue_days", { ascending: false, nullsFirst: false });
      if (params.status) q = q.eq("status", params.status);
      if (params.flag_level) q = q.eq("flag_level", params.flag_level);
      return q;
    })(),
  ]);

  const allInvoices = allInvRes.data ?? [];
  const invoices = queryRes.data ?? [];

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);

  const totalOutstanding = allInvoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const overdueTotal = allInvoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const dueIn30 = allInvoices
    .filter(
      (i) =>
        i.status !== "paid" &&
        new Date(i.due_date) <= thirtyDaysFromNow &&
        new Date(i.due_date) >= now
    )
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const receivedThisMonth = allInvoices
    .filter(
      (i) =>
        i.paid_at &&
        new Date(i.paid_at).getMonth() === now.getMonth() &&
        new Date(i.paid_at).getFullYear() === now.getFullYear()
    )
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const fmt = (v: number) =>
    `€${v.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Invoices</h1>
        <p className="text-sm text-zinc-400">
          {invoices.length} invoices
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Outstanding", value: fmt(totalOutstanding), color: "text-zinc-50" },
          { label: "Overdue", value: fmt(overdueTotal), color: "text-red-400" },
          { label: "Due in 30 Days", value: fmt(dueIn30), color: "text-amber-400" },
          { label: "Received This Month", value: fmt(receivedThisMonth), color: "text-emerald-400" },
        ].map((item) => (
          <Card key={item.label} className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">{item.label}</p>
              <p className={`mt-1 font-mono text-lg font-semibold ${item.color}`}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Client</TableHead>
              <TableHead className="text-zinc-400">Reference</TableHead>
              <TableHead className="text-zinc-400">Amount</TableHead>
              <TableHead className="text-zinc-400">Due Date</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Overdue</TableHead>
              <TableHead className="text-zinc-400">Flag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center text-zinc-500">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell className="text-zinc-50">
                    {(inv.clients as unknown as { company_name: string }).company_name}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-400">
                    {inv.invoice_reference ?? inv.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-400">
                    {fmt(Number(inv.amount))}
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
                  <TableCell>
                    {inv.flag_level ? (
                      <StatusBadge status={inv.flag_level} />
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
