# Mission Control — The Complete Guide

> **For Hermes.** This is the single source of truth about the Mission Control codebase — your orchestration dashboard. It's a living document that grows with every change. Read this to understand everything.

---

## What This Is

Mission Control is your dashboard, Hermes. It's how Delphi sees and controls the entire agent fleet — you and your 7 sub-agents. Built in Next.js 16, running on port 9069 on Delphi's private Linux machine. Dark theme, single user, not publicly hosted.

You don't interact with Mission Control directly. You interact with OpenClaw. But Mission Control reads your data, your files, your sessions, your costs, your memory, your cron jobs — and lets Delphi manage all of it from a browser.

---

## The Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui (Radix primitives) |
| Styling | Tailwind CSS v4 — dark theme, zinc palette |
| Database | Supabase (PostgreSQL + Auth + SSR + Realtime) |
| Charts | Recharts |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit (Kanban board) |
| Dates | date-fns |
| Validation | Zod |
| Toasts | Sonner |
| Search | SWR (command palette) |
| Shell | `execFile` (never `exec` — injection-safe) |

**Node:** v22.22.0 · **Port:** 9069 · **Service:** `command-center.service` (systemd user unit)

---

## The Agent Fleet

This is you and your team, as Mission Control sees you:

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

**Types:** `director` (you), `worker` (Sonnet-class, frontline), `specialist` (Haiku-class, domain focused)

---

## OpenClaw — Your Runtime

OpenClaw is the self-hosted AI agent gateway on this machine. Gateway WebSocket on `ws://127.0.0.1:18789`.

### Workspace Files

Each agent has an isolated workspace directory containing configuration files. Mission Control can read and write all of them:

| File | Purpose |
|------|---------|
| `SOUL.md` | Core personality, mission, principles, behavioral guidelines |
| `IDENTITY.md` | Name, vibe, emoji, role definition |
| `USER.md` | Owner context — who Delphi is, communication preferences |
| `AGENTS.md` | Sub-agent roster, delegation rules, routing |
| `TOOLS.md` | Available tools — MCP servers, Discord IDs, bot references |
| `HEARTBEAT.md` | Periodic check-in instructions — what to review and report |
| `BOOTSTRAP.md` | First-run initialization sequence |
| `BOOT.md` | Regular session startup instructions |
| `MEMORY.md` | Long-term curated memory |
| `SUBAGENT-POLICY.md` | *(Hermes only)* Sub-agent spawning policy |

Your workspace has all of these plus extra directories (docs, templates, playbooks, skills, memory). Sub-agents have fewer — typically SOUL, IDENTITY, USER, AGENTS, TOOLS, HEARTBEAT + memory/.

### Cron System

16 active cron jobs: 5 for you (orchestration duties) + 11 for sub-agents (heartbeats). Jobs live in `~/.openclaw/cron/jobs.json`. Schedule types: `at`, `every`, `cron`. Session targets: `main` or `isolated`.

### CLI

```bash
openclaw agents list|add|delete|bind|unbind|set-identity
openclaw cron list|add|edit|remove|run|runs
openclaw config|status
```

---

## Data Sources — The Dual Architecture

Mission Control doesn't get all its data from one place. Some comes from Supabase, some from your filesystem, some from the Gateway API:

| Page | Primary Source | Notes |
|------|---------------|-------|
| Dashboard, Tasks, Agents | Supabase | Standard CRUD + Realtime subscriptions |
| Sessions | Gateway API (`localhost:18789`) | Falls back to Supabase `agent_logs` when gateway offline |
| Memory | Filesystem (`/api/memory`) | Reads `~/.openclaw/workspace/*/memory/` |
| Workspace Files | Filesystem (`/api/agents/[id]/workspace`) | Reads/writes SOUL.md, IDENTITY.md, etc. |
| Gateway Config | Gateway API (`localhost:18789/config`) | Read-only config viewer |
| Cron | OpenClaw (`~/.openclaw/cron/jobs.json`) | Via `openclaw cron` CLI |
| Logs | journalctl + Supabase | System logs from journald + agent_logs table |
| Costs | Supabase (`agent_token_usage`) | Token tracking per agent per model |
| Audit | Supabase (`audit_log`) | Immutable append-only trail |

---

## Every Page — What It Does

### Core Navigation

**Dashboard** (`/dashboard`) — Home page. 5 KPI tiles: active tasks, in-review count, active agents, open alerts, MTD token cost. All fetched via `Promise.all()` for parallel queries. Realtime refresh on changes.

**Agents** (`/agents`) — Grid of all 8 agents. Cards show: name, type badge, model, slug, status. Click through to detail page.

**Agent Detail** (`/agents/[slug]`) — Full agent profile. Shows: slug, type, model, last_seen, capabilities. Sections: identity card, **workspace file editor** (tabbed, all config files), 10 recent reports, 50 action logs, 10 assigned tasks, 10 recent comms. The workspace editor reads/writes files directly from the OpenClaw filesystem.

**Tasks** (`/tasks`) — The centerpiece. 6-column Kanban board: inbox → backlog → todo → in_progress → review → done. Drag-and-drop via @dnd-kit. Creates, assigns, re-prioritizes tasks. Full-text search on task content.

**Task Detail** (`/tasks/[id]`) — Single task view. Title, status, priority, assignee, project, due date. Threaded comments + quality reviews.

**Sessions** (`/sessions`) — Live session monitor. Calls Gateway WebSocket for active sessions. Shows: agent, session key, status, started_at, last_activity, estimated_cost. Falls back to Supabase `agent_logs` if gateway unreachable.

**Office** (`/office`) — Pixel-art grid. Agents displayed as tiles with rank (director/senior/standard/support/research). Shows status, last heartbeat, recent logs. Visual overview of fleet health.

### Observe

**Logs** (`/logs`) — Unified log viewer. Agent selectable from dropdown. Fetches from `agent_logs` (Supabase) + journal entries via `/api/logs/journal`.

**Costs** (`/costs`) — Token cost dashboard. KPIs: today, this week, this month, all-time. Agent breakdown table: input tokens, output tokens, cost USD. Chart via Recharts. Export button.

**Memory** (`/memory`) — Browse agent memory files without SSH. Dropdown to pick agent. Fetches via `/api/memory` route handler. Supports: list files, read single file, grep search.

### Automate

**Cron** (`/cron`) — Scheduler UI. Note: currently reads from Supabase `scheduled_tasks` table (needs rewrite to OpenClaw).

**Webhooks** (`/webhooks`) — CRUD webhooks. Shows: name, URL, events, consecutive failures, created date. Test button sends sample payload via `/api/webhooks/[id]/test`.

**Alerts** (`/alerts`) — Active unresolved alerts. Shows: rule name + description, severity, created_at.

### Admin

**Audit Log** (`/audit-log`) — Immutable audit trail. Filters: agent/user, action, date range. Shows: timestamp, user_email, action, entity_type, entity_id, changes (JSON). Max 100 per page.

**Gateway** (`/gateway`) — Read-only gateway config viewer. Shows: model, sub_agent_model, scheduled jobs. Alert if gateway unreachable.

**Integrations** (`/integrations`) — Third-party connections. Grid layout. Shows: name, type badge, last sync, enabled toggle.

**Settings** (`/settings`) — Tabs: Account (email, last sign-in), Scheduler, Agents, Data Retention. System version: V7 — Mission Control.

---

## Every API Route

### Tasks
- `GET/POST /api/tasks` — List (filter by status/assigned_to/project_id) or create tasks
- `GET/PATCH/DELETE /api/tasks/[id]` — Single task CRUD. DELETE soft-deletes (sets `archived_at`)
- `GET/POST /api/tasks/[id]/comments` — Task comment thread. Supports nested comments via `parent_id`

### Agents
- `GET/POST /api/agents/comms` — Agent-to-agent communication log
- `GET/PUT /api/agents/[id]/soul` — Get/upsert agent SOUL (markdown)
- `POST /api/agents/[id]/heartbeat` — Update `last_seen` timestamp
- `GET/PUT /api/agents/[id]/workspace` — Read/write workspace config files (SOUL.md, IDENTITY.md, etc.)

### Webhooks
- `GET/POST /api/webhooks` — List/create webhooks (HMAC-SHA256 signing)
- `POST /api/webhooks/[id]/test` — Test delivery with sample payload (10s timeout)
- `GET /api/webhooks/[id]/deliveries` — Delivery history (max 50)

### System
- `GET /api/memory` — Browse agent memory files (filesystem)
- `GET /api/logs/journal` — Fetch journalctl output for command-center service
- `GET /api/integrations` + `POST` — Third-party integration CRUD
- `GET /api/status` — System health (active agents, total tasks, in_progress, open alerts)
- `GET /api/search` — Full-text search across tasks + agents (min 2 chars)

---

## Database — 21+ Tables

### Core
- **`agents`** — The 8 of you. slug, name, type, status, model, workspace_path, last_seen, capabilities
- **`agent_reports`** — Reports you generate: heartbeat, status_update, task_completion, error_report, synthesis
- **`agent_logs`** — Append-only action log. Every action you take gets recorded
- **`agent_souls`** — SOUL.md content per agent. Synced when workspace file is saved
- **`agent_comms`** — Inter-agent messages. Channel routing (general, escalation, etc.)
- **`heartbeats`** — Cron job fire history

### Tasks
- **`tasks`** — The centerpiece table. 6 statuses, 4 priorities, full-text search vector, soft delete via `archived_at`
- **`task_comments`** — Threaded comments per task
- **`task_subscriptions`** — Email subscriptions to task changes
- **`projects`** — Multi-project organization. Ticket prefix + auto-increment counter
- **`quality_reviews`** — QA sign-off records per task

### Webhooks & Integrations
- **`webhooks`** — Outbound webhooks with HMAC signing and failure tracking
- **`webhook_deliveries`** — Immutable delivery audit log
- **`integrations`** — Third-party connections (config as JSON)

### Observability
- **`agent_token_usage`** — Token tracking: agent, model, input/output tokens, cost_usd, timestamp
- **`audit_log`** — Immutable audit trail. user_email, action, entity_type, changes (JSON diff)
- **`alert_rules`** — Alert definitions with severity and conditions
- **`alert_events`** — Alert event log. CRITICAL/HIGH/MEDIUM/INFORMATIONAL
- **`notifications`** — In-app notifications for Delphi

### Automation
- **`scheduled_tasks`** — Cron job representations in Supabase (actual execution via OpenClaw)
- **`workflows`** — Multi-step workflow definitions (reserved for future)
- **`pipeline_runs`** — Workflow execution records
- **`system_config`** — Key-value config store

---

## File Structure

```
src/
├── app/
│   ├── (app)/              ← Protected routes (require auth)
│   │   ├── dashboard/        Overview KPIs + activity
│   │   ├── tasks/            Kanban board (6 columns, drag-drop)
│   │   ├── agents/           Agent fleet grid
│   │   ├── agents/[slug]/    Agent detail + workspace editor
│   │   ├── agents/[slug]/soul  SOUL editor (legacy, standalone)
│   │   ├── office/           Pixel-art agent grid
│   │   ├── costs/            Token/cost tracking
│   │   ├── sessions/         Session monitoring (Gateway API)
│   │   ├── memory/           Memory file browser (filesystem)
│   │   ├── logs/             Unified log viewer
│   │   ├── alerts/           Alert rules + events
│   │   ├── webhooks/         Webhook CRUD + delivery history
│   │   ├── cron/             Scheduled task management
│   │   ├── integrations/     Third-party connections
│   │   ├── audit-log/        Immutable audit trail
│   │   ├── gateway/          Gateway config panel
│   │   └── settings/         App settings
│   ├── (auth)/             ← Login page + server actions
│   └── api/                ← Route handlers (see API section above)
├── components/
│   ├── ui/                 ← shadcn/ui primitives (do not edit)
│   ├── sidebar.tsx           Navigation (4 groups, 18 items)
│   ├── command-palette.tsx   Cmd+K global search
│   ├── realtime-refresh.tsx  Supabase Realtime listener
│   ├── realtime-table.tsx    Realtime table wrapper
│   ├── status-badge.tsx      40+ status → color mappings
│   ├── load-more-button.tsx  Cursor pagination button
│   └── theme-toggle.tsx      Dark/light toggle
├── lib/
│   ├── supabase/server.ts    Server-side client (Server Components + API)
│   ├── supabase/client.ts    Browser client (Client Components)
│   ├── database.types.ts     Auto-generated types (never edit manually)
│   ├── types.ts              Type aliases: Agent, Task, Project, Webhook...
│   ├── memory-paths.ts       Agent slug → filesystem memory directory map
│   ├── model-costs.ts        Token cost rates per model
│   ├── schemas.ts            Zod validation schemas
│   ├── pagination.ts         Cursor-based pagination helpers
│   └── utils.ts              cn() class name merger
├── middleware.ts            ← Auth guard: redirect unauthenticated → /login
└── globals.css
```

---

## Sidebar Navigation

| Group | Items |
|-------|-------|
| **Core** | Dashboard · Agents · Tasks · Sessions · Office |
| **Observe** | Logs · Tokens (costs) · Memory |
| **Automate** | Cron · Webhooks · Alerts |
| **Admin** | Audit Log · Gateways · Integrations · Settings |

Mobile: Dashboard, Tasks, Agents, Alerts, Office (5 quick links)

---

## How It Runs

```bash
# Development
npm run dev                                    # port 9069

# Production
systemctl --user status command-center         # check status
systemctl --user restart command-center        # restart after deploy
journalctl --user -u command-center -f         # tail logs

# OpenClaw
systemctl --user status openclaw               # gateway health
openclaw agents list                           # list agents
openclaw cron list                             # list cron jobs
openclaw status                                # gateway health check

# After schema changes
npx supabase gen types typescript --linked > src/lib/database.types.ts

# Build (env vars baked at build time)
NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..." npm run build
```

---

## Changelog

### 2026-03-05 — Workspace File Editors (Session 9)

**What:** Built a tabbed workspace file editor into the agent detail page. Previously only SOUL.md was editable via a separate page. Now all 9+ workspace template files (SOUL, IDENTITY, USER, AGENTS, TOOLS, HEARTBEAT, BOOTSTRAP, BOOT, MEMORY, SUBAGENT-POLICY) are readable and writable directly from the agent detail page.

**How it works:**
- API route `GET/PUT /api/agents/[id]/workspace` — reads/writes files from agent's `workspace_path` in the filesystem
- Allowlist of filenames prevents arbitrary file access. Path traversal protection via resolve + normalize + startsWith
- SOUL.md writes also sync to Supabase `agent_souls` table for consistency
- Tabbed editor with per-file icons, lazy loading, dirty tracking, save-per-tab

**Files added:**
- `src/app/api/agents/[id]/workspace/route.ts`
- `src/app/(app)/agents/[slug]/_components/workspace-files.tsx`

**Files changed:**
- `src/app/(app)/agents/[slug]/page.tsx` — replaced "Edit SOUL" button with `<WorkspaceFiles>` component

**Known issues:**
- Old standalone soul editor at `/agents/[slug]/soul` still exists (can be removed; workspace editor supersedes it)
- Agent `workspace_path` must be set in Supabase — if null, shows "No workspace files found"

### 2026-03-05 — Section-Based Workspace Editor (Session 10)

**What:** Rewrote the workspace file editor from a raw textarea into a structured section-based editor. Markdown files with `##` headings are parsed into collapsible accordion sections. Each section can be expanded to edit its heading and content independently. Files without `##` headings fall back to a plain textarea.

**Features:**
- Markdown parsing: splits on `## ` headings, preserves preamble (content before first `##`)
- Collapsible accordion: each section shows heading + line count, click to expand/edit
- Section operations: rename heading, edit content, add new section, delete section
- Toggle all button to expand/collapse all sections at once
- Preamble editing via a special "File Header" collapsible section
- Lossless round-trip: `parseMd()` → edit → `assembleMd()` preserves original formatting
- Raw textarea fallback for flat files (e.g. IDENTITY.md with no `##` sections)

**Files changed:**
- `src/app/(app)/agents/[slug]/_components/workspace-files.tsx` — complete rewrite (~370 lines)

### 2026-03-05 — Sessions Page Fixed (Session 11)

**What:** Sessions page was always showing "Gateway offline — showing fallback data" because it tried to fetch `http://localhost:18789/sessions` — but the OpenClaw gateway is a SPA dashboard with no REST API. Fixed to use `openclaw sessions --all-agents --json` via `execFile` which returns real session data.

**New data shown:**
- Session key (full `agent:slug:session` format)
- Session kind (direct / group) with color-coded badges
- Model name (shortened)
- Context usage — progress bar showing tokens used / context window (color-coded: green < 50%, amber < 80%, red > 80%)
- Last activity (relative time via date-fns)
- Estimated cost (calculated from input/output tokens using model-costs.ts)
- Multiple sessions per agent (Discord channels, cron runs, direct sessions)

**Files changed:**
- `src/app/(app)/sessions/page.tsx` — replaced broken gateway fetch with `execFile("openclaw", ["sessions", "--all-agents", "--json"])`
- `src/app/(app)/sessions/_components/sessions-table-client.tsx` — new columns: kind, model, context usage bar
- `.github/instructions/openclaw-integration.instructions.md` — corrected data source table (gateway has no REST API)

---

### 2026-03-05 — Copilot Instructions Overhaul (Session 8)

**What:** Rewrote CLAUDE.md and `.github/copilot-instructions.md` with comprehensive OpenClaw documentation. Created full `.github/` structure: 1 reviewer agent, 5 instruction files, 5 skills, 5 prompts. Fixed `memory-paths.ts` with real OpenClaw workspace paths.

**Files added:**
- `.github/agents/reviewer.agent.md` — read-only code reviewer
- `.github/instructions/` — 5 files: api-routes, server-actions, react-components, openclaw-integration, migration-sql
- `.github/skills/` — 5 dirs: supabase-crud, openclaw-agents, openclaw-cron, gateway-integration, memory-browser
- `.github/prompts/` — 5 files: add-page, add-migration, deploy, debug-production, pre-commit-qa

**Files changed:**
- `CLAUDE.md` — full rewrite with OpenClaw docs
- `.github/copilot-instructions.md` — full rewrite
- `src/lib/memory-paths.ts` — 8 real agent paths

---

### 2026-03-05 — Sidebar & Route Cleanup (Session 7b)

**What:** Removed 5 sidebar tabs and 6 routes that were redundant or empty: chat, compliance, reports, workflows, standup. Condensed navigation to 4 groups / 18 items.

---

### 2026-03-05 — V7 Mission Control Transformation (Session 7)

**What:** Complete rewrite from generic agent orchestration placeholders to the real Hermes commercial fleet. 16 implementation phases:
- 8 agents backed by OpenClaw
- Dual data sources: Supabase + OpenClaw (sessions, cron, memory, gateway)
- 18 sidebar nav items
- Task Kanban centerpiece with drag-drop
- Full API layer (tasks, webhooks, agents, integrations, search, status, memory, logs)
- Sessions page reads from Gateway WebSocket
- Memory page reads from filesystem
- Gateway page reads from localhost:18789
- Office pixel-art agent grid
- Cost tracking dashboard with model-specific rates
- Command palette (Cmd+K) with full-text search
- Realtime refresh via Supabase subscriptions
- Auth middleware + login page
- 21+ database tables across 15 migrations

---

### 2026-03-04 — V4–V6 Foundation

**What:** Built the foundational features over multiple sessions: Office view, Chat system, Cost tracking, Gateway config, Sessions page, Memory browser, Logs viewer, Audit log. Added approval stages, quality reviews, token usage tracking, alert system, calibration workflow, weekly reports, client notes, settings page, search infrastructure.

---

### 2026-03-04 — Initial V1–V3

**What:** Created the project from scratch. Dashboard KPIs, pipeline advance, approvals actions, knowledge search, settings, invoice detail, cursor pagination, schema fixes, Zod schemas. Established the Supabase schema, migrations, seed data, RLS policies, and core routing structure.

---

### 2026-03-05 — Fix: Webhook Creation Dialog

**What:** The "New Webhook" button was rendered as permanently disabled with no form behind it. Created `CreateWebhookDialog` component with a full creation form (name, URL, secret, event selection via checkboxes). Wired it to the existing `createWebhook` server action.

**Files added:**
- `src/app/(app)/webhooks/_components/create-webhook-dialog.tsx`

**Files changed:**
- `src/app/(app)/webhooks/page.tsx` — swapped disabled `WebhookActions mode="create"` stub with `CreateWebhookDialog`
