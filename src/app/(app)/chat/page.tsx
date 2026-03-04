import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface Props {
  searchParams: Promise<{ agent?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("id, slug, name, status")
    .order("created_at", { ascending: true });

  const { data: conversations } = await supabase
    .from("chat_conversations")
    .select("*, agents!chat_conversations_agent_id_fkey(name, slug)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const allAgents = agents ?? [];
  const allConversations = conversations ?? [];

  const filteredConversations = params.agent
    ? allConversations.filter(
        (c) => (c.agents as unknown as { slug: string } | null)?.slug === params.agent
      )
    : allConversations;

  async function createConversation(formData: FormData) {
    "use server";
    const agentId = formData.get("agent_id") as string;
    if (!agentId) return;

    const sb = await createClient();
    const { data, error } = await sb
      .from("chat_conversations")
      .insert({ agent_id: agentId, title: "New conversation" })
      .select("id")
      .single();

    if (error || !data) return;
    revalidatePath("/chat");
    redirect(`/chat/${data.id}`);
  }

  return (
    <div className="flex gap-6">
      {/* Left: Agent selector + conversations */}
      <div className="w-64 shrink-0 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-zinc-400" />
          <h1 className="text-lg font-semibold text-zinc-50">Chat</h1>
        </div>

        {/* Agent list with new conversation buttons */}
        <div className="space-y-1">
          {allAgents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-zinc-900">
              <Link
                href={`/chat?agent=${agent.slug}`}
                className={`flex-1 text-zinc-300 hover:text-zinc-50 ${
                  params.agent === agent.slug ? "font-medium text-zinc-50" : ""
                }`}
              >
                {agent.name}
              </Link>
              <form action={createConversation}>
                <input type="hidden" name="agent_id" value={agent.id} />
                <button
                  type="submit"
                  className="rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  title={`New chat with ${agent.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ))}
        </div>

        {/* Conversation list */}
        <div className="space-y-1">
          <p className="px-2 text-xs font-medium text-zinc-500">Conversations</p>
          {filteredConversations.length === 0 ? (
            <p className="px-2 text-xs text-zinc-600">No conversations yet</p>
          ) : (
            filteredConversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="block rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
              >
                <span className="block truncate">{c.title ?? "New conversation"}</span>
                <span className="text-xs text-zinc-600">
                  {(c.agents as unknown as { name: string } | null)?.name}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Right: empty state */}
      <div className="flex flex-1 items-center justify-center">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">
              Select an agent and start a conversation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
