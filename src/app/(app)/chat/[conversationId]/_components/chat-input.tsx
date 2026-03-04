"use client";

import { useState, useTransition } from "react";
import { sendMessage } from "../actions";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

export function ChatInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    if (!content.trim()) return;
    const msg = content;
    setContent("");
    startTransition(async () => {
      const result = await sendMessage(conversationId, msg);
      if (!result.success) {
        toast.error(result.error);
        setContent(msg);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 border-t border-zinc-800 pt-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
        className="flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-600 focus:outline-none"
      />
      <Button
        onClick={handleSend}
        disabled={isPending || !content.trim()}
        className="self-end bg-indigo-600 hover:bg-indigo-700"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
