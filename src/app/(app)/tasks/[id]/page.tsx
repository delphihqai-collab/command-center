import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { TaskCommentForm } from "../_components/task-comment-form";
import { TaskReviewForm } from "../_components/task-review-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*, assigned_agent:assigned_to(id, name, slug), project:project_id(id, name, slug)")
    .eq("id", id)
    .single();

  if (!task) notFound();

  const [commentsRes, reviewsRes] = await Promise.all([
    supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("quality_reviews")
      .select("*")
      .eq("task_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const comments = commentsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const agent = task.assigned_agent as unknown as { id: string; name: string; slug: string } | null;
  const project = task.project as unknown as { id: string; name: string; slug: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tasks" className="text-sm text-zinc-400 hover:text-zinc-50">
          ← Tasks
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-50">{task.title}</h1>
          <StatusBadge status={task.status} />
          <StatusBadge status={task.priority} />
        </div>
        {task.ticket_ref && (
          <p className="mt-1 font-mono text-sm text-zinc-500">{task.ticket_ref}</p>
        )}
      </div>

      {/* Info */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <StatusBadge status={task.status} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Priority</p>
              <StatusBadge status={task.priority} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Assigned To</p>
              {agent ? (
                <Link href={`/agents/${agent.slug}`} className="text-sm text-indigo-400 hover:underline">
                  {agent.name}
                </Link>
              ) : (
                <p className="text-sm text-zinc-400">Unassigned</p>
              )}
            </div>
            {project && (
              <div>
                <p className="text-xs text-zinc-500">Project</p>
                <p className="text-sm text-zinc-50">{project.name}</p>
              </div>
            )}
            {task.due_date && (
              <div>
                <p className="text-xs text-zinc-500">Due Date</p>
                <p className="text-sm text-zinc-50">
                  {format(new Date(task.due_date), "dd MMM yyyy")}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="text-sm text-zinc-400">
                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {task.description && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-xs text-zinc-500">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                {task.description}
              </p>
            </div>
          )}
          {task.labels && (task.labels as string[]).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-zinc-500">Labels</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(task.labels as string[]).map((label) => (
                  <span
                    key={label}
                    className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Reviews */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Quality Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-500">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-zinc-500">{r.reviewer}</span>
                    <span className="ml-auto text-xs text-zinc-500">
                      {format(new Date(r.created_at), "dd MMM HH:mm")}
                    </span>
                  </div>
                  {r.notes && <p className="mt-1 text-sm text-zinc-300">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
          {task.status === "review" && (
            <div className="mt-4">
              <TaskReviewForm taskId={task.id} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="mb-4 text-sm text-zinc-500">No comments yet.</p>
          ) : (
            <div className="mb-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-400">{c.author}</span>
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{c.content}</p>
                </div>
              ))}
            </div>
          )}
          <TaskCommentForm taskId={task.id} />
        </CardContent>
      </Card>
    </div>
  );
}
