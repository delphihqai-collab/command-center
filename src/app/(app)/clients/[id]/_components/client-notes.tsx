"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addClientNote } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface Note {
  id: string;
  content: string;
  author: string;
  created_at: string;
}

export function ClientNotes({
  clientId,
  notes,
}: {
  clientId: string;
  notes: Note[];
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addClientNote(clientId, content.trim());
      if (result.success) {
        setContent("");
        toast.success("Note added");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-zinc-500">No notes yet.</p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-md border border-zinc-800 bg-zinc-950 p-3"
              >
                <p className="text-sm text-zinc-300">{note.content}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span>{note.author}</span>
                  <span>·</span>
                  <span>{format(new Date(note.created_at), "dd MMM yyyy HH:mm")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
