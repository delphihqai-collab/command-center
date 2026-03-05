import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function CommsPage() {
  const supabase = await createClient();

  const { data: comms } = await supabase
    .from("agent_comms")
    .select("id, message, channel, metadata, created_at, from_agent:from_agent_id(name, slug), to_agent:to_agent_id(name, slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  const messages = comms ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Agent Comms</h1>
        <p className="text-sm text-zinc-400">
          Inter-agent messaging feed
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Recent Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const from = m.from_agent as unknown as { name: string; slug: string } | null;
                const to = m.to_agent as unknown as { name: string; slug: string } | null;
                return (
                  <div
                    key={m.id}
                    className="rounded border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-indigo-400">
                        {from?.name ?? "Unknown"}
                      </span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-zinc-400">
                        {to?.name ?? "broadcast"}
                      </span>
                      {m.channel && m.channel !== "general" && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">
                          #{m.channel}
                        </span>
                      )}
                      <span className="ml-auto text-zinc-500">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-300">
                      {m.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <RealtimeRefresh table="agent_comms" />
    </div>
  );
}
