"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TASK_STATUSES, type TaskStatus } from "@/lib/types";
import { TaskKanbanColumn } from "./task-kanban-column";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { moveTask } from "../actions";
import { toast } from "sonner";

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
  columns: Record<string, TaskRow[]>;
  agents: { id: string; name: string; slug: string }[];
  projects: { id: string; name: string; slug: string; ticket_prefix: string }[];
}

const columnColors: Record<string, string> = {
  inbox: "border-t-zinc-500",
  backlog: "border-t-zinc-500",
  todo: "border-t-indigo-500",
  in_progress: "border-t-amber-500",
  review: "border-t-purple-500",
  done: "border-t-emerald-500",
};

export function TaskKanban({ columns, agents, projects }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const allTasks = Object.values(columns).flat();
  const activeTask = activeId ? allTasks.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = String(over.id) as TaskStatus;
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    startTransition(async () => {
      const result = await moveTask(taskId, newStatus);
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CreateTaskDialog agents={agents} projects={projects} />
        {isPending && (
          <span className="text-xs text-zinc-500">Updating…</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid auto-cols-[280px] grid-flow-col gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map((status) => (
            <TaskKanbanColumn
              key={status}
              status={status}
              tasks={columns[status] ?? []}
              colorClass={columnColors[status] ?? "border-t-zinc-500"}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
