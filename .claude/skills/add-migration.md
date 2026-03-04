---
{"name": "add-migration", "description": "Create and apply a Supabase database migration", "version": "1.0"}
---
# Skill: Add Migration

## Steps

1. Create migration file: `supabase/migrations/<timestamp>_<description>.sql`
   - Timestamp format: `YYYYMMDDHHMMSS`
2. Write the SQL — always include:
   - `create table if not exists` (idempotent)
   - UUID primary key: `id uuid primary key default gen_random_uuid()`
   - Timestamps: `created_at timestamptz not null default now()`
   - `updated_at` trigger if the table needs it (copy from existing migration)
   - Indexes for all FK columns and commonly filtered columns
   - CHECK constraints for enum-like text fields
3. Test the SQL in the Supabase dashboard SQL editor BEFORE adding to migrations folder
4. After applying, regenerate TypeScript types:
   ```bash
   npx supabase gen types typescript --linked > src/lib/database.types.ts
   ```
5. Never modify an existing migration file — create a new one

## Pattern for updated_at trigger

```sql
create trigger <table>_updated_at
  before update on public.<table>
  for each row execute function public.handle_updated_at();
```

The `handle_updated_at()` function is defined in the foundation migration.

## Applying migrations

Apply via Supabase dashboard SQL editor (paste and run), or via Supabase CLI when linked.
