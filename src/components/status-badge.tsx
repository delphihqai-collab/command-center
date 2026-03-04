import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  // Emerald — positive states
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  closed_won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",

  // Amber — warning states
  at_risk: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  idle: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pending_approval: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  drafting: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  negotiation: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  yellow: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  late: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  IMPORTANT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/20",

  // Red — critical states
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
  built_not_calibrated: "bg-red-500/15 text-red-400 border-red-500/20",
  overdue: "bg-red-500/15 text-red-400 border-red-500/20",
  rejected: "bg-red-500/15 text-red-400 border-red-500/20",
  closed_lost: "bg-red-500/15 text-red-400 border-red-500/20",
  disputed: "bg-red-500/15 text-red-400 border-red-500/20",
  failed: "bg-red-500/15 text-red-400 border-red-500/20",
  red: "bg-red-500/15 text-red-400 border-red-500/20",
  lost: "bg-red-500/15 text-red-400 border-red-500/20",
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
  HIGH: "bg-red-500/15 text-red-400 border-red-500/20",

  // Zinc — neutral/inactive states
  offline: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  expired: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  ghosted: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",

  // Sky — informational
  INFORMATIONAL: "bg-sky-500/15 text-sky-400 border-sky-500/20",

  // Indigo — in-progress
  prospecting: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  qualification: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  initial_contact: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  demo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  needs_analysis: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  proposal_sent: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  sent: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  gate_atlas: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  gate_legal: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  gate_finance: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
};

function formatLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const colorClass =
    statusColors[status] ||
    "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", colorClass, className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}
