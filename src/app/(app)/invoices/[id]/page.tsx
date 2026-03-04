import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { AlertTriangle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, clients!inner(company_name, contact_email)")
    .eq("id", id)
    .single();

  if (error || !invoice) notFound();

  const client = invoice.clients as unknown as {
    company_name: string;
    contact_email: string | null;
  };

  const now = new Date();
  const dueDate = new Date(invoice.due_date);
  const isOverdue = invoice.status !== "paid" && dueDate < now;
  const daysOverdue = isOverdue ? differenceInDays(now, dueDate) : 0;

  const fmt = (v: number) =>
    `€${v.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/invoices"
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← Invoices
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">
            {invoice.invoice_reference ?? `INV-${invoice.id.slice(0, 8)}`}
          </h1>
          <StatusBadge status={invoice.status} />
          {isOverdue && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {daysOverdue}d overdue
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-4 text-sm text-zinc-400">
          <Link
            href={`/clients/${invoice.client_id}`}
            className="hover:text-indigo-400"
          >
            {client.company_name}
          </Link>
          <span className="font-mono">{fmt(Number(invoice.amount))}</span>
          <span>Due {format(dueDate, "dd MMM yyyy")}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Details */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Amount</span>
              <span className="font-mono text-sm text-zinc-50">
                {fmt(Number(invoice.amount))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Due Date</span>
              <span className="text-sm text-zinc-50">
                {format(dueDate, "dd MMM yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Status</span>
              <StatusBadge status={invoice.status} />
            </div>
            {invoice.paid_at && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Paid At</span>
                <span className="text-sm text-emerald-400">
                  {format(new Date(invoice.paid_at), "dd MMM yyyy HH:mm")}
                </span>
              </div>
            )}
            {invoice.overdue_days !== null && invoice.overdue_days > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Overdue Days</span>
                <span className="text-sm text-red-400">
                  {invoice.overdue_days}d
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flagging & Risk */}
        <Card className={`border-zinc-800 bg-zinc-900 ${isOverdue ? "border-l-2 border-l-red-500" : ""}`}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Flagging & Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Flagged</span>
              <span className="text-sm text-zinc-50">
                {invoice.flagged ? "Yes" : "No"}
              </span>
            </div>
            {invoice.flag_level && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Flag Level</span>
                <StatusBadge status={invoice.flag_level} />
              </div>
            )}
            {invoice.flag_note && (
              <div>
                <span className="text-sm text-zinc-500">Flag Note</span>
                <p className="mt-1 rounded-md border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-300">
                  {invoice.flag_note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Company</span>
              <Link
                href={`/clients/${invoice.client_id}`}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                {client.company_name}
              </Link>
            </div>
            {client.contact_email && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Contact</span>
                <span className="text-sm text-zinc-50">
                  {client.contact_email}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Created</span>
              <span className="text-sm text-zinc-50">
                {format(new Date(invoice.created_at), "dd MMM yyyy HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Last Updated</span>
              <span className="text-sm text-zinc-50">
                {format(new Date(invoice.updated_at), "dd MMM yyyy HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">ID</span>
              <span className="font-mono text-xs text-zinc-500">
                {invoice.id}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
