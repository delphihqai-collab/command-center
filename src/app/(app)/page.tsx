import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { TERMINAL_STAGES } from "@/lib/types";
import { KPICards } from "@/components/home/kpi-cards";
import { QuickActions } from "@/components/home/quick-actions";
import { PipelineTargets } from "@/components/home/pipeline-targets";
import { PipelineFunnel } from "@/components/home/pipeline-funnel";
import { ReviewQueue } from "@/components/home/review-queue";
import { RecentLeads } from "@/components/home/recent-leads";
import { AgentGrid } from "@/components/home/agent-grid";
import { ActivityFeed } from "@/components/home/activity-feed";

export const dynamic = "force-dynamic";

function CardSkeleton() {
  return <Skeleton className="h-40 w-full rounded-lg" />;
}

async function HomeData() {
  const supabase = await createClient();

  const [{ data: leads }, { data: todayTargets }] = await Promise.all([
    supabase
      .from("pipeline_leads")
      .select(
        "id, company_name, contact_name, stage, deal_value_eur, icp_score, trigger_event, industry, meeting_date, created_at, updated_at"
      )
      .order("updated_at", { ascending: false }),
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

  // Stage counts for funnel
  const stageCounts: Record<string, number> = {};
  for (const lead of allLeads) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
  }

  // Today's KPIs
  const today = new Date().toISOString().split("T")[0];
  const leadsFoundToday = allLeads.filter((l) =>
    l.created_at.startsWith(today)
  ).length;
  const meetingsBooked = allLeads.filter(
    (l) => l.stage === "meeting_booked"
  ).length;
  const repliesReceived = allLeads.filter(
    (l) => l.stage === "engaged"
  ).length;

  // Targets
  const targets = todayTargets;
  const leadsTarget = targets?.leads_target ?? 50;
  const emailsTarget = targets?.emails_target ?? 100;
  const linkedinTarget = targets?.linkedin_target ?? 20;
  const emailsActual = targets?.outreach_actual ?? 0;
  const linkedinActual = targets?.linkedin_actual ?? 0;

  // Review queue
  const leadsForReview = allLeads.filter(
    (l) => l.stage === "human_review"
  );

  return (
    <>
      {/* Pipeline Targets + Review Queue */}
      <div className="grid gap-6 lg:grid-cols-2">
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
        <ReviewQueue
          leads={leadsForReview.map((l) => ({
            id: l.id,
            company_name: l.company_name,
            contact_name: l.contact_name,
            icp_score: l.icp_score,
            industry: l.industry,
            trigger_event: l.trigger_event,
          }))}
        />
      </div>

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
                  No leads in the pipeline yet. Use Quick Actions above to start
                  discovering companies.
                </p>
              </div>
            ) : (
              <PipelineFunnel stageCounts={stageCounts} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <RealtimeRefresh table="pipeline_leads" />
      <RealtimeRefresh table="war_rooms" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Mission Control</h1>
        <p className="text-sm text-zinc-400">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Row */}
      <Suspense fallback={<CardSkeleton />}>
        <KPICards />
      </Suspense>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Quick Actions
        </h2>
        <QuickActions />
      </div>

      {/* Pipeline Data (targets, review queue, funnel) */}
      <Suspense fallback={<CardSkeleton />}>
        <HomeData />
      </Suspense>

      {/* Recent Leads + Agent Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <RecentLeads />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <AgentGrid />
        </Suspense>
      </div>

      {/* Activity Feed */}
      <Suspense fallback={<CardSkeleton />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
