"use client";

import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAlert } from "../actions";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface AlertEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  message: string;
  severity: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  alert_rules: { name: string; description: string | null } | null;
}

const severityConfig: Record<string, { color: string; bg: string; icon: typeof AlertTriangle }> = {
  critical: { color: "text-red-400", bg: "border-red-900/50 bg-red-950/20", icon: AlertCircle },
  high: { color: "text-amber-400", bg: "border-amber-900/50 bg-amber-950/20", icon: AlertTriangle },
  medium: { color: "text-yellow-400", bg: "border-yellow-900/50 bg-zinc-900", icon: AlertTriangle },
  info: { color: "text-blue-400", bg: "border-blue-900/50 bg-zinc-900", icon: Info },
};

export function AlertsClient({ alerts }: { alerts: AlertEvent[] }) {
  const grouped = {
    critical: alerts.filter((a) => a.severity === "critical"),
    high: alerts.filter((a) => a.severity === "high"),
    medium: alerts.filter((a) => a.severity === "medium"),
    info: alerts.filter((a) => a.severity === "info"),
  };

  return (
    <>
      <RealtimeRefresh table="alert_events" />

      {alerts.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center gap-2 p-8">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="text-sm text-zinc-400">All clear — no active alerts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(["critical", "high", "medium", "info"] as const).map((level) => {
            const items = grouped[level];
            if (items.length === 0) return null;
            const config = severityConfig[level];
            const Icon = config.icon;
            return (
              <div key={level} className="space-y-2">
                <h2 className={`flex items-center gap-2 text-sm font-medium capitalize ${config.color}`}>
                  <Icon className="h-4 w-4" />
                  {level} ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.map((alert) => (
                    <Card key={alert.id} className={config.bg}>
                      <CardContent className="flex items-start justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm text-zinc-50">{alert.message}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                            {alert.alert_rules?.name && (
                              <span>Rule: {alert.alert_rules.name}</span>
                            )}
                            <span>{alert.entity_type}</span>
                            <span>
                              {formatDistanceToNow(new Date(alert.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <form action={resolveAlert}>
                          <input type="hidden" name="id" value={alert.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="h-7 border-zinc-700 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
                          >
                            Resolve
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
