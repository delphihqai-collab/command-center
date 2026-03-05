"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleCronJob, triggerCronJob } from "../actions";
import { toast } from "sonner";

export function CronActions({ id, enabled }: { id: string; enabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await toggleCronJob(id, !enabled);
            if (!res.success) toast.error(res.error);
            else toast.success(enabled ? "Disabled" : "Enabled");
          })
        }
      >
        {enabled ? "Disable" : "Enable"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending || !enabled}
        onClick={() =>
          startTransition(async () => {
            const res = await triggerCronJob(id);
            if (!res.success) toast.error(res.error);
            else toast.success("Triggered");
          })
        }
      >
        Run Now
      </Button>
    </div>
  );
}
