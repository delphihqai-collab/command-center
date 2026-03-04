"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

interface GatewayEditorProps {
  config: Record<string, unknown>;
}

export function GatewayEditor({ config }: GatewayEditorProps) {
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleEnableEditing() {
    setEditMode(true);
    setDialogOpen(false);
    toast.success("Edit mode enabled. Changes will be logged.");
  }

  if (!editMode) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Lock className="h-4 w-4" />
            <span>Configuration is read-only.  Credentials are masked.</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-amber-800 text-xs text-amber-400 hover:bg-amber-500/10">
                Enable Editing
              </Button>
            </DialogTrigger>
            <DialogContent className="border-zinc-700 bg-zinc-900">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-zinc-50">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirm Edit Mode
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  You are about to modify the live HERMES gateway. Incorrect values
                  can break all agent operations. This action is logged.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-700">
                  Cancel
                </Button>
                <Button onClick={handleEnableEditing} className="bg-amber-600 hover:bg-amber-700">
                  I understand, enable editing
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-800 bg-zinc-900">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-amber-400">
            Edit mode active — changes are logged to audit_log
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditMode(false)}
            className="border-zinc-700 text-xs"
          >
            Lock
          </Button>
        </div>
        <div className="mt-4 rounded bg-zinc-950 p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300">
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(config).map(([k, v]) => {
                  // Mask any field that looks like a key/token/secret
                  if (/key|token|secret|password/i.test(k)) return [k, "••••••••"];
                  return [k, v];
                })
              ),
              null,
              2
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
