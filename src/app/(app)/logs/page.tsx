import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { LogViewer } from "./_components/log-viewer";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-8 w-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Log Viewer</h1>
          <p className="text-sm text-zinc-400">
            Agent logs &amp; system journal
          </p>
        </div>
      </div>

      <LogViewer agents={agents ?? []} initialAgent={params.agent ?? null} />
    </div>
  );
}
