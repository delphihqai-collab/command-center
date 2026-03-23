import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SoulEditor } from "../../../agents/[slug]/soul/_components/soul-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FleetAgentSoulPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!agent) notFound();

  const { data: soul } = await supabase
    .from("agent_souls")
    .select("*")
    .eq("agent_id", agent.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/fleet/${agent.slug}`}
          className="text-sm text-zinc-400 hover:text-zinc-50"
        >
          ← {agent.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-50">
          {agent.name} — SOUL
        </h1>
        <p className="text-sm text-zinc-400">
          Define this agent&apos;s personality, capabilities, and behavioral guidelines
        </p>
      </div>
      <SoulEditor agentId={agent.id} content={soul?.content ?? ""} />
    </div>
  );
}
