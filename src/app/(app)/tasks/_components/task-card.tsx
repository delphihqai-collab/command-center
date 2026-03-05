"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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
  task: TaskRow;
  overlay?: boolean;
}

export function TaskCard({ task, overlay }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-md border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-700 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        overlay && "shadow-lg shadow-black/50 ring-1 ring-indigo-500/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-medium text-zinc-50 hover:text-indigo-400 transition-colors leading-tight"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <StatusBadge status={task.priority} className="shrink-0" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {task.ticket_ref && (
          <span className="font-mono text-[10px] text-zinc-500">
            {task.ticket_ref}
          </span>
        )}
        {task.assigned_agent && (
          <span className="text-[10px] text-zinc-400">
            {task.assigned_agent.name}
          </span>
        )}
        {task.due_date && (
          <span className="ml-auto text-[10px] text-zinc-500">
            {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
          </span>
        )}
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label}
              className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
