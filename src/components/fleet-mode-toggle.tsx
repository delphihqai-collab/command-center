"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODES = [
  { id: "active", label: "Active", color: "bg-emerald-500" },
  { id: "paused", label: "Paused", color: "bg-amber-500" },
  { id: "stopped", label: "Stopped", color: "bg-red-500" },
] as const;

type FleetMode = (typeof MODES)[number]["id"];

export function FleetModeToggle() {
  const [mode, setMode] = useState<FleetMode>("active");
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/fleet/mode")
      .then((r) => r.json())
      .then((d: { mode: string }) => {
        if (d.mode === "active" || d.mode === "paused" || d.mode === "stopped") {
          setMode(d.mode);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function handleChange(newMode: FleetMode) {
    if (newMode === mode || pending) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/fleet/mode", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: newMode }),
        });
        if (!res.ok) throw new Error("Failed to update mode");
        setMode(newMode);
        toast.success(`Fleet mode set to ${newMode}`);
      } catch {
        toast.error("Failed to change fleet mode");
      }
    });
  }

  if (!loaded) return null;

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", currentMode.color)} />
      <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => handleChange(m.id)}
            disabled={pending}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
              mode === m.id
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
