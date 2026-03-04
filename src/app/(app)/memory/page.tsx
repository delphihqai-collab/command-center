import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { MemoryBrowser } from "./_components/memory-browser";

export default async function MemoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Memory Browser</h1>
          <p className="text-sm text-zinc-400">
            Browse agent memory files without SSH
          </p>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400">
            Select an agent to browse their memory files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MemoryBrowser />
        </CardContent>
      </Card>
    </div>
  );
}
