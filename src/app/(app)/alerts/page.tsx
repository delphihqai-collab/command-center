import { createClient } from "@/lib/supabase/server";
import { AlertsClient } from "./_components/alerts-client";

export default async function AlertsPage() {
  const supabase = await createClient();

  const { data: alerts } = await supabase
    .from("alert_events")
    .select("*, alert_rules(name, description)")
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  const criticalCount =
    alerts?.filter((a) => a.severity === "critical").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Alerts</h1>
        <p className="text-sm text-zinc-400">
          {alerts?.length ?? 0} active · {criticalCount} critical
        </p>
      </div>
      <AlertsClient alerts={alerts ?? []} />
    </div>
  );
}
