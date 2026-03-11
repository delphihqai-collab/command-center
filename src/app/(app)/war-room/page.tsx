import { createClient } from "@/lib/supabase/server";
import {
  Crosshair,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { TERMINAL_STAGES } from "@/lib/types";
import { PipelineTargets } from "./_components/pipeline-targets";
import { PipelineFunnel } from "./_components/pipeline-funnel";
import { QuickActions } from "./_components/quick-actions";
import { WarRoomCreateButton } from "./_components/war-room-create";

export const dynamic = "force-dynamic";

export default async function WarRoomPage() {
  const supabase = await createClient();

  const [
    { data: leads },
    { data: agents },
    { data: warRooms },
    { data: reviewItems },
    { data: todayTargets },
  ] = await Promise.all([
    supabase
      .from("pipeline_leads")
      .select("id, company_name, contact_name, stage, deal_value_eur, icp_score, trigger_event, industry, meeting_date, outreach_step, outreach_total_steps, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("agents")
      .select("id, slug, name, type, status")
      .order("slug"),
    supabase
      .from("war_rooms")
      .select("id, name, status, priority, objective, type, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("review_queue")
      .select("id, review_type, status, context, lead_id, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("daily_targets")
      .select("*")
      .eq("date", new Date().toISOString().split("T")[0])
      .maybeSingle(),
  ]);

  const allLeads = leads ?? [];
  const activeLeads = allLeads.filter(
    (l) => !TERMINAL_STAGES.includes(l.stage as never)
  );
  const pendingReview = reviewItems ?? [];
  const operations = (warRooms ?? []).filter(
    (r) => r.type !== "core_pipeline"
  );
  const activeOps = operations.filter((r) => r.status === "active");
  const resolvedOps = operations.filter((r) => r.status === "resolved");

  // Compute stage counts
  const stageCounts: Record<string, number> = {};
  for (const lead of allLeads) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
  }

  // Compute KPIs from actual data
  const today = new Date().toISOString().split("T")[0];
  const leadsFoundToday = allLeads.filter(
    (l) => l.created_at.startsWith(today)
  ).length;
  const meetingsBooked = allLeads.filter(
    (l) => l.stage === "meeting_booked"
  ).length;
  const repliesReceived = allLeads.filter(
    (l) => l.stage === "engaged"
  ).length;

  // Targets from daily_targets table
  const targets = todayTargets;
  const leadsTarget = targets?.leads_target ?? 50;
  const emailsTarget = targets?.emails_target ?? 100;
  const linkedinTarget = targets?.linkedin_target ?? 20;
  const emailsActual = targets?.outreach_actual ?? 0;
  const linkedinActual = targets?.linkedin_actual ?? 0;

  // Leads in human_review are your review queue
  const leadsForReview = allLeads.filter(
    (l) => l.stage === "human_review"
  );

  // Upcoming meetings
  const upcomingMeetings = allLeads
    .filter(
      (l) =>
        l.stage === "meeting_booked" &&
        l.meeting_date &&
        new Date(l.meeting_date) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.meeting_date!).getTime() -
        new Date(b.meeting_date!).getTime()
    )
    .slice(0, 5);

  // Pipeline value
  const pipelineValue = activeLeads.reduce(
    (sum, l) => sum + (l.deal_value_eur ? Number(l.deal_value_eur) : 0),
    0
  );

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="pipeline_leads" />
      <RealtimeRefresh table="war_rooms" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
            <Crosshair className="h-7 w-7 text-indigo-400" />
            War Room
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {activeLeads.length} active leads · {pipelineValue > 0 ? `€${pipelineValue.toLocaleString("en")} pipeline` : "Pipeline starting up"}
          </p>
        </div>
        <WarRoomCreateButton
          agents={agents ?? []}
          leads={activeLeads.map((l) => ({
            id: l.id,
            company_name: l.company_name,
            deal_value_eur: l.deal_value_eur,
            stage: l.stage,
          }))}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Quick Actions
        </h2>
        <QuickActions />
      </div>

      {/* Today's Pipeline Targets */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Today&apos;s Pipeline
        </h2>
        <PipelineTargets
          leadsFound={leadsFoundToday}
          leadsTarget={leadsTarget}
          emailsSent={emailsActual}
          emailsTarget={emailsTarget}
          linkedinTouches={linkedinActual}
          linkedinTarget={linkedinTarget}
          repliesReceived={repliesReceived}
          meetingsBooked={meetingsBooked}
        />
      </div>

      {/* Review Queue */}
      {(leadsForReview.length > 0 || pendingReview.length > 0) && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Review Queue ({leadsForReview.length + pendingReview.length})
          </h2>
          <div className="space-y-2">
            {leadsForReview.map((lead) => (
              <Card key={lead.id} className="border-amber-800/30 bg-zinc-900">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/40">
                    <span className="text-xs font-bold text-amber-400">
                      {lead.icp_score ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {lead.company_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {lead.industry && <span>{lead.industry}</span>}
                      {lead.trigger_event && (
                        <span>· {lead.trigger_event}</span>
                      )}
                      {lead.contact_name && (
                        <span>· {lead.contact_name}</span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-700 text-amber-400"
                  >
                    Lead Review
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Funnel */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Pipeline Funnel
        </h2>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            {activeLeads.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">
                  No leads in the pipeline yet. Use &quot;Find Leads&quot; above to start discovering companies.
                </p>
              </div>
            ) : (
              <PipelineFunnel stageCounts={stageCounts} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Upcoming Meetings
          </h2>
          <div className="space-y-2">
            {upcomingMeetings.map((lead) => (
              <Card key={lead.id} className="border-zinc-800 bg-zinc-900">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/40 text-emerald-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {lead.company_name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {lead.contact_name}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {lead.meeting_date
                      ? new Date(lead.meeting_date).toLocaleDateString(
                          "en-GB",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "TBD"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Operations */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Operations {activeOps.length > 0 && `(${activeOps.length} active)`}
          </h2>
        </div>

        {activeOps.length > 0 ? (
          <div className="space-y-2">
            {activeOps.map((op) => (
              <Card key={op.id} className="border-zinc-800 bg-zinc-900">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950/40 text-indigo-400">
                    <Crosshair className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {op.name}
                    </p>
                    {op.objective && (
                      <p className="text-xs text-zinc-500 truncate">
                        {op.objective}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        op.priority === "critical"
                          ? "border-red-700 text-red-400"
                          : op.priority === "high"
                            ? "border-amber-700 text-amber-400"
                            : "border-zinc-700 text-zinc-400"
                      }
                    >
                      {op.priority}
                    </Badge>
                    <span className="text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(op.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-zinc-800 bg-zinc-900/50">
            <CardContent className="py-8 text-center">
              <Plus className="mx-auto h-8 w-8 text-zinc-700" />
              <p className="mt-2 text-sm text-zinc-500">
                No active operations. Use quick actions above or create a custom operation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resolved Operations */}
      {resolvedOps.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Completed ({resolvedOps.length})
          </h2>
          <div className="space-y-2">
            {resolvedOps.slice(0, 5).map((op) => (
              <Card key={op.id} className="border-zinc-800/50 bg-zinc-900/50">
                <CardContent className="flex items-center gap-4 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="flex-1 text-sm text-zinc-400">
                    {op.name}
                  </span>
                  {op.resolved_at && (
                    <span className="text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(op.resolved_at), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
