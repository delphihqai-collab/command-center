import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChatInput } from "./_components/chat-input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const [convRes, messagesRes] = await Promise.all([
    supabase
      .from("chat_conversations")
      .select("*, agents!chat_conversations_agent_id_fkey(name, slug)")
      .eq("id", conversationId)
      .single(),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (!convRes.data) notFound();
  const conversation = convRes.data;
  const messages = messagesRes.data ?? [];
  const agentName = (conversation.agents as unknown as { name: string } | null)?.name ?? "Agent";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <Link href="/chat" className="text-zinc-400 hover:text-zinc-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-lg font-semibold text-zinc-50">
          {conversation.title ?? "Conversation"}
        </h1>
        <span className="text-sm text-zinc-500">with {agentName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                <p className="mt-1 text-xs opacity-60">
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput conversationId={conversationId} />
    </div>
  );
}
