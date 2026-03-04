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
│   │   ├── office/       ← The Office — pixel-art agent grid
│   │   ├── chat/         ← Chat panel (per-agent conversations)
│   │   ├── costs/        ← Token/cost tracking dashboard
│   │   ├── sessions/     ← Agent session monitoring
│   │   ├── memory/       ← Memory file browser
│   │   ├── logs/         ← Unified log viewer
│   │   ├── audit-log/    ← Immutable audit trail
│   │   ├── gateway/      ← Gateway config panel
│   │   ├── knowledge/
│   │   └── settings/
│   ├── (auth)/         ← Login page + server actions
│   ├── api/
│   │   ├── memory/     ← Route handler for filesystem memory access
│   │   └── logs/journal/ ← Route handler for journalctl output
│   └── layout.tsx
├── components/
│   ├── ui/             ← shadcn/ui primitives (do not edit structure)
│   ├── sidebar.tsx
│   ├── realtime-refresh.tsx ← Generic Supabase Realtime subscription
│   └── status-badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts   ← Browser client (use in Client Components)
│   │   └── server.ts   ← Server client (use in Server Components + API routes)
│   ├── database.types.ts ← Generated from Supabase schema (do not edit manually)
│   ├── memory-paths.ts  ← Agent memory directory paths
│   ├── model-costs.ts   ← Token cost constants and calculator
│   ├── types.ts         ← Type aliases from database.types.ts
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

## Agent Fleet

8 agents in a commercial hierarchy. All features must support all agents — never build for HERMES only.

| Slug | Name | Rank | Status |
|------|------|------|--------|
| hermes | HERMES | director | active |
| ae | Account Executive | senior | active |
| am | Account Manager | senior | active |
| sdr | SDR | mid | active |
| finance | Finance Agent | mid | active |
| legal | Legal Agent | mid | built_not_calibrated |
| market-intelligence | Market Intelligence | mid | active |
| knowledge-curator | Knowledge Curator | junior | active |

Agent statuses: `active`, `idle`, `built_not_calibrated`, `offline`

---

## Database Schema

21 tables across 9 domains. All tables have UUID primary keys, `created_at`, and soft-delete via `archived_at` where applicable.

**Core:** agents · agent_reports · agent_logs · heartbeats
**Commercial:** leads · lead_stage_history · proposals · clients · client_health_history · invoices · approvals · deal_learnings · onboarding_patterns
**Chat:** chat_conversations · chat_messages
**Costs:** agent_token_usage
**Audit:** audit_log
**Transitions:** valid_stage_transitions · valid_approval_transitions

Migrations: `supabase/migrations/`
Seed: `supabase/seed.sql` (agents table — 8 rows)

---

## Route Handlers — Filesystem Access Pattern

When Command Center needs to read local filesystem data (agent memory files, system journal), use Next.js Route Handlers in `src/app/api/`:

- Always check Supabase auth session before serving data
- Validate and sanitize all path parameters to prevent directory traversal
- Use `execFile` (not `exec`) for shell commands to prevent injection
- These are server-only — never expose filesystem paths to the client bundle

Examples: `/api/memory/route.ts` (agent memory files), `/api/logs/journal/route.ts` (journalctl output)

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

---

## Migrations — How to Apply

The connection string has special characters that break standard URL parsers. Use the Node.js `pg` script below instead of `supabase db push`.

**Apply all migrations from scratch:**
```bash
cd /tmp && npm install pg 2>/dev/null
node << 'SCRIPT'
const { Client } = require('pg');
const fs = require('fs');

// Parse connection string safely (handles special chars in password)
const cs = process.env.SUPABASE_CONNECTION_STRING;
const at = cs.lastIndexOf('@');
const credPart = cs.slice(cs.indexOf('//') + 2, at);
const colonIdx = credPart.indexOf(':');
const user = credPart.slice(0, colonIdx);
const password = credPart.slice(colonIdx + 1);
const rest = cs.slice(at + 1);
const colonIdx2 = rest.lastIndexOf(':');
const host = rest.slice(0, colonIdx2);
const portDb = rest.slice(colonIdx2 + 1);
const port = parseInt(portDb.split('/')[0]);
const database = portDb.split('/')[1];

const client = new Client({ user, password, host, port, database, ssl: { rejectUnauthorized: false } });
async function run() {
  await client.connect();
  const files = [
    'supabase/migrations/20260304000001_foundation.sql',
    'supabase/migrations/20260304000002_commercial.sql', 
    'supabase/migrations/20260304000003_rls.sql',
    'supabase/seed.sql',
  ];
  for (const f of files) {
    console.log('Applying:', f);
    await client.query(fs.readFileSync(f, 'utf8'));
    console.log('  ✓');
  }
  await client.end();
  console.log('Done.');
}
run().catch(e => { console.error(e.message); process.exit(1); });
SCRIPT
```

After applying migrations, regenerate types:
```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## Build — Important

`NEXT_PUBLIC_*` env vars are **baked at build time**. Always build with env vars set:
```bash
NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..." npm run build
```

The systemd service injects runtime env vars for server-side code, but the public vars must be present at build time.

## Credentials
- Supabase URL and keys: stored in OpenClaw env block (`~/.openclaw/openclaw.json`)
- `.env.local`: populated from OpenClaw env vars at setup time
- Auth user: `delphihq.ai@gmail.com` — password matches Supabase DB password

---

## HERMES Reports — MANDATORY

Every implementation session **must** end with a HERMES report committed and pushed. No exceptions. The session is **not complete** until this is done.

### Report Location & Naming
- Directory: `docs/hermes-reports/`
- File format: `hermes-report-vX.md` (increment version number from previous report)
- Check existing reports first: `ls docs/hermes-reports/` to determine the next version

### Report Structure
Each report must include:

1. **Version & Metadata** — version number, date (YYYY-MM-DD), scope
2. **What Was Implemented** — summary of work, features added, bugs fixed
3. **Files Changed** — list of new/modified files with brief descriptions
4. **Issues Found** — bugs, workarounds, limitations discovered
5. **What to Validate Next** — testing checkpoints, recommended validation steps

### Purpose
These reports are Delphi's continuous audit trail. They serve as historical record, deployment checklist, and knowledge base.

---

## Session Completion Protocol — MANDATORY

Before ending ANY implementation session, you MUST complete this checklist in order:

1. **Build passes** — run `next build` and confirm zero errors
2. **HERMES report created** — `docs/hermes-reports/hermes-report-vX.md` with all 5 sections
3. **Git commit** — `git add -A && git commit -m "docs: hermes report vX — <summary>"`
4. **Git push** — `git push`
5. **Service restart** (if code changed) — `systemctl --user restart command-center`

⚠️ If you skip any of these steps, the session is considered incomplete. Always check `ls docs/hermes-reports/` at the start of a session to know the current version number.
