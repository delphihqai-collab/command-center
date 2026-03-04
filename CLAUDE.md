# Command Center — Claude Code Instructions

## What This Project Is

Command Center is the internal operations backoffice for Delphi — an AI process automation company. It provides authorised users with live visibility into the commercial department: pipeline, clients, proposals, invoices, and the status of all AI agents.

The app is a **Next.js 16 (App Router) + Supabase** project running on port 9069 on a dedicated Linux machine (PC2), accessible via SSH port forwarding or Tailscale. It is not publicly hosted.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (PostgreSQL + Auth + SSR) · Recharts · Lucide icons · date-fns · Sonner (toasts)

---

## Architecture

```
src/
├── app/
│   ├── (app)/          ← Protected routes (require auth)
│   │   ├── dashboard/
│   │   ├── pipeline/
│   │   ├── clients/
│   │   ├── proposals/
│   │   ├── invoices/
│   │   ├── agents/
│   │   ├── approvals/
│   │   ├── knowledge/
│   │   └── settings/
│   ├── (auth)/         ← Login page + server actions
│   └── layout.tsx
├── components/
│   ├── ui/             ← shadcn/ui primitives (do not edit structure)
│   ├── sidebar.tsx
│   └── status-badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts   ← Browser client (use in Client Components)
│   │   └── server.ts   ← Server client (use in Server Components + API routes)
│   ├── database.types.ts ← Generated from Supabase schema (do not edit manually)
│   └── utils.ts
└── middleware.ts        ← Auth guard — redirects unauthenticated requests to /login
```

---

## Rules — Always Follow

### Supabase access pattern
- Server Components and Route Handlers: always use `createClient()` from `@/lib/supabase/server`
- Client Components (marked `"use client"`): use `createClient()` from `@/lib/supabase/client`
- Never import the server client in a Client Component. Never import the browser client in a Server Component.

### Data fetching
- Prefer Server Components for data fetching — no loading states, no useEffect, no client-side fetching unless realtime is required
- Use `Promise.all()` for parallel queries on the same page (see dashboard/page.tsx as reference)
- Always handle the `.error` from Supabase responses — never assume success
- Use `?? []` or `?? null` fallbacks on `.data` — never assume the query returned results

### TypeScript
- Strict mode is on — no `any`, no `!` non-null assertions on values that can legitimately be null
- Use the generated `Database` type from `@/lib/database.types.ts` for all Supabase queries
- After any schema migration, regenerate types: `npx supabase gen types typescript --linked > src/lib/database.types.ts`

### Components
- Functional components only — no class components
- Use shadcn/ui primitives from `@/components/ui/` for all standard UI elements
- Do not modify files inside `src/components/ui/` — these are managed by the shadcn CLI
- New shared components go in `src/components/`
- Page-specific components go in `src/app/(app)/<page>/_components/`

### Styling
- Tailwind CSS v4 only — no inline styles, no CSS modules
- Dark theme only — the app uses `dark` class on `<html>` and zinc palette
- Colour conventions: `zinc-950` background · `zinc-900` cards · `zinc-800` borders · `zinc-50` text · `indigo-600` accent
- Status colours: `emerald` healthy/active/paid · `amber` warning/idle/pending · `red` critical/overdue/rejected · `zinc` archived/offline

### Financial data
- Never display raw financial amounts (invoice values, contract values, margins) in list views without a "reveal" interaction
- Financial data requires authenticated session — RLS enforces this at the DB level

### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser — it is server-only
- Never commit `.env.local` — it is gitignored
- The only public env vars are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Never bypass Row-Level Security — if a query requires service role, do it in a Route Handler, not a Client Component

### File naming
- Pages: `page.tsx` (App Router convention)
- Layouts: `layout.tsx`
- Server actions: `actions.ts` inside the route group
- Components: PascalCase filename matching the component name (`StatusBadge.tsx`)
- Utilities: camelCase (`utils.ts`, `database.types.ts`)

---

## Database Schema

16 tables across 7 domains. All tables have UUID primary keys, `created_at`, and soft-delete via `archived_at` where applicable.

**Domains:** agents · agent_reports · agent_logs · leads · lead_stage_history · proposals · clients · client_health_history · invoices · approvals · deal_learnings · onboarding_patterns · heartbeats

Migrations: `supabase/migrations/`
Seed: `supabase/seed.sql` (agents table — 8 rows)

---

## What Never To Do

- Do not modify `src/lib/database.types.ts` manually — always regenerate from schema
- Do not add `"use client"` to a component unless it genuinely needs browser APIs or interactivity
- Do not write raw SQL in application code — use the Supabase client query builder
- Do not create new database tables without a corresponding migration file
- Do not push migration files without testing them in the Supabase SQL editor first
- Do not add new environment variables without updating `.env.local.example`
- Do not expose PII (email addresses, personal names from client records) in shared log output

---

## Running the Project

```bash
# Development
npm run dev          # starts on port 9069

# Production (managed by systemd)
systemctl --user status command-center
systemctl --user restart command-center
journalctl --user -u command-center -f

# After schema changes
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

Access: `http://localhost:9069` (via SSH tunnel) or `http://hermes.tail280e9c.ts.net:9069` (via Tailscale)
