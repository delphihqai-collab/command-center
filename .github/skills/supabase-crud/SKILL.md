# Skill: Supabase CRUD

## When to Use
Adding/modifying Supabase queries, creating new data-fetching Server Components, building API routes that read/write to Supabase.

## Supabase Client Selection

| Context | Import |
|---------|--------|
| Server Component | `import { createClient } from "@/lib/supabase/server"` |
| Route Handler | `import { createClient } from "@/lib/supabase/server"` |
| Server Action | `import { createClient } from "@/lib/supabase/server"` |
| Client Component | `import { createClient } from "@/lib/supabase/client"` |

## Query Patterns

### Select with error handling
```typescript
const { data: items, error } = await supabase
  .from("tasks")
  .select("*, agents(*)")
  .order("created_at", { ascending: false });

if (error) return { error: error.message };
const tasks = items ?? [];
```

### Insert
```typescript
const { error } = await supabase
  .from("tasks")
  .insert({ title, status: "backlog", priority: "medium" });
```

### Update
```typescript
const { error } = await supabase
  .from("tasks")
  .update({ status: "done" })
  .eq("id", taskId);
```

### Upsert
```typescript
const { error } = await supabase
  .from("agent_souls")
  .upsert({ agent_id: agentId, content: markdown }, { onConflict: "agent_id" });
```

### Parallel queries
```typescript
const [{ data: agents }, { data: tasks }, { data: costs }] = await Promise.all([
  supabase.from("agents").select("*"),
  supabase.from("tasks").select("*").eq("status", "in_progress"),
  supabase.from("agent_token_usage").select("*").gte("created_at", startDate),
]);
```

## Key Tables

| Table | Purpose | Common Filters |
|-------|---------|---------------|
| agents | Fleet roster | `.eq("status", "active")` |
| tasks | Kanban items | `.eq("status", "...")`, `.eq("assigned_agent_id", id)` |
| agent_souls | SOUL markdown | `.eq("agent_id", id)` |
| agent_token_usage | Cost tracking | `.gte("created_at", date)` |
| webhooks | Webhook configs | `.eq("is_active", true)` |
| audit_log | Immutable trail | `.order("created_at", { ascending: false })` |

## After Mutations

Always call `revalidatePath()` in Server Actions to refresh cached page data.
