import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const PIPELINE_STAGES = [
  "prospecting",
  "qualification",
  "initial_contact",
  "demo",
  "needs_analysis",
  "proposal_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();

  // Parallel data fetching
  const [leadsRes, flagsRes, approvalsRes, agentsRes] = await Promise.all([
    supabase
      .from("leads")
      .select("stage")
      .is("archived_at", null),
    supabase
      .from("agent_reports")
      .select("id, agent_id, report_type, content, flag_level, related_entity_type, related_entity_id, created_at, agents!inner(name)")
      .eq("flagged", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("approvals")
      .select("id, urgency, action_summary, recipient, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("agents")
      .select("id, slug, name, status, model, updated_at")
      .order("slug"),
  ]);

  const leads = leadsRes.data ?? [];
  const flags = flagsRes.data ?? [];
  const approvals = approvalsRes.data ?? [];
  const agents = agentsRes.data ?? [];

  // Count leads per stage
  const stageCounts = PIPELINE_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = leads.filter((l) => l.stage === stage).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalActive = leads.filter(
    (l) => l.stage !== "closed_won" && l.stage !== "closed_lost"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Operational overview — {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Section 1: Pipeline Summary */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Pipeline — {totalActive} active leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 xl:grid-cols-9">
            {PIPELINE_STAGES.map((stage) => (
              <Link
                key={stage}
                href={`/pipeline?stage=${stage}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-center transition-colors hover:border-zinc-700"
              >
                <div className="text-2xl font-bold text-zinc-50">
                  {stageCounts[stage]}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {stage.replace(/_/g, " ")}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 2: Critical Flags */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              Critical Flags
              {flags.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1.5 text-xs font-medium text-red-400">
                  {flags.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flags.length === 0 ? (
              <p className="text-sm text-zinc-500">No critical flags.</p>
            ) : (
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <StatusBadge status={flag.flag_level ?? "MEDIUM"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-50">
                        {(flag.agents as unknown as { name: string })?.name}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {typeof flag.content === "object" && flag.content !== null && "summary" in flag.content
                          ? String((flag.content as Record<string, unknown>).summary)
                          : flag.report_type}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Open Approvals */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              Open Approvals
              {approvals.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-medium text-amber-400">
                  {approvals.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 ? (
              <p className="text-sm text-zinc-500">No open approvals.</p>
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <Link
                    key={approval.id}
                    href="/approvals"
                    className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
                  >
                    <StatusBadge status={approval.urgency} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-50">
                        {approval.action_summary}
                      </p>
                      {approval.recipient && (
                        <p className="text-xs text-zinc-400">
                          {approval.recipient}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Agent Status */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-50">
                    {agent.name}
                  </span>
                  <StatusBadge status={agent.status} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-500">
                    {agent.model}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
