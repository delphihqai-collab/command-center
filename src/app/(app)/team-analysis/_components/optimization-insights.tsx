import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
}

interface TopologyRow {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  channel_type: string;
  from_agent: { id: string; slug: string; name: string; type: string } | null;
  to_agent: { id: string; slug: string; name: string; type: string } | null;
}

interface Lead {
  stage: string;
  deal_value_eur: number | null;
  assigned_agent_id: string | null;
}

interface Insight {
  type: "optimization" | "warning" | "opportunity" | "success";
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
  category: string;
}

function generateInsights(
  agents: Agent[],
  topology: TopologyRow[],
  leads: Lead[],
  commPairs: Record<string, number>
): Insight[] {
  const insights: Insight[] = [];
  const workers = agents.filter((a) => a.type === "worker");
  const specialists = agents.filter((a) => a.type === "specialist");

  // 1. Check if workers have direct specialist access
  const workersWithDirectAccess = new Set<string>();
  for (const t of topology) {
    const fromAgent = agents.find((a) => a.id === t.from_agent_id);
    if (fromAgent?.type === "worker") {
      workersWithDirectAccess.add(fromAgent.slug);
    }
  }

  const workersWithout = workers.filter(
    (w) => !workersWithDirectAccess.has(w.slug)
  );
  if (workersWithout.length > 0) {
    insights.push({
      type: "warning",
      title: "Workers routing all queries through Hermes",
      detail: `${workersWithout.map((w) => w.name).join(", ")} lack direct specialist channels. Operational queries add latency.`,
      impact: "high",
      category: "Topology",
    });
  } else if (workers.length > 0) {
    insights.push({
      type: "success",
      title: "All workers have direct specialist access",
      detail: `${workers.length} workers can query specialists directly for operational tasks, reserving Hermes for strategic coordination.`,
      impact: "medium",
      category: "Topology",
    });
  }

  // 2. Pipeline bottleneck detection
  const stageDistribution: Record<string, number> = {};
  for (const lead of leads) {
    stageDistribution[lead.stage] = (stageDistribution[lead.stage] ?? 0) + 1;
  }

  const qualificationLeads = (stageDistribution["sdr_qualification"] ?? 0);
  const discoveryLeads = (stageDistribution["discovery"] ?? 0);

  if (qualificationLeads > leads.length * 0.4 && leads.length > 3) {
    insights.push({
      type: "optimization",
      title: "Pipeline bottleneck at SDR qualification",
      detail: `${qualificationLeads} of ${leads.length} leads (${Math.round((qualificationLeads / leads.length) * 100)}%) stuck in qualification. Consider enabling SDR pool scaling.`,
      impact: "high",
      category: "Pipeline",
    });
  }

  if (discoveryLeads > leads.length * 0.3 && leads.length > 3) {
    insights.push({
      type: "optimization",
      title: "Leads accumulating in discovery",
      detail: `${discoveryLeads} leads in discovery stage. AE may benefit from parallel instance scaling or MI pre-research.`,
      impact: "medium",
      category: "Pipeline",
    });
  }

  // 3. Communication volume insights
  const totalComms = Object.values(commPairs).reduce((s, v) => s + v, 0);
  if (totalComms > 0) {
    const topPair = Object.entries(commPairs).sort((a, b) => b[1] - a[1])[0];
    if (topPair && topPair[1] > totalComms * 0.3) {
      insights.push({
        type: "opportunity",
        title: "High-frequency communication pair detected",
        detail: `One agent pair accounts for ${Math.round((topPair[1] / totalComms) * 100)}% of all comms. Consider optimizing their shared context or creating a dedicated channel.`,
        impact: "medium",
        category: "Communication",
      });
    }
  }

  // 4. Specialist utilization
  const specialistInLinks: Record<string, number> = {};
  for (const t of topology) {
    const toAgent = agents.find((a) => a.id === t.to_agent_id);
    if (toAgent?.type === "specialist") {
      specialistInLinks[toAgent.slug] =
        (specialistInLinks[toAgent.slug] ?? 0) + 1;
    }
  }

  const underutilized = specialists.filter(
    (s) => !specialistInLinks[s.slug]
  );
  if (underutilized.length > 0) {
    insights.push({
      type: "opportunity",
      title: "Specialists without direct inbound channels",
      detail: `${underutilized.map((s) => s.name).join(", ")} are only reachable through Hermes. Consider adding direct channels from relevant workers.`,
      impact: "medium",
      category: "Topology",
    });
  }

  // 5. Machine-speed advantage
  insights.push({
    type: "opportunity",
    title: "Iteration speed multiplier",
    detail:
      "AI agents can test 50+ outreach variations simultaneously. Enable fleet experiments to systematically A/B test qualification criteria, messaging templates, and deal strategies at machine speed.",
    impact: "high",
    category: "Experimentation",
  });

  // 6. Elastic scaling readiness
  if (leads.length > 5) {
    insights.push({
      type: "optimization",
      title: "Pipeline volume supports elastic scaling",
      detail: `${leads.length} active leads in pipeline. Enabling elastic SDR and AE pools could process leads ${Math.min(10, Math.ceil(leads.length / 3))}x faster with parallel instances.`,
      impact: "high",
      category: "Scaling",
    });
  }

  // 7. Knowledge feedback loop
  insights.push({
    type: "optimization",
    title: "Knowledge Curator feedback loop",
    detail:
      "KC should consume win/loss data to automatically update playbooks. Configure a cron job for KC to analyze closed deals weekly and push updated templates to SDR and AE.",
    impact: "medium",
    category: "Process",
  });

  return insights;
}

const TYPE_CONFIG = {
  optimization: {
    icon: TrendingUp,
    borderColor: "border-indigo-800/30",
    bgColor: "bg-indigo-950/20",
    iconColor: "text-indigo-400",
    label: "Optimization",
    labelColor: "text-indigo-400 border-indigo-700",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-amber-800/30",
    bgColor: "bg-amber-950/20",
    iconColor: "text-amber-400",
    label: "Warning",
    labelColor: "text-amber-400 border-amber-700",
  },
  opportunity: {
    icon: Lightbulb,
    borderColor: "border-cyan-800/30",
    bgColor: "bg-cyan-950/20",
    iconColor: "text-cyan-400",
    label: "Opportunity",
    labelColor: "text-cyan-400 border-cyan-700",
  },
  success: {
    icon: CheckCircle2,
    borderColor: "border-emerald-800/30",
    bgColor: "bg-emerald-950/20",
    iconColor: "text-emerald-400",
    label: "Active",
    labelColor: "text-emerald-400 border-emerald-700",
  },
};

const IMPACT_COLORS = {
  high: "text-red-400 border-red-800",
  medium: "text-amber-400 border-amber-800",
  low: "text-zinc-400 border-zinc-700",
};

export function OptimizationInsights({
  agents,
  topology,
  pipelineLeads,
  commPairs,
}: {
  agents: Agent[];
  topology: TopologyRow[];
  pipelineLeads: Lead[];
  commPairs: Record<string, number>;
}) {
  const insights = generateInsights(agents, topology, pipelineLeads, commPairs);

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-zinc-50">
          <Zap className="h-4 w-4 text-amber-400" />
          Optimization Insights
          <Badge variant="outline" className="ml-auto border-zinc-700 text-xs text-zinc-500">
            {insights.length} insights
          </Badge>
        </CardTitle>
        <p className="text-xs text-zinc-500">
          AI-generated recommendations based on fleet topology, pipeline, and
          communication patterns
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const config = TYPE_CONFIG[insight.type];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-3`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">
                      {insight.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${IMPACT_COLORS[insight.impact]}`}
                    >
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{insight.detail}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${config.labelColor}`}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-zinc-600">
                      {insight.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
