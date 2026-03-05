"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAsRead, markAllRead } from "../actions";
import { toast } from "sonner";

export function NotificationActions({
  mode,
  id,
}: {
  mode: "mark-one" | "mark-all";
  id?: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (mode === "mark-all") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await markAllRead();
            if (!res.success) toast.error(res.error);
            else toast.success("All marked as read");
          })
        }
      >
        Mark All Read
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          if (!id) return;
          const res = await markAsRead(id);
          if (!res.success) toast.error(res.error);
        })
      }
    >
      ✓
    </Button>
  );
}
