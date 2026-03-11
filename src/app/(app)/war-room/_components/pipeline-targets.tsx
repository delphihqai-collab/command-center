import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Mail, CalendarCheck } from "lucide-react";
import type { DailyTarget } from "@/lib/types";

export function PipelineTargets({ targets }: { targets: DailyTarget | null }) {
  const metrics = [
    {
      label: "New Leads",
      target: targets?.leads_target ?? 0,
      actual: targets?.leads_actual ?? 0,
      icon: Target,
    },
    {
      label: "Outreach Sent",
      target: targets?.outreach_target ?? 0,
      actual: targets?.outreach_actual ?? 0,
      icon: Mail,
    },
    {
      label: "Meetings",
      target: targets?.meetings_target ?? 0,
      actual: targets?.meetings_actual ?? 0,
      icon: CalendarCheck,
    },
    {
      label: "Revenue",
      target: Number(targets?.revenue_target ?? 0),
      actual: Number(targets?.revenue_actual ?? 0),
      icon: TrendingUp,
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((m) => {
        const pct = m.target > 0 ? Math.round((m.actual / m.target) * 100) : 0;
        const color = pct >= 100 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
        return (
          <Card key={m.label} className="border-zinc-800 bg-zinc-900">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl font-bold ${color}`}>
                  {m.isCurrency ? `\u20AC${m.actual.toLocaleString("en")}` : m.actual}
                </span>
                <span className="text-xs text-zinc-500">
                  / {m.isCurrency ? `\u20AC${m.target.toLocaleString("en")}` : m.target}
                </span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
