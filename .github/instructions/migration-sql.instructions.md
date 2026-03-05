---
applyTo: "supabase/migrations/**"
---

# Migration SQL Instructions

## Rules

- Always use `IF NOT EXISTS` for tables, columns, indexes
- Never use `NOT NULL` without a `DEFAULT` on existing tables
- UUID primary keys: `id uuid primary key default gen_random_uuid()`
- Timestamps: `created_at timestamptz not null default now()`
- Add `updated_at` trigger if the table needs it (copy from existing migration)
- Add indexes for all FK columns and commonly filtered columns
- Use CHECK constraints for enum-like text fields
- Never modify an existing migration file — create a new one

## Naming

- File: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Tables: snake_case plural (`agent_logs`, `task_comments`)
- Columns: snake_case (`created_at`, `agent_id`)
- Indexes: `idx_<table>_<column>`

## Applying

The Supabase connection string has special characters. Never use `supabase db push` directly.
Use the Node.js `pg` script documented in CLAUDE.md.

## After Applying

```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

Then rebuild with env vars present.

## updated_at Trigger Pattern

```sql
create trigger <table>_updated_at
  before update on public.<table>
  for each row execute function public.handle_updated_at();
```

The `handle_updated_at()` function is defined in the foundation migration.
