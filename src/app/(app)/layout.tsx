import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-950 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-end border-b border-zinc-800 px-6 py-2">
          <div className="flex items-center gap-2">
            <kbd className="hidden rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline-block">
              ⌘K
            </kbd>
            <ThemeToggle />
          </div>
        </div>
        <div className="p-6 pb-20 md:pb-6">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
