# Mission Control — Claude Code Instructions

## What This Project Is

Mission Control is the orchestration dashboard for **Hermes** — a commercial AI agent fleet running on **OpenClaw**. It provides Delphi with live visibility and full control over the agent fleet: tasks, workflows, comms, costs, sessions, memory, cron, webhooks, and system health.

The app is a **Next.js 16 (App Router) + Supabase** project running on port 9069 on a dedicated Linux machine. It is not publicly hosted.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (PostgreSQL + Auth + SSR) · Recharts · Lucide icons · date-fns · Sonner (toasts) · @dnd-kit

---

## OpenClaw — The Agent Runtime

OpenClaw is the self-hosted AI agent gateway running on this machine. It provides the runtime that agents execute within.

### Key Concepts

- **Gateway:** Single WebSocket control plane on `ws://127.0.0.1:18789`. All agent sessions route through it.
- **Workspace:** Each agent has an isolated workspace directory with structured template files (SOUL.md, IDENTITY.md, AGENTS.md, TOOLS.md, etc.)
- **Channels:** OpenClaw uses Discord as the primary channel. Agents are bound to Discord channels via `openclaw agents bind`.
- **Sessions:** Each agent interaction runs as a session. Sessions can be `main` (default) or `isolated` (parallel).
- **Subagents:** A parent agent can spawn background sub-agent runs via the `subagent` tool. Results are announced back.
- **Cron:** Scheduled jobs stored in `~/.openclaw/cron/jobs.json`. Support `at`, `every`, and `cron` schedules. Can target main or isolated sessions.

### OpenClaw Filesystem Layout

```
~/.openclaw/
├── openclaw.json          ← Gateway config (JSON5, strict validation, hot reload)
├── cron/
│   └── jobs.json          ← All scheduled jobs
├── workspace/             ← Hermes (main agent) workspace
│   ├── SOUL.md            ← Agent personality + mission + principles
│   ├── IDENTITY.md        ← Name, role, model, capabilities
│   ├── AGENTS.md          ← Sub-agent roster + routing rules
│   ├── TOOLS.md           ← Available tools + when to use them
│   ├── USER.md            ← Owner context (Delphi's profile)
│   ├── BOOTSTRAP.md       ← First-run initialization sequence
│   ├── HEARTBEAT.md       ← Periodic check-in instructions
│   ├── BOOT.md            ← Regular session startup instructions
│   └── memory/            ← Hermes memory files
└── workspace/teams/commercial/
    ├── sdr/               ← SDR agent workspace
    │   ├── SOUL.md, IDENTITY.md, AGENTS.md, TOOLS.md, USER.md
    │   ├── HEARTBEAT.md, BOOT.md
    │   └── memory/
    ├── account-executive/  ← AE agent workspace
    ├── account-manager/    ← AM agent workspace
    ├── finance/            ← Finance agent workspace
    ├── legal/              ← Legal agent workspace
    ├── market-intelligence/ ← MI agent workspace
    └── knowledge-curator/  ← KC agent workspace
```

### Workspace Template Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality, mission, principles, behavioral guidelines |
| `IDENTITY.md` | Name, role (director/worker/specialist), model, capabilities list |
| `AGENTS.md` | Sub-agent roster: who they are, when to delegate, routing rules |
| `TOOLS.md` | Available tools (MCP servers, subagent, web search, etc.) |
| `USER.md` | Owner context — Delphi's name, role, preferences, communication style |
| `BOOTSTRAP.md` | First-run initialization: what to do upon first activation |
| `HEARTBEAT.md` | Periodic check-in: what to review, report, and maintain |
| `BOOT.md` | Regular session startup: context loading, status check |

### OpenClaw CLI Reference

```bash
# Agent management
openclaw agents list                    # List all agents
openclaw agents add <name>              # Add new agent
openclaw agents delete <name>           # Remove agent
openclaw agents bind <agent> <provider>:<channel>   # Bind to Discord channel
openclaw agents unbind <agent> <provider>:<channel>  # Unbind
openclaw agents set-identity <agent> <model>         # Set model

# Cron management
openclaw cron list                      # List all scheduled jobs
openclaw cron add                       # Add new cron job (interactive)
openclaw cron edit <id>                 # Edit existing job
openclaw cron remove <id>              # Remove job
openclaw cron run <id>                 # Trigger job immediately
openclaw cron runs [id]                # View execution history

# General
openclaw config                        # View/edit gateway config
openclaw status                        # Gateway health
```

### OpenClaw Cron System

Jobs stored in `~/.openclaw/cron/jobs.json`. Each job has:
- `id` — unique identifier
- `agentId` — which agent runs it
- `prompt` — the instruction sent to the agent
- `schedule` — `{ type: "at"|"every"|"cron", value: "..." }`
- `sessionTarget` — `main` (uses active session) or `isolated` (new parallel session)
- `enabled` — boolean toggle

Currently **16 active cron jobs**: 5 for Hermes (orchestration duties) + 11 for sub-agents (heartbeats).

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
│   │   ├── costs/        ← Token/cost tracking dashboard
│   │   ├── sessions/     ← Agent session monitoring (Gateway API + Supabase)
│   │   ├── memory/       ← Memory file browser (filesystem API)
│   │   ├── logs/         ← Unified log viewer
│   │   ├── alerts/       ← Alert rules + events
│   │   ├── webhooks/     ← Webhook CRUD + delivery history
│   │   ├── cron/         ← Scheduled task management (OpenClaw cron)
│   │   ├── integrations/ ← Third-party connections
│   │   ├── audit-log/    ← Immutable audit trail
│   │   ├── gateway/      ← Gateway config panel (reads from localhost:18789)
│   │   └── settings/     ← App settings
│   ├── (auth)/         ← Login page + server actions
│   ├── api/
│   │   ├── tasks/        ← Task CRUD + comments
│   │   ├── agents/       ← Agent soul, heartbeat, comms
│   │   ├── webhooks/     ← Webhook CRUD + test + deliveries
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
│   ├── memory-paths.ts  ← Agent slug → filesystem memory directory mapping
│   ├── model-costs.ts   ← Token cost constants
│   ├── schemas.ts       ← Zod validation schemas
│   ├── types.ts         ← Type aliases from database.types.ts
│   └── utils.ts
└── middleware.ts        ← Auth guard
```

### Data Source Architecture

Mission Control has **dual data sources** — some pages read from Supabase, others from OpenClaw/filesystem:

| Page | Primary Source | Notes |
|------|---------------|-------|
| Dashboard, Tasks, Agents | Supabase | Standard CRUD |
| Sessions | Gateway API (`localhost:18789`) | Falls back to Supabase `agent_logs` |
| Memory | Filesystem API (`/api/memory`) | Reads `~/.openclaw/workspace/` dirs |
| Gateway | Gateway API (`localhost:18789/config`) | Read-only config viewer |
| Cron | OpenClaw cron (`~/.openclaw/cron/jobs.json`) | CLI: `openclaw cron list` |
| Logs | journalctl + Supabase | System logs from journald |

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
- When shelling out to OpenClaw CLI, use `execFile` (not `exec`) — prevent injection

### OpenClaw Integration Pattern
- Route Handlers that call OpenClaw CLI: use `execFile("openclaw", [...args])` with auth check
- Route Handlers that read OpenClaw files: validate paths, prevent directory traversal
- Gateway API calls: `fetch("http://127.0.0.1:18789/...")` — local only, no auth needed
- Never expose the gateway port to external networks

---

## Agent Fleet — Hermes Commercial

8 agents managed by OpenClaw. Hermes is the director; 7 sub-agents handle specialised domains.

| Slug | Name | Type | Model | Workspace |
|------|------|------|-------|-----------|
| hermes | Hermes | director | claude-sonnet-4-6 | `~/.openclaw/workspace/` |
| sdr | SDR | worker | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/sdr/` |
| account-executive | Account Executive | worker | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/account-executive/` |
| account-manager | Account Manager | worker | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/account-manager/` |
| finance | Finance | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/finance/` |
| legal | Legal | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/legal/` |
| market-intelligence | Market Intelligence | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/market-intelligence/` |
| knowledge-curator | Knowledge Curator | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/knowledge-curator/` |

Agent types: `director`, `worker`, `specialist`
Agent statuses: `active`, `idle`, `built_not_calibrated`, `offline`

---

## Database Schema

21+ tables. All tables have UUID primary keys and `created_at`.

**Core:** agents · agent_reports · agent_logs · heartbeats · agent_souls
**Tasks:** tasks · task_comments · task_subscriptions · quality_reviews · projects
**Orchestration:** workflows · pipeline_runs · scheduled_tasks · standup_reports
**Communication:** chat_conversations · chat_messages · agent_comms · notifications
**External:** webhooks · webhook_deliveries · integrations · github_issues
**System:** agent_token_usage · audit_log · alert_rules · alert_events · system_config

Migrations: `supabase/migrations/`
Seed: `supabase/seed.sql`

---

## Route Handlers — Filesystem & CLI Access

When Mission Control reads local data (filesystem, OpenClaw CLI, journalctl), use Next.js Route Handlers in `src/app/api/`:

- Always check Supabase auth session before serving data
- Validate and sanitize all path parameters (prevent directory traversal)
- Use `execFile` (not `exec`) for shell commands (prevent injection)
- For OpenClaw CLI calls: `execFile("openclaw", ["cron", "list", "--json"])`
- For Gateway API: `fetch("http://127.0.0.1:18789/...")` (local, no auth)

---

## What Never To Do

- Do not modify `src/lib/database.types.ts` manually
- Do not add `"use client"` without genuine need for browser APIs or interactivity
- Do not write raw SQL in application code — use the Supabase client query builder
- Do not create new database tables without a migration file
- Do not expose PII in shared log output
- Do not use `exec()` for shell commands — always `execFile()`
- Do not hardcode agent workspace paths in components — use `MEMORY_PATHS` from `src/lib/memory-paths.ts`
- Do not call OpenClaw gateway from client-side code — always via API route

---

## Running the Project

```bash
npm run dev          # starts on port 9069

# Mission Control service
systemctl --user status command-center
systemctl --user restart command-center
journalctl --user -u command-center -f

# OpenClaw gateway
systemctl --user status openclaw
systemctl --user restart openclaw
journalctl --user -u openclaw -f

# OpenClaw CLI
openclaw agents list
openclaw cron list
openclaw status

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

## HERMES Guide — Living Document

`docs/HERMES.md` is a single living document that explains the entire codebase to Hermes. After every implementation session, **append a changelog entry** to the `## Changelog` section at the bottom — do not create separate report files.

## Session Completion Protocol — MANDATORY

1. Build passes — `next build` zero errors
2. HERMES.md updated — append changelog entry
3. Git commit + push
4. Service restart if code changed — `systemctl --user restart command-center`

---

## Active Spec — V7

**Current implementation spec:** `docs/transformation-prompt-v7.md`

V7 replaced generic agent orchestration placeholders with the real Hermes commercial fleet:
- 8 agents backed by OpenClaw runtime
- Dual data sources: Supabase (structured data) + OpenClaw (sessions, cron, memory, gateway)
- 20 sidebar nav items, task kanban centerpiece, full API layer
