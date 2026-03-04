import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default async function KnowledgePage() {
  const supabase = await createClient();

  const [dealRes, onboardingRes] = await Promise.all([
    supabase
      .from("deal_learnings")
      .select("*, leads!inner(company_name, sector)")
      .order("created_at", { ascending: false }),
    supabase
      .from("onboarding_patterns")
      .select("*, clients!inner(company_name)")
      .order("created_at", { ascending: false }),
  ]);

  const deals = dealRes.data ?? [];
  const onboarding = onboardingRes.data ?? [];

  const winRate = deals.length
    ? Math.round(
        (deals.filter((d) => d.outcome === "won").length / deals.length) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Knowledge Base</h1>
        <p className="text-sm text-zinc-400">
          Commercial intelligence from {deals.length} deals and{" "}
          {onboarding.length} onboarding cycles
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Win Rate</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">{winRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Avg. Deal Velocity</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {deals.length
                ? Math.round(
                    deals
                      .filter((d) => d.deal_velocity_days)
                      .reduce((s, d) => s + (d.deal_velocity_days ?? 0), 0) /
                      Math.max(
                        deals.filter((d) => d.deal_velocity_days).length,
                        1
                      )
                  )
                : 0}
              d
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Competitor Wins Against Us</p>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {deals.filter((d) => d.competitor_involved && d.outcome === "lost").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deals">
        <TabsList className="border-zinc-800 bg-zinc-900">
          <TabsTrigger value="deals">Deal Learnings</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="mt-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Company</TableHead>
                  <TableHead className="text-zinc-400">Outcome</TableHead>
                  <TableHead className="text-zinc-400">Sector</TableHead>
                  <TableHead className="text-zinc-400">Velocity</TableHead>
                  <TableHead className="text-zinc-400">Key Learning</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={6} className="text-center text-zinc-500">
                      No deal learnings recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  deals.map((d) => (
                    <TableRow key={d.id} className="border-zinc-800">
                      <TableCell className="text-zinc-50">
                        {(d.leads as unknown as { company_name: string }).company_name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.outcome} />
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {(d.leads as unknown as { sector: string | null }).sector ?? "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {d.deal_velocity_days ? `${d.deal_velocity_days}d` : "—"}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-zinc-300">
                        {d.key_learning}
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {format(new Date(d.created_at), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Company</TableHead>
                  <TableHead className="text-zinc-400">Day 30 Health</TableHead>
                  <TableHead className="text-zinc-400">Time to Value</TableHead>
                  <TableHead className="text-zinc-400">Escalations</TableHead>
                  <TableHead className="text-zinc-400">Key Learning</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboarding.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={6} className="text-center text-zinc-500">
                      No onboarding patterns recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  onboarding.map((o) => (
                    <TableRow key={o.id} className="border-zinc-800">
                      <TableCell className="text-zinc-50">
                        {(o.clients as unknown as { company_name: string }).company_name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.health_at_day30} />
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {o.time_to_value_days ? `${o.time_to_value_days}d` : "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {o.escalations}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-zinc-300">
                        {o.key_learning}
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {format(new Date(o.created_at), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
