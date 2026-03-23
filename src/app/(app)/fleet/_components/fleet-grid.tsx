"use client";

import Link from "next/link";
import { Bot, Activity, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

interface AgentNode {
  id: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  model: string | null;
  last_seen: string | null;
  operations: { id: string; name: string; type: string | null }[];
}

const AGENT_EMOJIS: Record<string, string> = {
  hermes: "\ud83e\udeb6",
  sdr: "\ud83d\udcde",
  "account-executive": "\ud83e\udd1d",
  "account-manager": "\ud83d\udc65",
  finance: "\ud83d\udcb0",
  legal: "\u2696\ufe0f",
  "market-intelligence": "\ud83d\udd2d",
  "knowledge-curator": "\ud83d\udcda",
};

export function FleetGrid({ agents }: { agents: AgentNode[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {agents.map((agent) => (
        <Link key={agent.id} href={`/fleet/${agent.slug}`}>
          <Card className="h-full border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {AGENT_EMOJIS[agent.slug] ?? "\ud83e\udd16"}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-50">
                      {agent.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500">{agent.type}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Model</span>
                  <span className="font-mono text-zinc-400">
                    {agent.model
                      ? agent.model.replace("claude-", "").replace("-20251001", "")
                      : "—"}
                  </span>
                </div>
                {agent.last_seen && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Last seen</span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(agent.last_seen), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Active operations */}
              {agent.operations.length > 0 && (
                <div className="mt-3 border-t border-zinc-800 pt-2">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase text-zinc-500">
                    <Zap className="h-2.5 w-2.5 text-amber-400" />
                    Active ({agent.operations.length})
                  </p>
                  <div className="space-y-1">
                    {agent.operations.slice(0, 2).map((op) => (
                      <Link
                        key={op.id}
                        href={`/operations/${op.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-750 hover:text-zinc-100"
                      >
                        {op.name}
                      </Link>
                    ))}
                    {agent.operations.length > 2 && (
                      <p className="text-[10px] text-zinc-600">
                        +{agent.operations.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
