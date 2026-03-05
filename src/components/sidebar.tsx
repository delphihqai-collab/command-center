"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Bot,
  Bell,
  MessageSquare,
  DollarSign,
  Monitor,
  Brain,
  ScrollText,
  ClipboardList,
  Server,
  Settings,
  LogOut,
  KanbanSquare,
  Radio,
  Megaphone,
  Webhook,
  GitBranch,
  Clock,
  BellRing,
  Plug,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/office", label: "The Office", icon: Building2 },
  { href: "/agents", label: "Agent Squad", icon: Bot },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/comms", label: "Agent Comms", icon: Radio },
  { href: "/standup", label: "Standup", icon: Megaphone },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/sessions", label: "Sessions", icon: Monitor },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/cron", label: "Scheduler", icon: Clock },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/gateway", label: "Gateway", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
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
        </nav>

        <div className="border-t border-zinc-800 p-2">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50"
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
