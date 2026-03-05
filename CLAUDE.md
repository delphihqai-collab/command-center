# Mission Control — Claude Code Instructions

## What This Project Is

Mission Control is a generic AI agent orchestration dashboard. It provides authorised users with live visibility into an agent fleet: tasks, workflows, comms, costs, sessions, and system health.

The app is a **Next.js 16 (App Router) + Supabase** project running on port 9069 on a dedicated Linux machine, accessible via SSH port forwarding or Tailscale. It is not publicly hosted.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (PostgreSQL + Auth + SSR) · Recharts · Lucide icons · date-fns · Sonner (toasts) · @dnd-kit

---

## Architecture

```
src/
├── app/
│   ├── (app)/          ← Protected routes (require auth)
│   │   ├── dashboard/    ← Overview KPIs + activity
│   │   ├── tasks/        ← Kanban task board (6 columns, drag-drop)
│   │   ├── agents/       ← Agent fleet list
│   │   ├── agents/[slug] ← Agent detail + soul/tasks/comms
│   │   ├── agents/[slug]/soul ← SOUL editor (markdown)
│   │   ├── office/       ← The Office — pixel-art agent grid
│   │   ├── chat/         ← Chat panel (per-agent conversations)
│   │   ├── comms/        ← Inter-agent messaging feed
│   │   ├── standup/      ← Auto-generated standup reports
│   │   ├── costs/        ← Token/cost tracking dashboard
│   │   ├── sessions/     ← Agent session monitoring
│   │   ├── memory/       ← Memory file browser
│   │   ├── logs/         ← Unified log viewer
│   │   ├── alerts/       ← Alert rules + events
│   │   ├── webhooks/     ← Webhook CRUD + delivery history
│   │   ├── workflows/    ← Workflow templates
│   │   ├── pipelines/    ← Workflow execution runs
│   │   ├── cron/         ← Scheduled task management
│   │   ├── notifications/ ← In-app notification center
│   │   ├── integrations/ ← Third-party connections
│   │   ├── audit-log/    ← Immutable audit trail
│   │   ├── gateway/      ← Gateway config panel
│   │   └── settings/     ← App settings
│   ├── (auth)/         ← Login page + server actions
│   ├── api/
│   │   ├── tasks/        ← Task CRUD + comments
│   │   ├── agents/       ← Agent soul, heartbeat, comms
│   │   ├── webhooks/     ← Webhook CRUD + test + deliveries
│   │   ├── notifications/ ← Read/mark notifications
│   │   ├── integrations/ ← Integration CRUD
│   │   ├── status/       ← System health endpoint
│   │   ├── search/       ← Full-text search (tasks + agents)
│   │   ├── memory/       ← Filesystem memory access
│   │   └── logs/journal/ ← journalctl output
│   └── layout.tsx
├── components/
│   ├── ui/             ← shadcn/ui primitives (do not edit)
│   ├── sidebar.tsx
│   ├── command-palette.tsx ← cmd+K global search
│   ├── realtime-refresh.tsx
│   ├── realtime-table.tsx
│   └── status-badge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts   ← Browser client (Client Components)
│   │   └── server.ts   ← Server client (Server Components + API routes)
│   ├── database.types.ts ← Generated from Supabase schema (do not edit)
│   ├── memory-paths.ts  ← Agent memory directory paths
│   ├── model-costs.ts   ← Token cost constants
│   ├── schemas.ts       ← Zod validation schemas
│   ├── types.ts         ← Type aliases from database.types.ts
│   └── utils.ts
└── middleware.ts        ← Auth guard
```

---

## Rules — Always Follow

### Supabase access pattern
- Server Components and Route Handlers: always use `createClient()` from `@/lib/supabase/server`
- Client Components (marked `"use client"`): use `createClient()` from `@/lib/supabase/client`
- Never import the server client in a Client Component. Never import the browser client in a Server Component.

### Data fetching
- Prefer Server Components for data fetching — no loading states, no useEffect, no client-side fetching unless realtime is required
- Use `Promise.all()` for parallel queries on the same page
- Always handle the `.error` from Supabase responses — never assume success
- Use `?? []` or `?? null` fallbacks on `.data`

### TypeScript
- Strict mode — no `any`, no unnecessary `!` non-null assertions
- Use the generated `Database` type from `@/lib/database.types.ts`
- After schema migration: `npx supabase gen types typescript --linked > src/lib/database.types.ts`

### Components
- Functional components only — no class components
- shadcn/ui primitives from `@/components/ui/` — do not modify
- New shared components in `src/components/`
- Page-specific components in `src/app/(app)/<page>/_components/`

### Styling
- Tailwind CSS v4 only — no inline styles, no CSS modules
- Dark theme only — zinc palette
- `zinc-950` background · `zinc-900` cards · `zinc-800` borders · `zinc-50` text · `indigo-600` accent
- Status: `emerald` healthy/active · `amber` warning/pending · `red` critical/failed · `zinc` offline/archived

### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Never commit `.env.local`
- Never bypass Row-Level Security from Client Components

---

## Agent Fleet

6 generic orchestration agents. All features must support all agents.

| Slug | Name | Type | Status |
|------|------|------|--------|
| orchestrator | Orchestrator | director | active |
| coder | Coder | worker | active |
| reviewer | Reviewer | worker | active |
| researcher | Researcher | specialist | active |
| devops | DevOps | specialist | active |
| monitor | Monitor | observer | active |

Agent types: `director`, `orchestrator`, `worker`, `specialist`, `observer`
Agent statuses: `active`, `idle`, `built_not_calibrated`, `offline`

---

## Database Schema

21 tables. All tables have UUID primary keys and `created_at`.

**Core:** agents · agent_reports · agent_logs · heartbeats
**Tasks:** tasks · task_comments · task_subscriptions · quality_reviews · projects
**Orchestration:** workflows · pipeline_runs · scheduled_tasks · standup_reports
**Communication:** chat_conversations · chat_messages · agent_comms · notifications
**External:** webhooks · webhook_deliveries · integrations · github_issues
**System:** agent_token_usage · audit_log · alert_rules · alert_events · agent_souls · system_config

Migrations: `supabase/migrations/`
Seed: `supabase/seed.sql`

---

## Route Handlers — Filesystem Access Pattern

When Mission Control reads local filesystem data, use Next.js Route Handlers in `src/app/api/`:

- Always check Supabase auth session before serving data
- Validate and sanitize all path parameters (prevent directory traversal)
- Use `execFile` (not `exec`) for shell commands (prevent injection)

---

## What Never To Do

- Do not modify `src/lib/database.types.ts` manually
- Do not add `"use client"` without genuine need for browser APIs or interactivity
- Do not write raw SQL in application code — use the Supabase client query builder
- Do not create new database tables without a migration file
- Do not expose PII in shared log output

---

## Running the Project

```bash
npm run dev          # starts on port 9069

systemctl --user status command-center
systemctl --user restart command-center
journalctl --user -u command-center -f

# After schema changes
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

---

## Migrations — How to Apply

The connection string has special characters that break standard URL parsers. Use the Node.js `pg` script documented in previous sessions.

After applying migrations, regenerate types:
```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## Build — Important

`NEXT_PUBLIC_*` env vars are **baked at build time**:
```bash
NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..." npm run build
```

---

## HERMES Reports — MANDATORY

Every implementation session must end with a HERMES report committed and pushed.

- Directory: `docs/hermes-reports/`
- Format: `hermes-report-vX.md`
- Sections: Version & Metadata, What Was Implemented, Files Changed, Issues Found, What to Validate Next

## Session Completion Protocol — MANDATORY

1. Build passes — `next build` zero errors
2. HERMES report created
3. Git commit + push
4. Service restart if code changed — `systemctl --user restart command-center`

---

## Active Spec — V7

**Current implementation spec:** `docs/transformation-prompt-v7.md`
**Previous specs:** v5 (commercial, archived), v4, v3

V7 replaced the Delphi commercial backoffice with generic agent orchestration:
- Dropped 16 commercial tables (leads, clients, proposals, invoices, approvals, etc.)
- Created 17 new tables (tasks, workflows, webhooks, comms, notifications, etc.)
- 20 sidebar nav items, task kanban centerpiece, full API layer
