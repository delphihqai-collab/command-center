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
import Link from "next/link";
import { format } from "date-fns";

interface Props {
  searchParams: Promise<{ health?: string; sector?: string; onboarding?: string }>;
}

export default async function ClientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*, agents!clients_assigned_am_id_fkey(name)")
    .is("archived_at", null)
    .order("health_status", { ascending: true })
    .order("contract_end", { ascending: true });

  if (params.health) {
    query = query.eq("health_status", params.health);
  }
  if (params.sector) {
    query = query.eq("sector", params.sector);
  }
  if (params.onboarding === "yes") {
    query = query.eq("onboarding_complete", true);
  } else if (params.onboarding === "no") {
    query = query.eq("onboarding_complete", false);
  }

  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Clients</h1>
        <p className="text-sm text-zinc-400">
          {clients?.length ?? 0} active clients
        </p>
      </div>

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
            {!clients || clients.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
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
    </div>
  );
}
