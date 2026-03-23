"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "scheduler", label: "Scheduler" },
  { id: "logs", label: "Logs" },
  { id: "memory", label: "Memory" },
  { id: "webhooks", label: "Webhooks" },
  { id: "audit", label: "Audit Log" },
  { id: "settings", label: "Settings" },
] as const;

export type SystemTab = (typeof TABS)[number]["id"];

export function SystemTabs({ children }: { children: Record<SystemTab, React.ReactNode> }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = (searchParams.get("tab") as SystemTab) ?? "scheduler";

  function setTab(tab: SystemTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "scheduler") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children[activeTab]}
    </>
  );
}
