import { Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { LoadMoreButton } from "@/components/load-more-button";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/pagination";

interface Props {
  searchParams: Promise<{ status?: string; flag_level?: string; cursor?: string }>;
}

async function InvoiceSummary() {
  const supabase = await createClient();
  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("amount, status, due_date, paid_at");

  const invoices = allInvoices ?? [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);

  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const overdueTotal = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const dueIn30 = invoices
    .filter(
      (i) =>
        i.status !== "paid" &&
        new Date(i.due_date) <= thirtyDaysFromNow &&
        new Date(i.due_date) >= now
    )
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const receivedThisMonth = invoices
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
  );
}

async function InvoiceTable({
  status,
  flagLevel,
  cursor,
}: {
  status?: string;
  flagLevel?: string;
  cursor?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("*, clients!inner(company_name)")
    .order("due_date", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (status) query = query.eq("status", status);
  if (flagLevel) query = query.eq("flag_level", flagLevel);

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.lt("due_date", decoded.sortValue);
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    return (
      <p className="text-sm text-red-400">
        Failed to load invoices: {error.message}
      </p>
    );
  }

  const invoices = rows ?? [];
  const hasMore = invoices.length > PAGE_SIZE;
  const displayed = hasMore ? invoices.slice(0, PAGE_SIZE) : invoices;
  const nextCursor = hasMore
    ? encodeCursor(
        displayed[displayed.length - 1].id,
        displayed[displayed.length - 1].due_date
      )
    : null;

  const fmt = (v: number) =>
    `€${v.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;

  return (
    <>
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
            {displayed.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center text-zinc-500">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((inv) => {
                const isOverdue =
                  inv.status === "overdue" ||
                  (inv.status !== "paid" && new Date(inv.due_date) < new Date());
                return (
                  <TableRow
                    key={inv.id}
                    className={`border-zinc-800 hover:bg-zinc-800/50 ${isOverdue ? "border-l-2 border-l-red-500" : ""}`}
                  >
                    <TableCell>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-zinc-50 hover:text-indigo-400"
                      >
                        {(inv.clients as unknown as { company_name: string }).company_name}
                      </Link>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {nextCursor && <LoadMoreButton cursor={nextCursor} />}
    </>
  );
}

export default async function InvoicesPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Invoices</h1>
        <p className="text-sm text-zinc-400">Invoice tracking & payments</p>
      </div>

      <Suspense fallback={<Skeleton className="h-20 w-full rounded-lg" />}>
        <InvoiceSummary />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <InvoiceTable
          status={params.status}
          flagLevel={params.flag_level}
          cursor={params.cursor}
        />
      </Suspense>
    </div>
  );
}
