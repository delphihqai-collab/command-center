import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { ClipboardList } from "lucide-react";

interface Props {
  searchParams: Promise<{ agent?: string; action?: string; from?: string; to?: string }>;
}

async function AuditLogTable({
  agentFilter,
  actionFilter,
  fromDate,
  toDate,
}: {
  agentFilter?: string;
  actionFilter?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (agentFilter) query = query.eq("user_email", agentFilter);
  if (actionFilter) query = query.eq("action", actionFilter);
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate);

  const { data: logs, error } = await query;

  if (error) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-8 text-center text-red-400">
          Failed to load audit log: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-8 text-center text-zinc-500">
          No audit log entries found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Agent/User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Action</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Entity Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Entity ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Changes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry) => (
            <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-900/30">
              <td className="px-4 py-3 text-xs text-zinc-400" title={format(new Date(entry.created_at), "yyyy-MM-dd HH:mm:ss")}>
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </td>
              <td className="px-4 py-3 text-xs text-zinc-300">
                {entry.user_email ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-indigo-400">
                  {entry.action}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-400">
                {entry.entity_type}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                {entry.entity_id.slice(0, 8)}…
              </td>
              <td className="max-w-xs px-4 py-3 text-xs text-zinc-500">
                {entry.new_values ? (
                  <details>
                    <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">
                      View changes
                    </summary>
                    <div className="mt-1 space-y-1">
                      {entry.old_values && (
                        <pre className="whitespace-pre-wrap rounded bg-zinc-950 p-2 text-xs text-red-400">
                          - {JSON.stringify(entry.old_values, null, 2)}
                        </pre>
                      )}
                      <pre className="whitespace-pre-wrap rounded bg-zinc-950 p-2 text-xs text-emerald-400">
                        + {JSON.stringify(entry.new_values, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AuditLogPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-zinc-400" />
        <h1 className="text-2xl font-semibold text-zinc-50">Audit Log</h1>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="agent"
          placeholder="Filter by user email"
          defaultValue={params.agent ?? ""}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-300 placeholder:text-zinc-600"
        />
        <input
          name="action"
          placeholder="Filter by action"
          defaultValue={params.action ?? ""}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-300 placeholder:text-zinc-600"
        />
        <input
          type="date"
          name="from"
          defaultValue={params.from ?? ""}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-300"
        />
        <input
          type="date"
          name="to"
          defaultValue={params.to ?? ""}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-300"
        />
        <button
          type="submit"
          className="h-8 rounded-md bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Filter
        </button>
      </form>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <AuditLogTable
          agentFilter={params.agent}
          actionFilter={params.action}
          fromDate={params.from}
          toDate={params.to}
        />
      </Suspense>
    </div>
  );
}
