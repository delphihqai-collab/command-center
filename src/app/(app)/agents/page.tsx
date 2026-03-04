import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function AgentsPage() {
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("slug");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Agents</h1>
        <p className="text-sm text-zinc-400">
          {agents?.length ?? 0} registered agents
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents?.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.slug}`}>
            <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-50">
                    {agent.name}
                  </h3>
                  <StatusBadge status={agent.status} />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Type</span>
                    <span className="text-zinc-400">{agent.type}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Model</span>
                    <span className="font-mono text-zinc-400">{agent.model}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Slug</span>
                    <span className="font-mono text-zinc-400">{agent.slug}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
