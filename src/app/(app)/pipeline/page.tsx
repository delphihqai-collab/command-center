import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StageFilterTabs } from "./_components/stage-filter-tabs";
import { QuickAdvanceButton } from "./_components/quick-advance-button";
import { LeadDetailSheet } from "./_components/lead-detail-sheet";

interface Props {
  searchParams: Promise<{ stage?: string; sector?: string; qualified?: string }>;
}

async function PipelineTable({
  searchParams,
}: {
  searchParams: { stage?: string; sector?: string; qualified?: string };
}) {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*, agents!leads_assigned_agent_id_fkey(name)")
    .is("archived_at", null)
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (searchParams.stage) {
    const stages = searchParams.stage.split(",");
    query = query.in("stage", stages);
  }
  if (searchParams.sector) {
    query = query.eq("sector", searchParams.sector);
  }
  if (searchParams.qualified === "yes") {
    query = query.eq("qualified", true);
  } else if (searchParams.qualified === "no") {
    query = query.eq("qualified", false);
  }

  const { data: leads } = await query;

  const STALL_THRESHOLD = 5;

  return (
    <>
      <p className="text-sm text-zinc-400">
        {leads?.length ?? 0} leads
        {searchParams.stage
          ? ` in ${searchParams.stage.replace(/,/g, ", ")}`
          : ""}
      </p>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Company</TableHead>
              <TableHead className="text-zinc-400">Sector</TableHead>
              <TableHead className="text-zinc-400">Stage</TableHead>
              <TableHead className="text-zinc-400">Agent</TableHead>
              <TableHead className="text-zinc-400">Last Activity</TableHead>
              <TableHead className="text-zinc-400">Days</TableHead>
              <TableHead className="text-zinc-400">Advance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leads || leads.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center text-zinc-500">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const daysInStage = lead.last_activity_at
                  ? differenceInDays(
                      new Date(),
                      new Date(lead.last_activity_at)
                    )
                  : null;
                const isStalled =
                  daysInStage !== null && daysInStage > STALL_THRESHOLD;
                const isClosed =
                  lead.stage === "closed_won" ||
                  lead.stage === "closed_lost";

                return (
                  <TableRow
                    key={lead.id}
                    className={cn(
                      "border-zinc-800 hover:bg-zinc-800/50",
                      isStalled && !isClosed && "border-l-2 border-l-red-500"
                    )}
                  >
                    <TableCell>
                      <LeadDetailSheet
                        lead={{
                          ...lead,
                          agents: lead.agents as unknown as { name: string } | null,
                        }}
                      >
                        <button className="text-left font-medium text-zinc-50 hover:text-indigo-400">
                          {lead.company_name}
                        </button>
                      </LeadDetailSheet>
                      {lead.contact_name && (
                        <p className="text-xs text-zinc-500">
                          {lead.contact_name}
                          {lead.contact_role
                            ? ` · ${lead.contact_role}`
                            : ""}
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
                      {(
                        lead.agents as unknown as { name: string } | null
                      )?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {lead.last_activity_at
                        ? formatDistanceToNow(
                            new Date(lead.last_activity_at),
                            { addSuffix: true }
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-zinc-400",
                          isStalled && !isClosed && "text-red-400"
                        )}
                      >
                        {daysInStage !== null ? `${daysInStage}d` : "—"}
                      </span>
                      {isStalled && !isClosed && (
                        <AlertTriangle className="ml-1 inline h-3 w-3 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      {!isClosed && (
                        <QuickAdvanceButton
                          leadId={lead.id}
                          currentStage={lead.stage}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default async function PipelinePage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Pipeline</h1>
      </div>

      <Suspense>
        <StageFilterTabs />
      </Suspense>

      <Suspense
        fallback={<Skeleton className="h-96 w-full rounded-lg" />}
      >
        <PipelineTable searchParams={params} />
      </Suspense>
    </div>
  );
}
