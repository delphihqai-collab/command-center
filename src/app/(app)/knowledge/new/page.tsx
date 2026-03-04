import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DealLearningForm } from "../_components/deal-learning-form";

export default async function NewKnowledgePage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, company_name")
    .is("archived_at", null)
    .order("company_name");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/knowledge"
        className="text-sm text-zinc-400 hover:text-zinc-50"
      >
        ← Knowledge Base
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-50">
        New Deal Learning
      </h1>
      <DealLearningForm leads={leads ?? []} />
    </div>
  );
}
