"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action: string;
  detail: string | null;
  created_at: string;
  agent: { slug: string; name: string } | null;
}

interface Props {
  initialMessages: Activity[];
}

export function HermesChat({ initialMessages }: Props) {
  const [messages, setMessages] = useState<Activity[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || isPending) return;

    // Optimistically add user message
    const optimisticMsg: Activity = {
      id: `temp-${Date.now()}`,
      action: "user_message",
      detail: msg,
      created_at: new Date().toISOString(),
      agent: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    startTransition(async () => {
      const res = await fetch("/api/command/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (data.response) {
        const hermesMsg: Activity = {
          id: `resp-${Date.now()}`,
          action: "hermes_response",
          detail: data.response,
          created_at: new Date().toISOString(),
          agent: { slug: "hermes", name: "Hermes" },
        };
        setMessages((prev) => [...prev, hermesMsg]);
      }

      router.refresh();
    });
  }

  return (
    <div className="flex h-[500px] flex-col rounded-lg border border-zinc-800 bg-zinc-900">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Bot className="mx-auto h-10 w-10 text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">
                Send a command to Hermes
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                &quot;Find fintech companies in DACH&quot; · &quot;What&apos;s the pipeline status?&quot; · &quot;Research Stripe&quot;
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.action === "user_message" && !msg.agent;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-indigo-400">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isUser
                      ? "bg-indigo-600 text-zinc-50"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.detail}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isUser ? "text-indigo-200" : "text-zinc-500"
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-zinc-300">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}
        {isPending && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-indigo-400">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg bg-zinc-800 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Send a command to Hermes..."
            rows={1}
            className="flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-indigo-600 focus:outline-none"
          />
          <Button
            onClick={handleSend}
            disabled={isPending || !input.trim()}
            size="icon"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
