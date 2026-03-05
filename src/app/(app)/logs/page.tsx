import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { LogViewer } from "./_components/log-viewer";

export default async function LogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-8 w-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Log Viewer</h1>
          <p className="text-sm text-zinc-400">
            OpenClaw gateway &amp; system journal
          </p>
        </div>
      </div>

      <LogViewer />
    </div>
  );
}
