# Add Migration

Create and apply a Supabase database migration.

## Steps

1. Create file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write idempotent SQL:
   - `CREATE TABLE IF NOT EXISTS`
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - `CREATE INDEX IF NOT EXISTS`
   - UUID primary key: `id uuid primary key default gen_random_uuid()`
   - Timestamps: `created_at timestamptz not null default now()`
3. Apply via the Node `pg` script (connection string has special chars — never `supabase db push`)
4. Regenerate types: `npx supabase gen types typescript --linked > src/lib/database.types.ts`
5. Rebuild: `NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..." npm run build`
6. Restart: `systemctl --user restart command-center`
7. Never modify an existing migration file
