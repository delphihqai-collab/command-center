"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Bot,
  Bell,
  DollarSign,
  Monitor,
  Brain,
  ScrollText,
  ClipboardList,
  Server,
  Settings,
  LogOut,
  Webhook,
  Clock,
  Plug,
  GitBranchPlus,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/pipeline", label: "Pipeline", icon: GitBranchPlus },
      { href: "/sessions", label: "Sessions", icon: Monitor },
      { href: "/office", label: "Office", icon: Building2 },
    ],
  },
  {
    label: "OBSERVE",
    items: [
      { href: "/logs", label: "Logs", icon: ScrollText },
      { href: "/costs", label: "Tokens", icon: DollarSign },
      { href: "/memory", label: "Memory", icon: Brain },
    ],
  },
  {
    label: "AUTOMATE",
    items: [
      { href: "/cron", label: "Cron", icon: Clock },
      { href: "/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { href: "/audit-log", label: "Audit", icon: ClipboardList },
      { href: "/gateway", label: "Gateways", icon: Server },
      { href: "/integrations", label: "Integrations", icon: Plug },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: GitBranchPlus },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/office", label: "Office", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <span className="text-xs font-bold text-white">MC</span>
            </div>
            <span className="text-sm font-semibold text-zinc-50">
              Mission Control
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-hidden px-2 py-3">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label ?? "core"}>
              {groupIndex > 0 && (
                <div className="mx-2 my-2 border-t border-zinc-800" />
              )}
              {group.label && (
                <p className="mb-1 mt-2 px-3 text-[10px] font-semibold tracking-wider text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-[7px] text-sm transition-colors",
                        isActive
                          ? "bg-zinc-800 text-zinc-50"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-2">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-[7px] text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-800 bg-zinc-950 py-2 md:hidden">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2",
                isActive ? "text-indigo-400" : "text-zinc-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
