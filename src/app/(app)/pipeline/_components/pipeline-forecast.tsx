import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { Lead } from "@/lib/types";

const STAGE_CONVERSION: Record<string, number> = {
  prospecting: 0.05,
  qualification: 0.15,
  initial_contact: 0.2,
  demo: 0.35,
  needs_analysis: 0.45,
  proposal_sent: 0.55,
  negotiation: 0.7,
};

// Average days to close from each stage
const STAGE_DAYS_TO_CLOSE: Record<string, number> = {
  prospecting: 90,
  qualification: 75,
  initial_contact: 60,
  demo: 45,
  needs_analysis: 35,
  proposal_sent: 20,
  negotiation: 10,
};

// Assume average deal value since we don't have explicit amounts
const AVG_DEAL_VALUE = 25000;

interface PipelineForecastProps {
  leads: Lead[];
}

export function PipelineForecast({ leads }: PipelineForecastProps) {
  const openLeads = leads.filter(
    (l) => l.stage !== "closed_won" && l.stage !== "closed_lost"
  );

  // Bucket by expected close horizon
  const buckets: Record<string, { count: number; weightedValue: number }> = {
    "30 days": { count: 0, weightedValue: 0 },
    "60 days": { count: 0, weightedValue: 0 },
    "90 days": { count: 0, weightedValue: 0 },
  };

  for (const lead of openLeads) {
    const conversion = STAGE_CONVERSION[lead.stage] ?? 0;
    const daysToClose = STAGE_DAYS_TO_CLOSE[lead.stage] ?? 90;
    const weighted = AVG_DEAL_VALUE * conversion;

    if (daysToClose <= 30) {
      buckets["30 days"].count++;
      buckets["30 days"].weightedValue += weighted;
    } else if (daysToClose <= 60) {
      buckets["60 days"].count++;
      buckets["60 days"].weightedValue += weighted;
    } else {
      buckets["90 days"].count++;
      buckets["90 days"].weightedValue += weighted;
    }
  }

  const totalWeighted = Object.values(buckets).reduce(
    (s, b) => s + b.weightedValue,
    0
  );

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <TrendingUp className="h-4 w-4" />
          Pipeline Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-zinc-950 p-3">
          <p className="text-xs text-zinc-500">Total Weighted Pipeline</p>
          <p className="text-xl font-bold text-zinc-50">
            ${totalWeighted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        {Object.entries(buckets).map(([horizon, data]) => (
          <div
            key={horizon}
            className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-zinc-50">{horizon}</p>
              <p className="text-xs text-zinc-500">{data.count} deals</p>
            </div>
            <p className="text-sm font-semibold text-zinc-300">
              ${data.weightedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}

        <div className="pt-2">
          <p className="text-xs text-zinc-600">
            Based on ${AVG_DEAL_VALUE.toLocaleString()} avg deal × stage conversion rates
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
