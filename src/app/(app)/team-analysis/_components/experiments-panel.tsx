import {
  FlaskConical,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  FileEdit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  category: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  agent: { id: string; slug: string; name: string } | null;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  draft: { icon: FileEdit, color: "text-zinc-400", bg: "border-zinc-700" },
  running: { icon: Play, color: "text-emerald-400", bg: "border-emerald-700" },
  paused: { icon: Pause, color: "text-amber-400", bg: "border-amber-700" },
  completed: {
    icon: CheckCircle2,
    color: "text-indigo-400",
    bg: "border-indigo-700",
  },
  cancelled: { icon: Clock, color: "text-zinc-500", bg: "border-zinc-700" },
};

const CATEGORY_COLORS: Record<string, string> = {
  outreach: "text-amber-400 border-amber-800",
  qualification: "text-cyan-400 border-cyan-800",
  negotiation: "text-emerald-400 border-emerald-800",
  retention: "text-blue-400 border-blue-800",
  process: "text-violet-400 border-violet-800",
  topology: "text-pink-400 border-pink-800",
};

export function ExperimentsPanel({
  experiments,
}: {
  experiments: Experiment[];
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-zinc-50">
          <FlaskConical className="h-4 w-4 text-emerald-400" />
          Fleet Experiments
          <Badge
            variant="outline"
            className="ml-auto border-zinc-700 text-xs text-zinc-500"
          >
            {experiments.filter((e) => e.status === "running").length} running
          </Badge>
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Machine-speed A/B testing: outreach templates, qualification criteria,
          deal strategies
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {experiments.map((exp) => {
          const statusConf = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
          const StatusIcon = statusConf.icon;
          const catColor =
            CATEGORY_COLORS[exp.category] ?? "text-zinc-400 border-zinc-700";

          return (
            <div
              key={exp.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
            >
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-3.5 w-3.5 ${statusConf.color}`} />
                <span className="text-sm font-medium text-zinc-200">
                  {exp.name}
                </span>
                <Badge
                  variant="outline"
                  className={`ml-auto text-[10px] ${statusConf.bg} ${statusConf.color}`}
                >
                  {exp.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                {exp.hypothesis}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${catColor}`}
                >
                  {exp.category}
                </Badge>
                {exp.agent && (
                  <span className="text-[10px] text-zinc-600">
                    {exp.agent.name}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-zinc-600">
                  {formatDistanceToNow(new Date(exp.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {experiments.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-zinc-700" />
            <p className="mt-2 text-sm text-zinc-500">No experiments yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Create experiments to A/B test outreach templates, qualification
              criteria, and deal strategies at machine speed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
