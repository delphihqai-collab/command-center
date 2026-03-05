"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { notifyHermes } from "../actions";
import { toast } from "sonner";

interface Props {
  type: "task" | "pipeline";
  id: string;
}

export function NotifyHermesButton({ type, id }: Props) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await notifyHermes(type, id);
      if (result.success) {
        toast.success("Hermes notified", {
          description: result.data?.response
            ? result.data.response.slice(0, 120)
            : "Hermes received the notification.",
        });
        setSent(true);
      } else {
        toast.error("Failed to notify Hermes", {
          description: result.error,
        });
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending || sent}
      className="gap-2 border-indigo-800 text-indigo-400 hover:bg-indigo-950 hover:text-indigo-300"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {sent ? "Hermes Notified" : "Send to Hermes"}
    </Button>
  );
}
