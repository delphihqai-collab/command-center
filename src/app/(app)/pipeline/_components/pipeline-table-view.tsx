"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { QuickAdvanceButton } from "./quick-advance-button";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLeadScore, getScoreColor, getScoreBgColor } from "@/lib/lead-scoring";
import type { Lead } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

type LeadWithAgent = Lead & { agents?: { name: string } | null };

interface PipelineTableViewProps {
  leads: LeadWithAgent[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

const STALL_THRESHOLD = 5;

export function PipelineTableView({ leads, selectedIds, onToggleSelect }: PipelineTableViewProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-10 text-zinc-400">
              <span className="sr-only">Select</span>
            </TableHead>
            <TableHead className="text-zinc-400">Company</TableHead>
            <TableHead className="text-zinc-400">Score</TableHead>
            <TableHead className="text-zinc-400">Stage</TableHead>
            <TableHead className="text-zinc-400">Agent</TableHead>
            <TableHead className="text-zinc-400">Last Activity</TableHead>
            <TableHead className="text-zinc-400">Days</TableHead>
            <TableHead className="text-zinc-400">Advance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow className="border-zinc-800">
              <TableCell colSpan={8} className="text-center text-zinc-500">
                No leads found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const daysInStage = lead.last_activity_at
                ? differenceInDays(new Date(), new Date(lead.last_activity_at))
                : null;
              const isStalled = daysInStage !== null && daysInStage > STALL_THRESHOLD;
              const isClosed = lead.stage === "closed_won" || lead.stage === "closed_lost";
              const score = calculateLeadScore(lead);

              return (
                <TableRow
                  key={lead.id}
                  className={cn(
                    "border-zinc-800 hover:bg-zinc-800/50",
                    isStalled && !isClosed && "border-l-2 border-l-red-500",
                    selectedIds.includes(lead.id) && "bg-indigo-950/30"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(lead.id)}
                      onCheckedChange={() => onToggleSelect(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <LeadDetailSheet lead={lead}>
                      <button className="text-left font-medium text-zinc-50 hover:text-indigo-400">
                        {lead.company_name}
                      </button>
                    </LeadDetailSheet>
                    {lead.contact_name && (
                      <p className="text-xs text-zinc-500">
                        {lead.contact_name}
                        {lead.contact_role ? ` · ${lead.contact_role}` : ""}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                        getScoreBgColor(score),
                        getScoreColor(score)
                      )}
                    >
                      {score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.stage} />
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {lead.agents?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {lead.last_activity_at
                      ? formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-zinc-400", isStalled && !isClosed && "text-red-400")}>
                      {daysInStage !== null ? `${daysInStage}d` : "—"}
                    </span>
                    {isStalled && !isClosed && (
                      <AlertTriangle className="ml-1 inline h-3 w-3 text-red-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    {!isClosed && (
                      <QuickAdvanceButton leadId={lead.id} currentStage={lead.stage} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
