"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  labels: string[] | null;
  due_date: string | null;
  ticket_ref: string | null;
  assigned_agent: { id: string; name: string; slug: string } | null;
}

interface Props {
  status: string;
  tasks: TaskRow[];
  colorClass: string;
}

function formatColumnLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TaskKanbanColumn({ status, tasks, colorClass }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[400px] flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 border-t-2",
        colorClass,
        isOver && "ring-1 ring-indigo-500/50"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {formatColumnLabel(status)}
        </h3>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-zinc-600">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
