import {
  Shield,
  Users,
  Target,
  Clock,
  Crown,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

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

const AGENT_EMOJIS: Record<string, string> = {
  hermes: "🪶",
  sdr: "📞",
  "account-executive": "🤝",
  "account-manager": "👥",
  finance: "💰",
  legal: "⚖️",
  "market-intelligence": "🔭",
  "knowledge-curator": "📚",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "border-red-700 text-red-400 bg-red-950/20",
  high: "border-amber-700 text-amber-400 bg-amber-950/20",
  standard: "border-zinc-700 text-zinc-400",
};

const STATUS_BORDERS: Record<string, string> = {
  active: "border-red-800/40",
  resolved: "border-emerald-800/40",
  archived: "border-zinc-800",
};

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lead: Crown,
  participant: Users,
  observer: Eye,
};

export function WarRoomCard({ room }: { room: WarRoom }) {
  const borderColor = STATUS_BORDERS[room.status] ?? "border-zinc-800";
  const recentActivity = (room.activity ?? []).slice(0, 5);

  return (
    <Card className={`${borderColor} bg-zinc-900`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield
              className={`h-4 w-4 ${
                room.status === "active" ? "text-red-400" : "text-emerald-400"
              }`}
            />
            <h3 className="text-sm font-semibold text-zinc-100">
              {room.name}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] ${PRIORITY_COLORS[room.priority] ?? ""}`}
          >
            {room.priority}
          </Badge>
        </div>

        {/* Objective */}
        {room.objective && (
          <p className="mt-2 text-xs text-zinc-400">{room.objective}</p>
        )}

        {/* Linked deal */}
        {room.lead && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
            <Target className="h-4 w-4 shrink-0 text-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-200">
                {room.lead.company_name}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                {room.lead.deal_value_eur && (
                  <span>
                    {new Intl.NumberFormat("en-EU", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(room.lead.deal_value_eur)}
                  </span>
                )}
                <span>{room.lead.stage.replace(/_/g, " ")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Participating agents */}
        <div className="mt-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Team ({room.agents.length})
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {room.agents.map((wa) => {
              if (!wa.agent) return null;
              const RoleIcon = ROLE_ICONS[wa.role] ?? Users;
              return (
                <div
                  key={wa.id}
                  className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5"
                >
                  <span className="text-xs">
                    {AGENT_EMOJIS[wa.agent.slug] ?? "🤖"}
                  </span>
                  <span className="text-[10px] text-zinc-300">
                    {wa.agent.name}
                  </span>
                  <RoleIcon className="h-2.5 w-2.5 text-zinc-600" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        {recentActivity.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Recent Activity
            </p>
            <div className="mt-1.5 space-y-1">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-2 text-[10px]"
                >
                  <Clock className="mt-0.5 h-2.5 w-2.5 shrink-0 text-zinc-600" />
                  <div className="min-w-0 flex-1">
                    <span className="text-zinc-400">
                      {act.agent?.name && (
                        <span className="font-medium text-zinc-300">
                          {act.agent.name}:{" "}
                        </span>
                      )}
                      {act.detail ?? act.action}
                    </span>
                  </div>
                  <span className="shrink-0 text-zinc-600">
                    {formatDistanceToNow(new Date(act.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600">
          <span>
            Created{" "}
            {formatDistanceToNow(new Date(room.created_at), {
              addSuffix: true,
            })}
          </span>
          {room.resolved_at && (
            <span className="text-emerald-500">
              Resolved{" "}
              {formatDistanceToNow(new Date(room.resolved_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
