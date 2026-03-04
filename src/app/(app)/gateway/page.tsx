import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, AlertTriangle } from "lucide-react";
import { GatewayEditor } from "./_components/gateway-editor";

async function fetchGatewayConfig() {
  try {
    const res = await fetch("http://localhost:18789/config", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function GatewayPage() {
  const config = await fetchGatewayConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Server className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-semibold text-zinc-50">Gateway Config</h1>
      </div>

      {!config ? (
        <Card className="border-amber-800 bg-zinc-900">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-zinc-50">
                Gateway Not Reachable
              </p>
              <p className="text-xs text-zinc-400">
                Could not connect to the HERMES gateway at localhost:18789. The service may be offline.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <GatewayEditor config={config} />
      )}

      {/* Static info cards always shown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Primary Model</span>
              <span className="font-mono text-zinc-300">
                {config?.model ?? "claude-sonnet-4-6"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Sub-agent Model</span>
              <span className="font-mono text-zinc-300">
                {config?.sub_agent_model ?? "claude-sonnet-4-6"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Scheduled Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(config?.scheduled_jobs ?? [
              { name: "Daily Pipeline Review", schedule: "0 8 * * *" },
              { name: "Weekly Client Health", schedule: "0 9 * * 1" },
              { name: "Invoice Overdue Check", schedule: "0 10 * * *" },
              { name: "Stall Detection", schedule: "0 */6 * * *" },
            ]).map((job: { name: string; schedule: string }) => (
              <div key={job.name} className="flex justify-between">
                <span className="text-zinc-400">{job.name}</span>
                <span className="font-mono text-xs text-zinc-500">{job.schedule}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Update Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Channel</span>
              <span
                className={`font-mono text-xs ${
                  config?.update_channel === "beta"
                    ? "rounded border border-red-800 px-2 py-0.5 text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {config?.update_channel ?? "stable"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Auto-update</span>
              <span className="text-zinc-300">
                {config?.auto_update ? "Enabled" : "Disabled"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-400">
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Requests/min</span>
              <span className="text-zinc-300">{config?.rate_limit_rpm ?? "60"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
