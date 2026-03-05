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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { createWebhook } from "../actions";
import { toast } from "sonner";

const WEBHOOK_EVENTS = [
  "task.created",
  "task.updated",
  "task.completed",
  "agent.status_changed",
  "agent.heartbeat",
  "session.started",
  "session.completed",
  "alert.triggered",
] as const;

export function CreateWebhookDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (selectedEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    startTransition(async () => {
      const result = await createWebhook({
        name: fd.get("name") as string,
        url: fd.get("url") as string,
        secret: fd.get("secret") as string,
        events: selectedEvents,
        enabled: true,
      });

      if (result.success) {
        toast.success("Webhook created");
        setOpen(false);
        setSelectedEvents([]);
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
          New Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Create Webhook</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Name</label>
            <Input
              name="name"
              placeholder="My webhook"
              required
              className="border-zinc-800 bg-zinc-950 text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">URL</label>
            <Input
              name="url"
              type="url"
              placeholder="https://example.com/webhook"
              required
              className="border-zinc-800 bg-zinc-950 text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Secret</label>
            <Input
              name="secret"
              type="password"
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="border-zinc-800 bg-zinc-950 text-zinc-50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-400">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event}
                  className="flex items-center gap-2 text-xs text-zinc-300"
                >
                  <Checkbox
                    checked={selectedEvents.includes(event)}
                    onCheckedChange={() => toggleEvent(event)}
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? "Creating…" : "Create Webhook"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
