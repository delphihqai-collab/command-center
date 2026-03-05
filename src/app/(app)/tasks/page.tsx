import { createClient } from "@/lib/supabase/server";
import { TASK_STATUSES } from "@/lib/types";
import { TaskKanban } from "./_components/task-kanban";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function TasksPage() {
  const supabase = await createClient();

  const [tasksRes, agentsRes, projectsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assigned_agent:assigned_to(id, name, slug)")
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase.from("agents").select("id, name, slug").order("name"),
    supabase.from("projects").select("id, name, slug, ticket_prefix").is("archived_at", null).order("name"),
  ]);

  const tasks = tasksRes.data ?? [];
  const agents = agentsRes.data ?? [];
  const projects = projectsRes.data ?? [];

  const columns = Object.fromEntries(
    TASK_STATUSES.map((status) => [
      status,
      tasks.filter((t) => t.status === status),
    ])
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Tasks</h1>
        <p className="text-sm text-zinc-400">
          {tasks.length} active tasks across {TASK_STATUSES.length} columns
        </p>
      </div>
      <TaskKanban columns={columns} agents={agents} projects={projects} />
      <RealtimeRefresh table="tasks" />
    </div>
  );
}
