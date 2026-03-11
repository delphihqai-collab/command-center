import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

interface WarRoom {
  id: string;
  name: string;
  status: string;
  priority: string;
  objective: string | null;
  type: string | null;
  created_at: string;
  resolved_at: string | null;
  lead: {
    id: string;
    company_name: string;
    deal_value_eur: number | null;
  } | null;
  agents: {
    agent_id: string;
    role: string;
    agent: { slug: string; name: string } | null;
  }[];
}

export function OperationsList({ rooms }: { rooms: WarRoom[] }) {
  const active = rooms.filter((r) => r.status === "active");
  const resolved = rooms.filter((r) => r.status === "resolved");

  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-zinc-700" />
        <p className="mt-3 text-sm text-zinc-500">No operations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Shield className="h-3.5 w-3.5 text-red-400" />
            Active ({active.length})
          </h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {active.map((room) => (
              <OperationCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Resolved ({resolved.length})
          </h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {resolved.map((room) => (
              <OperationCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OperationCard({ room }: { room: WarRoom }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-50">{room.name}</p>
            {room.lead && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {room.lead.company_name}
                {room.lead.deal_value_eur && ` \u00B7 \u20AC${room.lead.deal_value_eur.toLocaleString("en")}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={room.priority} />
            <StatusBadge status={room.status} />
          </div>
        </div>
        {room.objective && (
          <p className="mt-2 text-xs text-zinc-400">{room.objective}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5">
          {room.agents.map((a) => (
            <span
              key={a.agent_id}
              className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              {a.agent?.name ?? "?"}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          {formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
