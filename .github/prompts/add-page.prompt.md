# Add Page

Add a new page to Mission Control.

## Steps

1. Create directory: `src/app/(app)/<route>/`
2. Create `page.tsx` as an async Server Component
3. Fetch data with `await supabase.from(...)` — use `Promise.all()` for multiple queries
4. Handle `.error` from all Supabase responses
5. Use `Card`, `Table`, `Badge` from `@/components/ui/`
6. Add route to sidebar in `src/components/sidebar.tsx` with Lucide icon
7. If OpenClaw data needed: create API route in `src/app/api/<route>/route.ts`
8. Dark theme: zinc palette, status colours per conventions

## Template

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function NewPage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("table")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-500">Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Page Title</h1>
        <p className="text-sm text-zinc-400">{items?.length ?? 0} records</p>
      </div>
      {/* content */}
    </div>
  );
}
```
