"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toggleWebhook, deleteWebhook } from "../actions";
import { toast } from "sonner";

interface Props {
  mode: "create" | "manage";
  webhookId?: string;
  enabled?: boolean;
}

export function WebhookActions({ mode, webhookId, enabled }: Props) {
  const [isPending, startTransition] = useTransition();

  if (mode === "create") {
    return (
      <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm" disabled>
        <Plus className="mr-1.5 h-4 w-4" />
        New Webhook
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!webhookId) return;
          startTransition(async () => {
            const result = await toggleWebhook(webhookId, !enabled);
            if (!result.success) toast.error(result.error);
          });
        }}
        className="text-zinc-400 hover:text-zinc-50"
      >
        {enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!webhookId) return;
          startTransition(async () => {
            const result = await deleteWebhook(webhookId);
            if (result.success) toast.success("Webhook deleted");
            else toast.error(result.error);
          });
        }}
        className="text-zinc-400 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
