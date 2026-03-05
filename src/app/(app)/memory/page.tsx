import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Brain } from "lucide-react";
import { MemoryBrowser } from "./_components/memory-browser";

export default async function MemoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Memory Browser</h1>
          <p className="text-sm text-zinc-400">
            Browse agent memory files without SSH
          </p>
        </div>
      </div>

      <MemoryBrowser />
    </div>
  );
}
