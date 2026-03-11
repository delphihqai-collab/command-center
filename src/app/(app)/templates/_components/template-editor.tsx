"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function TemplateEditor() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("outreach");
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Extract {variables} from body
  const variables = [...new Set((body.match(/\{(\w+)\}/g) ?? []).map((v) => v.slice(1, -1)))];

  const handleCreate = () => {
    if (!name.trim() || !body.trim()) {
      toast.error("Name and body are required");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, channel, subject: subject || undefined, body, variables }),
      });

      if (!res.ok) {
        toast.error("Failed to create template");
        return;
      }

      toast.success("Template created");
      setOpen(false);
      setName("");
      setSubject("");
      setBody("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-indigo-600 text-sm hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Create Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cold outreach — SaaS"
              className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
              >
                <option value="outreach">Outreach</option>
                <option value="follow_up">Follow Up</option>
                <option value="meeting">Meeting</option>
                <option value="proposal">Proposal</option>
                <option value="nurture">Nurture</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
              >
                <option value="email">Email</option>
                <option value="linkedin">LinkedIn</option>
                <option value="discord">Discord</option>
              </select>
            </div>
          </div>
          {channel === "email" && (
            <div>
              <label className="text-xs font-medium text-zinc-400">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-50"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-zinc-400">
              Body <span className="text-zinc-600">— use {"{variable}"} for placeholders</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Hi {name}, I noticed {company} recently..."
              className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-50 placeholder:text-zinc-600"
            />
          </div>
          {variables.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <span key={v} className="rounded bg-indigo-950 px-2 py-0.5 text-xs text-indigo-400">
                  {"{" + v + "}"}
                </span>
              ))}
            </div>
          )}
          <Button
            onClick={handleCreate}
            disabled={isPending || !name.trim() || !body.trim()}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
