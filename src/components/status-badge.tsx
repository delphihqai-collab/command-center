import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  // Emerald — positive states
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  enabled: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",

  // Amber — warning states
  idle: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  needs_changes: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  yellow: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  IMPORTANT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/20",

  // Red — critical states
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
  built_not_calibrated: "bg-red-500/15 text-red-400 border-red-500/20",
  rejected: "bg-red-500/15 text-red-400 border-red-500/20",
  failed: "bg-red-500/15 text-red-400 border-red-500/20",
  high: "bg-red-500/15 text-red-400 border-red-500/20",
  urgent: "bg-red-500/15 text-red-400 border-red-500/20",
  red: "bg-red-500/15 text-red-400 border-red-500/20",
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
  HIGH: "bg-red-500/15 text-red-400 border-red-500/20",

  // Zinc — neutral/inactive states
  offline: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  inbox: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  backlog: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  disabled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",

  // Sky — informational
  INFORMATIONAL: "bg-sky-500/15 text-sky-400 border-sky-500/20",

  // Indigo — in-progress / active work
  todo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  running: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",

  // Purple — review
  review: "bg-purple-500/15 text-purple-400 border-purple-500/20",

  // Pipeline stages
  discovery: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  enrichment: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  human_review: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  outreach: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  engaged: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  meeting_booked: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  meeting_completed: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  proposal_sent: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  lost: "bg-red-500/15 text-red-400 border-red-500/20",
  disqualified: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
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
