"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow, format } from "date-fns";
import type { Lead } from "@/lib/types";
import type { Json } from "@/lib/database.types";

interface LeadWithAgent extends Lead {
  agents: { name: string } | null;
}

function renderJson(data: Json | null | undefined, label: string) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0))
    return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-500">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-2 font-mono text-xs text-zinc-400">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function LeadDetailSheet({
  lead,
  children,
}: {
  lead: LeadWithAgent;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[420px] overflow-auto border-zinc-800 bg-zinc-950 sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-zinc-50">{lead.company_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.stage} />
            {lead.qualified && <StatusBadge status="qualified" />}
            {lead.stall_flagged && (
              <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
                Stalled
              </span>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500">Contact</p>
              <p className="text-sm text-zinc-50">
                {lead.contact_name ?? "—"}
              </p>
              {lead.contact_role && (
                <p className="text-xs text-zinc-400">{lead.contact_role}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-zinc-500">Agent</p>
              <p className="text-sm text-zinc-50">
                {lead.agents?.name ?? "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Sector</p>
              <p className="text-sm text-zinc-50">{lead.sector ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Country</p>
              <p className="text-sm text-zinc-50">{lead.country ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Source</p>
              <p className="text-sm text-zinc-50">{lead.source ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Last Activity</p>
              <p className="text-sm text-zinc-50">
                {lead.last_activity_at
                  ? formatDistanceToNow(new Date(lead.last_activity_at), {
                      addSuffix: true,
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="text-sm text-zinc-50">
                {format(new Date(lead.created_at), "dd MMM yyyy")}
              </p>
            </div>
          </div>

          {/* Disqualify reason */}
          {lead.disqualified_reason && (
            <div>
              <p className="text-xs text-zinc-500">Disqualified Reason</p>
              <p className="text-sm text-red-400">
                {lead.disqualified_reason}
              </p>
            </div>
          )}

          {/* JSON data */}
          {renderJson(lead.sdr_brief, "SDR Brief")}
          {renderJson(lead.meddic, "MEDDIC")}
        </div>
      </SheetContent>
    </Sheet>
  );
}
