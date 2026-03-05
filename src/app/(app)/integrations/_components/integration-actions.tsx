"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleIntegration } from "../actions";
import { toast } from "sonner";

export function IntegrationActions({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleIntegration(id, !enabled);
          if (!res.success) toast.error(res.error);
          else toast.success(enabled ? "Disabled" : "Enabled");
        })
      }
    >
      {enabled ? "Disable" : "Enable"}
    </Button>
  );
}
