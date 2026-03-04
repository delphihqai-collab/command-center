import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { KnowledgeSearch } from "./_components/knowledge-search";
import { LoadMoreButton } from "@/components/load-more-button";
import { decodeCursor, encodeCursor, PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}

async function KnowledgeContent({
  query,
  cursor,
}: {
  query?: string;
  cursor?: string;
}) {
  const supabase = await createClient();

  let dealQuery = supabase
    .from("deal_learnings")
    .select("*, leads!inner(company_name, sector)")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      dealQuery = dealQuery.lt("created_at", decoded.sortValue);
    }
  }

  const [dealRes, onboardingRes] = await Promise.all([
    dealQuery,
    supabase
      .from("onboarding_patterns")
      .select("*, clients!inner(company_name)")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1),
  ]);

  let deals = dealRes.data ?? [];
  let onboarding = onboardingRes.data ?? [];

  // Server-side search filtering
  if (query) {
    const q = query.toLowerCase();
    deals = deals.filter(
      (d) =>
        d.key_learning.toLowerCase().includes(q) ||
        (d.leads as unknown as { company_name: string }).company_name
          .toLowerCase()
          .includes(q) ||
        d.outcome.toLowerCase().includes(q) ||
        d.loss_reason_primary?.toLowerCase().includes(q) ||
        d.competitor_name?.toLowerCase().includes(q) ||
        d.icp_match_quality?.toLowerCase().includes(q)
    );
    onboarding = onboarding.filter(
      (o) =>
        o.key_learning.toLowerCase().includes(q) ||
        (o.clients as unknown as { company_name: string }).company_name
          .toLowerCase()
          .includes(q) ||
        o.day7_signals?.toLowerCase().includes(q)
    );
  }

  const dealHasMore = deals.length > PAGE_SIZE;
  const displayedDeals = dealHasMore ? deals.slice(0, PAGE_SIZE) : deals;
  const nextCursor = dealHasMore
    ? encodeCursor(
        displayedDeals[displayedDeals.length - 1].id,
        displayedDeals[displayedDeals.length - 1].created_at
      )
    : null;

  const displayedOnboarding =
    onboarding.length > PAGE_SIZE
      ? onboarding.slice(0, PAGE_SIZE)
      : onboarding;

  const winRate = displayedDeals.length
    ? Math.round(
        (displayedDeals.filter((d) => d.outcome === "won").length / displayedDeals.length) * 100
      )
    : 0;

  return (
    <>
      <p className="text-sm text-zinc-400">
        Commercial intelligence from {displayedDeals.length} deals and{" "}
        {displayedOnboarding.length} onboarding cycles
        {query && (
          <span className="text-indigo-400"> — filtered by "{query}"</span>
        )}
      </p>

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
              {displayedDeals.length
                ? Math.round(
                    displayedDeals
                      .filter((d) => d.deal_velocity_days)
                      .reduce((s, d) => s + (d.deal_velocity_days ?? 0), 0) /
                      Math.max(
                        displayedDeals.filter((d) => d.deal_velocity_days).length,
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
              {
                displayedDeals.filter(
                  (d) => d.competitor_involved && d.outcome === "lost"
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deals">
        <TabsList className="border-zinc-800 bg-zinc-900">
          <TabsTrigger value="deals">
            Deal Learnings ({displayedDeals.length})
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            Onboarding Patterns ({displayedOnboarding.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="mt-4">
          {displayedDeals.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-8 text-center text-zinc-500">
                No deal learnings found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedDeals.map((d) => (
                <Card key={d.id} className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-50">
                          {
                            (
                              d.leads as unknown as {
                                company_name: string;
                              }
                            ).company_name
                          }
                        </span>
                        <StatusBadge status={d.outcome} />
                        {(
                          d.leads as unknown as { sector: string | null }
                        ).sector && (
                          <span className="text-xs text-zinc-500">
                            {
                              (
                                d.leads as unknown as {
                                  sector: string;
                                }
                              ).sector
                            }
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(d.created_at), "dd MMM yyyy")}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-300">{d.key_learning}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {d.deal_velocity_days && (
                        <span>Velocity: {d.deal_velocity_days}d</span>
                      )}
                      {d.loss_reason_primary && (
                        <span className="text-red-400">
                          Loss: {d.loss_reason_primary}
                        </span>
                      )}
                      {d.competitor_name && (
                        <span>Competitor: {d.competitor_name}</span>
                      )}
                      {d.icp_match_quality && (
                        <span>ICP: {d.icp_match_quality}</span>
                      )}
                    </div>

                    {/* Detail: objections */}
                    {d.objections &&
                      Array.isArray(d.objections) &&
                      d.objections.length > 0 && (
                        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2">
                          <p className="text-xs text-zinc-500">Objections</p>
                          <ul className="mt-1 space-y-0.5 text-xs text-zinc-400">
                            {(d.objections as string[]).map((obj, i) => (
                              <li key={i}>• {String(obj)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {nextCursor && <LoadMoreButton cursor={nextCursor} />}
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          {displayedOnboarding.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-8 text-center text-zinc-500">
                No onboarding patterns found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayedOnboarding.map((o) => (
                <Card key={o.id} className="border-zinc-800 bg-zinc-900">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-50">
                          {
                            (
                              o.clients as unknown as {
                                company_name: string;
                              }
                            ).company_name
                          }
                        </span>
                        <StatusBadge status={o.health_at_day30} />
                      </div>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(o.created_at), "dd MMM yyyy")}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-300">{o.key_learning}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {o.time_to_value_days && (
                        <span>Time to value: {o.time_to_value_days}d</span>
                      )}
                      {o.escalations !== null && (
                        <span>Escalations: {o.escalations}</span>
                      )}
                      {o.day7_signals && (
                        <span>Day 7: {o.day7_signals}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

export default async function KnowledgePage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-50">Knowledge Base</h1>
        <Link
          href="/knowledge/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> New Entry
        </Link>
      </div>

      <Suspense>
        <KnowledgeSearch />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <KnowledgeContent query={params.q} cursor={params.cursor} />
      </Suspense>
    </div>
  );
}
