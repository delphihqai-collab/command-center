---
{"name": "add-page", "description": "Add a new page to the Command Center backoffice", "version": "1.0"}
---
# Skill: Add Page

## Steps

1. Create directory: `src/app/(app)/<route>/`
2. Create `page.tsx` as an async Server Component
3. Import `createClient` from `@/lib/supabase/server`
4. Fetch data with `await supabase.from(...).select(...)` — use `Promise.all()` for multiple queries
5. Handle errors: `if (error) { /* handle */ }`
6. Return JSX using `Card`, `Table`, `Badge` from `@/components/ui/`
7. Add the route to `src/components/sidebar.tsx` nav items with the appropriate Lucide icon
8. If the page needs URL filters (e.g. `?stage=qualification`), accept `searchParams: Promise<{...}>` as props

## Template

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function <Name>Page() {
  const supabase = await createClient();
  
  const { data: items, error } = await supabase
    .from("<table>")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-500">Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50"><Name></h1>
        <p className="text-sm text-zinc-400">{items?.length ?? 0} records</p>
      </div>
      {/* content */}
    </div>
  );
}
```
