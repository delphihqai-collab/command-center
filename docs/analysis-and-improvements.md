# Codebase Analysis — Errors, Issues, and Suggested Improvements

**Analyst:** HERMES  
**Date:** 2026-03-04  
**Codebase state:** V1 build complete, pre-migration

---

## CRITICAL — Must Fix Before Production Use

### 1. Database migrations not applied
**Issue:** The Supabase project has no tables. All pages will throw 500 errors or return empty data.
**Fix:** Apply migrations manually via the Supabase dashboard SQL editor.

**Order:**
1. `supabase/migrations/20260304000001_foundation.sql` — agents, leads, stage history
2. `supabase/migrations/20260304000002_commercial.sql` — proposals, clients, invoices, approvals
3. `supabase/seed.sql` — seed 8 agents

After applying: run `npx supabase gen types typescript --linked > src/lib/database.types.ts` to replace the placeholder types file.

**Why it wasn't applied automatically:** The Supabase connection string contains special characters in the password that break the CLI URL parser. Use the dashboard SQL editor instead.

---

### 2. .env.local has credentials — must stay out of git
**Issue:** `.env.local` contains live Supabase credentials. It is gitignored, which is correct, but any `git add -f` or misconfigured `.gitignore` would expose them.
**Status:** `.gitignore` correctly excludes `.env.local`. ✅ No action needed — just a reminder to verify `.gitignore` is not overridden.

---

### 3. systemd service node binary path corrected
**Issue:** `deploy/command-center.service` originally referenced `/usr/local/bin/node` which does not exist on PC2.
**Fix applied:** Updated to `/usr/bin/node` in the deployed service file. The `deploy/` source file still has the wrong path.
**Action needed:** Update `deploy/command-center.service` in the repo to use `/usr/bin/node`.

---

## HIGH — Should Fix Soon

### 4. database.types.ts is a placeholder
**Issue:** `src/lib/database.types.ts` is hand-written and incomplete. It only covers the `agents` and partial `agent_reports` tables. Every other table is untyped.
**Fix:** After applying migrations, regenerate with:
```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```
Until then, TypeScript will not catch schema mismatches.

---

### 5. No error boundaries
**Issue:** Pages fail completely on Supabase errors. Next.js App Router supports `error.tsx` files for graceful error handling.
**Fix:** Add `src/app/(app)/error.tsx` as a global error boundary, and optionally per-route `error.tsx` files for route-specific handling.

```typescript
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-zinc-400">Something went wrong</p>
      <button onClick={reset} className="text-indigo-400 text-sm">Try again</button>
    </div>
  );
}
```

---

### 6. No loading states
**Issue:** Server Components block until data is fetched. No `loading.tsx` files exist — users see nothing while data loads.
**Fix:** Add `loading.tsx` files with skeleton components per route. Minimal implementation:

```typescript
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
}
```

---

### 7. Missing `loading.tsx` and `not-found.tsx` at app level
Complement `error.tsx` with:
- `src/app/(app)/not-found.tsx` — 404 for invalid routes
- `src/app/(app)/loading.tsx` — global loading skeleton

---

### 8. No RLS policies in migrations
**Issue:** Migrations create tables but no Row-Level Security policies. RLS is enabled by default in Supabase (not enforced until policies are written), but without policies all authenticated users have full read/write access.
**Fix:** Add RLS policies in a new migration:
- Read access: authenticated users only
- Write access: service role only (agents write via server-side client with service role key)
- Financial tables (invoices): additional restriction — only allow read, never client-side write

This is not blocking for a 2-user internal tool but should be done before any third user is added.

---

## MEDIUM — Improvements Worth Making

### 9. next.config.ts is missing
**Issue:** No `next.config.ts` file found. Recommended additions:
```typescript
const nextConfig = {
  experimental: { typedRoutes: true },  // catches broken hrefs at build time
  images: { domains: [] },
};
```

### 10. No form validation
**Issue:** The login form and any future forms have no client-side validation. Recommend adding `zod` for schema validation on server actions.

### 11. `database.types.ts` won't survive Next.js build
**Issue:** The placeholder type file has comments referencing a CLI command. The `Database` type is incomplete, which means `createClient<Database>()` will silently fall back to `any` for untyped tables.
**Priority:** Regenerate immediately after migrations are applied.

### 12. Sidebar is always full width
**Issue:** On desktop the sidebar is `w-56` (fixed). On smaller desktop screens this may feel cramped. Consider a collapsible sidebar as an improvement in V2.

### 13. No toast feedback on successful actions
**Issue:** `Sonner` is installed but not used in any existing server action. Add `toast.success()` calls after successful mutations.

### 14. Knowledge page not implemented
**Issue:** `/knowledge` route exists in sidebar nav but the page implementation was not found in the build. Needs to be created.

### 15. Settings page not implemented
**Issue:** `/settings` route exists in sidebar nav but the implementation was not found. Create at minimum a user account page.

---

## SUGGESTED NEXT FEATURES (post-V1)

### Phase 2 additions
- **Realtime flags on Dashboard:** Subscribe to `agent_reports` inserts where `flagged = true` — new critical alerts appear without refresh
- **Approval action buttons:** Approve/Reject in the UI writes to `approvals.status` and triggers HERMES via a Supabase Realtime subscription on PC2
- **Stage kanban view on Pipeline:** Optional board view alongside the table view

### Phase 3 additions
- **Charts on Dashboard:** Recharts pipeline funnel, conversion rate over time (Recharts is already installed — just needs data)
- **Client health trend chart:** Health status over time from `client_health_history`
- **Invoice cash flow projection:** 30-day receivables bar chart

### Architecture improvements
- **HERMES writes to DB instead of markdown:** Once migrations are live, update HERMES to write pipeline events directly to Supabase via REST API using the service role key stored in the OpenClaw env
- **Regenerate types in CI:** Add a GitHub Action that runs `supabase gen types typescript` after migration PRs

---

## WHAT IS WELL BUILT

- Auth middleware is correct — server-side session refresh, proper redirect logic
- Supabase SSR pattern is correctly split between `client.ts` and `server.ts`
- `Promise.all()` for parallel queries on Dashboard is a strong pattern — maintain it
- Dark zinc palette is consistent throughout
- Sidebar navigation matches the full page spec
- `status-badge.tsx` is a clean reusable component
- Service file is correct structure for user systemd — linger and auto-restart work correctly
- Port 9069 is correctly set in both `package.json` scripts and service file
