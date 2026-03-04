import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { StageFilterTabs } from "./_components/stage-filter-tabs";
import { PipelineClient } from "./_components/pipeline-client";
import { RealtimeRefresh } from "@/components/realtime-refresh";

interface Props {
  searchParams: Promise<{ stage?: string; sector?: string; qualified?: string }>;
}

async function PipelineData({
  searchParams,
}: {
  searchParams: { stage?: string; sector?: string; qualified?: string };
}) {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*, agents!leads_assigned_agent_id_fkey(name)")
    .is("archived_at", null)
    .order("last_activity_at", { ascending: false, nullsFirst: false });

  if (searchParams.stage) {
    const stages = searchParams.stage.split(",");
    query = query.in("stage", stages);
  }
  if (searchParams.sector) {
    query = query.eq("sector", searchParams.sector);
  }
  if (searchParams.qualified === "yes") {
    query = query.eq("qualified", true);
  } else if (searchParams.qualified === "no") {
    query = query.eq("qualified", false);
  }

  const { data: leads } = await query;

  const typedLeads = (leads ?? []).map((lead) => ({
    ...lead,
    agents: lead.agents as unknown as { name: string } | null,
  }));

  return <PipelineClient leads={typedLeads} />;
}

export default async function PipelinePage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Pipeline</h1>
      </div>

      <RealtimeRefresh table="leads" />

      <Suspense>
        <StageFilterTabs />
      </Suspense>

      <Suspense
        fallback={<Skeleton className="h-96 w-full rounded-lg" />}
      >
        <PipelineData searchParams={params} />
      </Suspense>
    </div>
  );
}
