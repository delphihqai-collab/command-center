import {
  Layers,
  TrendingUp,
  Pause,
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Pool {
  id: string;
  capability: string;
  display_name: string;
  description: string | null;
  min_instances: number;
  max_instances: number;
  current_instances: number;
  scaling_strategy: string;
  enabled: boolean;
  base_agent: { id: string; slug: string; name: string } | null;
}

const STRATEGY_LABELS: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "text-zinc-400 border-zinc-700" },
  load_based: { label: "Load-Based", color: "text-amber-400 border-amber-700" },
  pipeline_volume: { label: "Pipeline Volume", color: "text-indigo-400 border-indigo-700" },
};

export function PoolsPanel({ pools }: { pools: Pool[] }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-zinc-50">
          <Layers className="h-4 w-4 text-violet-400" />
          Elastic Agent Pools
          <Badge
            variant="outline"
            className="ml-auto border-zinc-700 text-xs text-zinc-500"
          >
            {pools.filter((p) => p.enabled).length} active
          </Badge>
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Dynamic scaling: from fixed agents to elastic capability pools.
          Instances scale based on pipeline volume and load.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {pools.map((pool) => {
            const strategy = STRATEGY_LABELS[pool.scaling_strategy] ?? STRATEGY_LABELS.manual;
            const utilization =
              pool.max_instances > 0
                ? (pool.current_instances / pool.max_instances) * 100
                : 0;

            return (
              <div
                key={pool.id}
                className={`rounded-lg border p-4 ${
                  pool.enabled
                    ? "border-zinc-700 bg-zinc-950"
                    : "border-zinc-800 bg-zinc-950/50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-semibold text-zinc-200">
                      {pool.display_name}
                    </span>
                  </div>
                  {pool.enabled ? (
                    <Play className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Pause className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                </div>

                {pool.description && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {pool.description}
                  </p>
                )}

                {/* Instance gauge */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Instances</span>
                    <span>
                      {pool.current_instances} / {pool.max_instances}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all"
                      style={{ width: `${Math.max(utilization, 8)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-600">
                    <span>Min: {pool.min_instances}</span>
                    <span>Max: {pool.max_instances}</span>
                  </div>
                </div>

                {/* Strategy + base agent */}
                <div className="mt-3 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${strategy.color}`}
                  >
                    <TrendingUp className="mr-1 h-2.5 w-2.5" />
                    {strategy.label}
                  </Badge>
                  {pool.base_agent && (
                    <span className="text-[10px] text-zinc-600">
                      Base: {pool.base_agent.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {pools.length === 0 && (
            <div className="col-span-3 py-8 text-center text-sm text-zinc-500">
              No agent pools configured. Pools enable elastic scaling of agent
              capabilities.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
