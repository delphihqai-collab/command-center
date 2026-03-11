import { createClient } from "@/lib/supabase/server";
import { TemplateGrid } from "./_components/template-grid";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("outreach_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Templates</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Outreach message templates with performance tracking
        </p>
      </div>
      <TemplateGrid templates={templates ?? []} />
    </div>
  );
}
