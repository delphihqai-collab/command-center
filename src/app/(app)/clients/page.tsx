import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
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
import { HealthFilterTabs } from "./_components/health-filter-tabs";

interface Props {
  searchParams: Promise<{ health?: string; cursor?: string }>;
}

async function ClientsTable({
  health,
  cursor,
}: {
  health?: string;
  cursor?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*, agents!clients_assigned_am_id_fkey(name)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (health) {
    query = query.eq("health_status", health);
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.lt("created_at", decoded.sortValue);
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    return (
      <p className="text-sm text-red-400">
        Failed to load clients: {error.message}
      </p>
    );
  }

  const clients = rows ?? [];
  const hasMore = clients.length > PAGE_SIZE;
  const displayed = hasMore ? clients.slice(0, PAGE_SIZE) : clients;
  const nextCursor = hasMore
    ? encodeCursor(
        displayed[displayed.length - 1].id,
        displayed[displayed.length - 1].created_at
      )
    : null;

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Company</TableHead>
              <TableHead className="text-zinc-400">Sector</TableHead>
              <TableHead className="text-zinc-400">Health</TableHead>
              <TableHead className="text-zinc-400">Contract End</TableHead>
              <TableHead className="text-zinc-400">Monthly Value</TableHead>
              <TableHead className="text-zinc-400">AM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((client) => (
                <TableRow
                  key={client.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-zinc-50 hover:text-indigo-400"
                    >
                      {client.company_name}
                    </Link>
                    {client.contact_name && (
                      <p className="text-xs text-zinc-500">
                        {client.contact_name}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {client.sector ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.health_status} />
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {format(new Date(client.contract_end), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-400">
                    €{Number(client.monthly_value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {(client.agents as unknown as { name: string } | null)?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {nextCursor && <LoadMoreButton cursor={nextCursor} />}
    </>
  );
}

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Clients</h1>
        <p className="text-sm text-zinc-400">Active client portfolio</p>
      </div>

      <Suspense>
        <HealthFilterTabs />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <ClientsTable health={params.health} cursor={params.cursor} />
      </Suspense>
    </div>
  );
}
