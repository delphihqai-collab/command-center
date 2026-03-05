"use client";

import { useEffect } from "react";

export function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-8 py-3">
      <a
        href={backHref}
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to lead
      </a>
      <button
        onClick={() => window.print()}
        className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Save as PDF
      </button>
    </div>
  );
}
