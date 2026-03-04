import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DealLearningForm } from "../../_components/deal-learning-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditKnowledgePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [entryRes, leadsRes] = await Promise.all([
    supabase.from("deal_learnings").select("*").eq("id", id).single(),
    supabase
      .from("leads")
      .select("id, company_name")
      .is("archived_at", null)
      .order("company_name"),
  ]);

  if (!entryRes.data) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/knowledge"
        className="text-sm text-zinc-400 hover:text-zinc-50"
      >
        ← Knowledge Base
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-50">
        Edit Deal Learning
      </h1>
      <DealLearningForm leads={leadsRes.data ?? []} existing={entryRes.data} />
    </div>
  );
}
