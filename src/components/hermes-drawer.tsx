"use client";

import { useState, useEffect } from "react";
import { Bot, X } from "lucide-react";
import { HermesChat } from "@/app/(app)/command/_components/hermes-chat";

export function HermesDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    {
      id: string;
      action: string;
      detail: string | null;
      created_at: string;
      agent: { slug: string; name: string } | null;
    }[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  // Listen for open-hermes events from quick actions
  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("open-hermes", handleOpen);
    return () => window.removeEventListener("open-hermes", handleOpen);
  }, []);

  // Load chat history when opened for the first time
  useEffect(() => {
    if (!open || loaded) return;
    async function load() {
      try {
        const res = await fetch("/api/war-rooms?type=chat_messages");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch {
        // silent
      }
      setLoaded(true);
    }
    load();
  }, [open, loaded]);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700 md:bottom-6"
        aria-label="Talk to Hermes"
      >
        <Bot className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-950 text-indigo-400">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-zinc-50">Hermes</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {open && <HermesChat initialMessages={messages} />}
        </div>
      </div>
    </>
  );
}
