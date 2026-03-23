import {
  Search,
  Mail,
  MessageSquare,
  Reply,
  CalendarCheck,
} from "lucide-react";

interface TargetKPI {
  label: string;
  actual: number;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Props {
  leadsFound: number;
  leadsTarget: number;
  emailsSent: number;
  emailsTarget: number;
  linkedinTouches: number;
  linkedinTarget: number;
  repliesReceived: number;
  meetingsBooked: number;
}

export function PipelineTargets({
  leadsFound,
  leadsTarget,
  emailsSent,
  emailsTarget,
  linkedinTouches,
  linkedinTarget,
  repliesReceived,
  meetingsBooked,
}: Props) {
  const kpis: TargetKPI[] = [
    {
      label: "Leads Found",
      actual: leadsFound,
      target: leadsTarget,
      icon: Search,
      color: "text-sky-400",
    },
    {
      label: "Emails Sent",
      actual: emailsSent,
      target: emailsTarget,
      icon: Mail,
      color: "text-purple-400",
    },
    {
      label: "LinkedIn",
      actual: linkedinTouches,
      target: linkedinTarget,
      icon: MessageSquare,
      color: "text-indigo-400",
    },
    {
      label: "Replies",
      actual: repliesReceived,
      target: 0,
      icon: Reply,
      color: "text-emerald-400",
    },
    {
      label: "Meetings",
      actual: meetingsBooked,
      target: 0,
      icon: CalendarCheck,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {kpis.map((kpi) => {
        const pct =
          kpi.target > 0
            ? Math.min((kpi.actual / kpi.target) * 100, 100)
            : 0;
        const isOnTrack = kpi.target === 0 || kpi.actual >= kpi.target * 0.8;
        return (
          <div
            key={kpi.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[10px] font-medium text-zinc-500">
                {kpi.label}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-zinc-50">
                {kpi.actual}
              </span>
              {kpi.target > 0 && (
                <span className="text-sm text-zinc-500">/{kpi.target}</span>
              )}
            </div>
            {kpi.target > 0 && (
              <div className="mt-2 h-1 rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    isOnTrack ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
