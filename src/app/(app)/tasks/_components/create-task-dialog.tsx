"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createTask } from "../actions";
import { toast } from "sonner";
import { TASK_PRIORITIES } from "@/lib/types";

interface Props {
  agents: { id: string; name: string; slug: string }[];
  projects: { id: string; name: string; slug: string; ticket_prefix: string }[];
}

export function CreateTaskDialog({ agents, projects }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createTask({
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
        priority: (fd.get("priority") as string) || "medium",
        assigned_to: (fd.get("assigned_to") as string) || null,
        project_id: (fd.get("project_id") as string) || null,
        due_date: (fd.get("due_date") as string) || null,
        labels: [],
      });

      if (result.success) {
        toast.success("Task created");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              name="title"
              placeholder="Task title"
              required
              className="border-zinc-800 bg-zinc-950 text-zinc-50"
            />
          </div>
          <div>
            <Textarea
              name="description"
              placeholder="Description (optional)"
              rows={3}
              className="border-zinc-800 bg-zinc-950 text-zinc-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Priority</label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Project</label>
              <Select name="project_id">
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-300">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Assign to</label>
              <Select name="assigned_to">
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-zinc-300">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Due date</label>
              <Input
                name="due_date"
                type="date"
                className="border-zinc-800 bg-zinc-950 text-zinc-300"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? "Creating…" : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
