"use client";

import { useState } from "react";
import { TemplateCard } from "./template-card";
import { TemplateEditor } from "./template-editor";
import type { OutreachTemplate } from "@/lib/types";

const CATEGORIES = ["all", "outreach", "follow_up", "meeting", "proposal", "nurture"];

export function TemplateGrid({ templates }: { templates: OutreachTemplate[] }) {
  const [category, setCategory] = useState("all");

  const filtered = category === "all"
    ? templates
    : templates.filter((t) => t.category === category);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                category === cat
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {cat.replace(/_/g, " ")}
              {cat !== "all" && (
                <span className="ml-1 text-zinc-600">
                  {templates.filter((t) => t.category === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <TemplateEditor />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center">
          <p className="text-sm text-zinc-500">No templates yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
