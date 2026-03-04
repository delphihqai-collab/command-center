"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Target,
  Users,
  FileText,
  Receipt,
  Bot,
  ShieldCheck,
  Bell,
  MessageSquare,
  DollarSign,
  BarChart3,
  BookOpen,
  Monitor,
  Brain,
  ScrollText,
  ClipboardList,
  Server,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/office", label: "The Office", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: Target },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/sessions", label: "Sessions", icon: Monitor },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/gateway", label: "Gateway", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Target },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
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
              <span className="text-xs font-bold text-white">D</span>
            </div>
            <span className="text-sm font-semibold text-zinc-50">
              Command Center
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
