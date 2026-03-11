import { createClient } from "@/lib/supabase/server";
import { Shield, Target } from "lucide-react";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { WarRoomTabs } from "./_components/war-room-tabs";
import { ReviewQueue } from "./_components/review-queue";
import { PipelineTargets } from "./_components/pipeline-targets";
import { PipelineFunnel } from "./_components/pipeline-funnel";
import { UpcomingMeetings } from "./_components/upcoming-meetings";
import { OperationsList } from "./_components/operations-list";
import { CreateOperationButton } from "./_components/create-operation";

export const dynamic = "force-dynamic";

export default async function WarRoomPage() {
  const supabase = await createClient();

  const [
    { data: dailyTargets },
    { data: reviewItems },
    { data: leads },
    { data: meetingLeads },
    { data: rawWarRooms },
    { data: agents },
    { data: activeLeads },
  ] = await Promise.all([
    supabase
      .from("daily_targets")
      .select("*")
      .eq("date", new Date().toISOString().split("T")[0])
      .maybeSingle(),
    supabase
      .from("review_queue")
      .select("*, lead:pipeline_leads(id, company_name, contact_name, stage, deal_value_eur, icp_score, intent_score, company_industry, trigger_event), requested_by_agent:agents!review_queue_requested_by_fkey(id, slug, name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("pipeline_leads")
      .select("stage")
      .not("stage", "in", "(won,lost,disqualified)"),
    supabase
      .from("pipeline_leads")
      .select("id, company_name, contact_name, meeting_scheduled_at, deal_value_eur")
      .not("meeting_scheduled_at", "is", null)
      .gte("meeting_scheduled_at", new Date().toISOString())
      .order("meeting_scheduled_at", { ascending: true })
      .limit(10),
    supabase
      .from("war_rooms")
      .select("*, lead:pipeline_leads(id, company_name, deal_value_eur), agents:war_room_agents(agent_id, role, agent:agents(slug, name))")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("agents").select("id, slug, name, type, status").order("slug"),
    supabase
      .from("pipeline_leads")
      .select("id, company_name, deal_value_eur, stage")
      .not("stage", "in", "(won,lost,disqualified)")
      .order("deal_value_eur", { ascending: false })
      .limit(20),
  ]);

  // Build stage counts for funnel
  const stageCounts: Record<string, number> = {};
  for (const lead of leads ?? []) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
  }

  const warRooms = (rawWarRooms ?? []) as unknown as {
    id: string;
    name: string;
    status: string;
    priority: string;
    objective: string | null;
    type: string | null;
    created_at: string;
    resolved_at: string | null;
    lead: { id: string; company_name: string; deal_value_eur: number | null } | null;
    agents: { agent_id: string; role: string; agent: { slug: string; name: string } | null }[];
  }[];

  const pipelineCommand = (
    <>
      <PipelineTargets targets={dailyTargets} />
      <ReviewQueue items={(reviewItems ?? []) as Parameters<typeof ReviewQueue>[0]["items"]} />
      <PipelineFunnel stageCounts={stageCounts} />
      <UpcomingMeetings
        leads={(meetingLeads ?? []).map((l) => ({
          ...l,
          contact_name: l.contact_name ?? null,
          meeting_scheduled_at: l.meeting_scheduled_at!,
          deal_value_eur: l.deal_value_eur ?? null,
        }))}
      />
    </>
  );

  const operations = (
    <>
      <div className="flex justify-end">
        <CreateOperationButton
          agents={(agents ?? []).map((a) => ({ id: a.id, slug: a.slug, name: a.name }))}
          leads={(activeLeads ?? []).map((l) => ({
            id: l.id,
            company_name: l.company_name,
            deal_value_eur: l.deal_value_eur ?? null,
            stage: l.stage,
          }))}
        />
      </div>
      <OperationsList rooms={warRooms} />
    </>
  );

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="review_queue" />
      <RealtimeRefresh table="pipeline_leads" />

      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
          <Shield className="h-7 w-7 text-red-400" />
          War Room
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Pipeline command center — review leads, track targets, manage operations
        </p>
      </div>

      <WarRoomTabs pipelineCommand={pipelineCommand} operations={operations} />
    </div>
  );
}
