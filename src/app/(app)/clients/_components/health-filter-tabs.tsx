"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const HEALTH_STATUSES = [
  { value: "", label: "All" },
  { value: "healthy", label: "Healthy" },
  { value: "at_risk", label: "At Risk" },
  { value: "critical", label: "Critical" },
];

export function HealthFilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("health") ?? "";

  function handleFilter(value: string) {
    const params = new URLSearchParams();
    if (value) params.set("health", value);
    router.push(`/clients${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="flex gap-1">
      {HEALTH_STATUSES.map((s) => (
        <Button
          key={s.value}
          variant="outline"
          size="sm"
          onClick={() => handleFilter(s.value)}
          className={`h-7 text-xs ${
            current === s.value
              ? "border-indigo-600 bg-indigo-600/20 text-indigo-400"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-50"
          }`}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
