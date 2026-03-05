---
applyTo: "src/**/*.tsx"
---

# React Component Instructions

## Server vs Client

- **Default to Server Components** — no `"use client"` unless you need browser APIs, event handlers, or React state
- Server Components can be `async` and fetch data directly
- Only add `"use client"` when genuinely required

## Data Fetching (Server Components)

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("table")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return <div>{/* render items */}</div>;
}
```

## Parallel Queries

Use `Promise.all()` for multiple independent queries:

```typescript
const [{ data: agents }, { data: tasks }] = await Promise.all([
  supabase.from("agents").select("*"),
  supabase.from("tasks").select("*"),
]);
```

## Client Components

When `"use client"` is needed:
- Import browser client: `import { createClient } from "@/lib/supabase/client"`
- Never import the server client
- Use for: event handlers, useState, useEffect, browser APIs, realtime subscriptions

## Styling

- Dark theme only — zinc palette
- `zinc-950` bg · `zinc-900` cards · `zinc-800` borders · `zinc-50` text · `indigo-600` accent
- Status: `emerald` active · `amber` pending · `red` failed · `zinc` offline
- Use shadcn/ui components from `@/components/ui/`
- Never edit files in `src/components/ui/`
