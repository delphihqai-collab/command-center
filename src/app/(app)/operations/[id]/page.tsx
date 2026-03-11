import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Activity,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OperationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: operation, error } = await supabase
    .from("war_rooms")
    .select(
      "*, lead:pipeline_leads(id, company_name, deal_value_eur, stage, contact_name), agents:war_room_agents(id, agent_id, role, agent:agents(id, slug, name, type, status)), activity:war_room_activity(id, agent_id, action, detail, metadata, created_at, agent:agents(id, slug, name))"
    )
    .eq("id", id)
    .single();

  if (error || !operation) notFound();

  // Sort activity chronologically
  const activities = (operation.activity ?? []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const assignedAgents = operation.agents ?? [];
  const isActive = operation.status === "active";
  const lead = operation.lead as {
    id: string;
    company_name: string;
    deal_value_eur: number | null;
    stage: string;
    contact_name: string | null;
  } | null;

  return (
    <div className="space-y-6 p-6">
      <RealtimeRefresh table="war_room_activity" />

      {/* Breadcrumb */}
      <div>
        <Link
          href="/operations"
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← Operations
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-bold text-zinc-50">
            {isActive ? (
              <Activity className="h-6 w-6 text-indigo-400" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            )}
            {operation.name}
          </h1>
          {operation.objective && (
            <p className="mt-1 text-sm text-zinc-400">{operation.objective}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {operation.priority && operation.priority !== "standard" && (
            <Badge
              variant="outline"
              className={
                operation.priority === "critical"
                  ? "border-red-700 text-red-400"
                  : operation.priority === "high"
                    ? "border-amber-700 text-amber-400"
                    : "border-zinc-700 text-zinc-400"
              }
            >
              {operation.priority}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={
              isActive
                ? "border-emerald-700 text-emerald-400"
                : "border-zinc-700 text-zinc-500"
            }
          >
            {operation.status}
          </Badge>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Started{" "}
          {formatDistanceToNow(new Date(operation.created_at), {
            addSuffix: true,
          })}
        </span>
        {operation.resolved_at && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Resolved{" "}
            {formatDistanceToNow(new Date(operation.resolved_at), {
              addSuffix: true,
            })}
          </span>
        )}
        {operation.type && (
          <span className="rounded bg-zinc-800 px-1.5 py-0.5">
            {operation.type}
          </span>
        )}
      </div>

      {/* Linked Lead */}
      {lead && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">
                {lead.company_name}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                {lead.contact_name && <span>{lead.contact_name}</span>}
                <Badge
                  variant="outline"
                  className="border-zinc-700 text-zinc-400"
                >
                  {lead.stage}
                </Badge>
              </div>
            </div>
            {lead.deal_value_eur && (
              <span className="text-sm font-medium text-emerald-400">
                €{lead.deal_value_eur.toLocaleString("en")}
              </span>
            )}
            <Link
              href={`/pipeline/${lead.id}`}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View lead
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Assigned Agents */}
      {assignedAgents.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Assigned Agents ({assignedAgents.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {assignedAgents.map(
              (wa: {
                id: string;
                role: string;
                agent: {
                  id: string;
                  slug: string;
                  name: string;
                  type: string;
                  status: string;
                } | null;
              }) =>
                wa.agent && (
                  <Link key={wa.id} href={`/agents/${wa.agent.slug}`}>
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:border-zinc-600"
                    >
                      <Bot className="mr-1 h-3 w-3" />
                      {wa.agent.name}
                      {wa.role === "lead" && (
                        <span className="ml-1 text-indigo-400">★</span>
                      )}
                    </Badge>
                  </Link>
                )
            )}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Activity Timeline ({activities.length})
        </h2>
        {activities.length > 0 ? (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-zinc-800" />

            {activities.map(
              (event: {
                id: string;
                action: string;
                detail: string | null;
                created_at: string;
                agent: {
                  id: string;
                  slug: string;
                  name: string;
                } | null;
              }) => {
                const isUserMsg = event.action === "user_message";
                const isHermesResponse = event.action === "hermes_response";
                const isSystem =
                  !isUserMsg &&
                  !isHermesResponse &&
                  !event.agent;

                return (
                  <div key={event.id} className="relative flex gap-3 py-2 pl-0">
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 ${
                        isUserMsg
                          ? "border-zinc-600 bg-zinc-800"
                          : isHermesResponse
                            ? "border-indigo-600 bg-indigo-950"
                            : event.agent
                              ? "border-zinc-700 bg-zinc-900"
                              : "border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      {isUserMsg ? (
                        <User className="h-3 w-3 text-zinc-400" />
                      ) : event.agent || isHermesResponse ? (
                        <Bot className="h-3 w-3 text-indigo-400" />
                      ) : (
                        <Activity className="h-3 w-3 text-zinc-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-300">
                          {isUserMsg
                            ? "You"
                            : event.agent?.name ?? "System"}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {format(
                            new Date(event.created_at),
                            "HH:mm:ss"
                          )}
                        </span>
                        {!isUserMsg && !isHermesResponse && !isSystem && (
                          <Badge
                            variant="outline"
                            className="border-zinc-800 text-[10px] text-zinc-500"
                          >
                            {event.action}
                          </Badge>
                        )}
                      </div>
                      {event.detail && (
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-400">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <Card className="border-dashed border-zinc-800 bg-zinc-900/50">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-zinc-700" />
              <p className="mt-2 text-sm text-zinc-500">
                No activity recorded yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
