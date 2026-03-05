"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSoul } from "../actions";
import { toast } from "sonner";

interface Props {
  agentId: string;
  content: string;
}

export function SoulEditor({ agentId, content: initial }: Props) {
  const [content, setContent] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateSoul(agentId, content);
      if (result.success) toast.success("SOUL saved");
      else toast.error(result.error);
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          SOUL Definition (Markdown)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-50"
          placeholder="# Agent Name&#10;&#10;## Role&#10;...&#10;&#10;## Capabilities&#10;...&#10;&#10;## Behavioral Guidelines&#10;..."
        />
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isPending ? "Saving…" : "Save SOUL"}
        </Button>
      </CardContent>
    </Card>
  );
}
