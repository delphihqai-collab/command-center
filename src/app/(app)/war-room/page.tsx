import { createClient } from "@/lib/supabase/server";
import {
  Shield,
  Users,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { WarRoomCreateButton } from "./_components/war-room-create";
import { WarRoomCard } from "./_components/war-room-card";

export const dynamic = "force-dynamic";

interface WarRoomAgent {
  id: string;
  agent_id: string;
  role: string;
  agent: {
    id: string;
    slug: string;
    name: string;
    type: string;
    status: string;
  } | null;
}

interface WarRoomActivity {
  id: string;
  agent_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
  agent: { slug: string; name: string } | null;
}

interface WarRoom {
  id: string;
  name: string;
  status: string;
  priority: string;
  objective: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  lead: {
    id: string;
    company_name: string;
    deal_value_eur: number | null;
    stage: string;
    contact_name: string | null;
  } | null;
  agents: WarRoomAgent[];
  activity: WarRoomActivity[];
}

export default async function WarRoomPage() {
  const supabase = await createClient();

  const [
    { data: rawWarRooms, error: wrErr },
    { data: agents, error: agentsErr },
    { data: leads, error: leadsErr },
  ] = await Promise.all([
    supabase
      .from("war_rooms")
      .select(
        "*, lead:pipeline_leads(id, company_name, deal_value_eur, stage, contact_name), agents:war_room_agents(id, agent_id, role, agent:agents(id, slug, name, type, status)), activity:war_room_activity(id, agent_id, action, detail, created_at, agent:agents(slug, name))"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("agents").select("id, slug, name, type, status").order("slug"),
    supabase
      .from("pipeline_leads")
      .select("id, company_name, deal_value_eur, stage")
      .not("stage", "in", "(closed_won,closed_lost,disqualified)")
      .order("deal_value_eur", { ascending: false })
      .limit(20),
  ]);

  if (wrErr || agentsErr) {
    return (
      <div className="p-8 text-red-400">Failed to load war room data.</div>
    );
  }

  const warRooms = (rawWarRooms ?? []) as unknown as WarRoom[];
  const activeRooms = warRooms.filter((r) => r.status === "active");
  const resolvedRooms = warRooms.filter((r) => r.status === "resolved");
  const archivedRooms = warRooms.filter((r) => r.status === "archived");

  const totalDealValue = activeRooms.reduce(
    (sum, r) => sum + (r.lead?.deal_value_eur ?? 0),
    0
  );
  const totalAgentsInvolved = new Set(
    activeRooms.flatMap((r) => r.agents.map((a) => a.agent_id))
  ).size;

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="war_rooms" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-50">
            <Shield className="h-7 w-7 text-red-400" />
            War Room
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Multi-agent deal collaboration. All relevant agents work
            simultaneously on high-value opportunities.
          </p>
        </div>
        <WarRoomCreateButton
          agents={agents ?? []}
          leads={leads ?? []}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Shield className="h-3.5 w-3.5 text-red-400" />
              Active Rooms
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {activeRooms.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Target className="h-3.5 w-3.5" />
              Deal Value
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {new Intl.NumberFormat("en-EU", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(totalDealValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Users className="h-3.5 w-3.5" />
              Agents Involved
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {totalAgentsInvolved}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Resolved
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {resolvedRooms.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active War Rooms */}
      {activeRooms.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Active Operations
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {activeRooms.map((room) => (
              <WarRoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolvedRooms.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Resolved
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {resolvedRooms.map((room) => (
              <WarRoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {warRooms.length === 0 && (
        <Card className="border-dashed border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex flex-col items-center py-12">
            <Shield className="h-12 w-12 text-zinc-700" />
            <h3 className="mt-4 text-lg font-medium text-zinc-400">
              No war rooms yet
            </h3>
            <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
              War rooms enable multi-agent collaboration on high-value deals.
              Instead of sequential handoffs, all relevant agents — AE, Legal,
              Finance, MI — work simultaneously on the deal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
