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
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface Props {
  searchParams: Promise<{ stage?: string; sector?: string; qualified?: string }>;
}

export default async function PipelinePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*, agents!leads_assigned_agent_id_fkey(name)")
    .is("archived_at", null)
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (params.stage) {
    const stages = params.stage.split(",");
    query = query.in("stage", stages);
  }
  if (params.sector) {
    query = query.eq("sector", params.sector);
  }
  if (params.qualified === "yes") {
    query = query.eq("qualified", true);
  } else if (params.qualified === "no") {
    query = query.eq("qualified", false);
  }

  const { data: leads } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Pipeline</h1>
        <p className="text-sm text-zinc-400">
          {leads?.length ?? 0} leads
          {params.stage ? ` in ${params.stage.replace(/,/g, ", ")}` : ""}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Company</TableHead>
              <TableHead className="text-zinc-400">Sector</TableHead>
              <TableHead className="text-zinc-400">Stage</TableHead>
              <TableHead className="text-zinc-400">Agent</TableHead>
              <TableHead className="text-zinc-400">Last Activity</TableHead>
              <TableHead className="text-zinc-400">Days in Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leads || leads.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center text-zinc-500">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <Link
                      href={`/pipeline/${lead.id}`}
                      className="font-medium text-zinc-50 hover:text-indigo-400"
                    >
                      {lead.company_name}
                    </Link>
                    {lead.contact_name && (
                      <p className="text-xs text-zinc-500">
                        {lead.contact_name}
                        {lead.contact_role ? ` · ${lead.contact_role}` : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {lead.sector ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.stage} />
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {(lead.agents as unknown as { name: string } | null)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {lead.last_activity_at
                      ? formatDistanceToNow(new Date(lead.last_activity_at), {
                          addSuffix: true,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {lead.last_activity_at
                      ? `${differenceInDays(new Date(), new Date(lead.last_activity_at))}d`
                      : "—"}
                    {lead.stall_flagged && (
                      <span className="ml-2 text-xs text-red-400">stalled</span>
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
