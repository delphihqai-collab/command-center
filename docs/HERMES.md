# Mission Control — The Complete Guide

> **For Hermes.** This is the single source of truth about the Mission Control codebase — your orchestration dashboard. Every section describes how things work **right now**. When the codebase changes, the relevant section gets updated — not appended to.

---

## What This Is

Mission Control is your dashboard, Hermes. It's how Delphi sees and controls the entire agent fleet — you and your 7 sub-agents. Built in Next.js 16, running on port 9069 on Delphi's private Linux machine. Dark theme, single user, not publicly hosted.

You don't interact with Mission Control directly. You interact with OpenClaw. But Mission Control reads your data, your files, your sessions, your costs, your memory, your cron jobs — and lets Delphi manage all of it from a browser.

### Communication Hierarchy

**Delphi → Hermes → Sub-agents.** Delphi only communicates with you (Hermes). All sub-agents report to you, never to Delphi directly. You are the central brain — all information flows through you. Sub-agents communicate with each other as needed, but all human communication goes through you.

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
| Drag & Drop | @dnd-kit (Pipeline board) |
| Dates | date-fns |
| Validation | Zod |
| Toasts | Sonner |
| Search | SWR (command palette) |
| Markdown | react-markdown + @tailwindcss/typography |
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
| legal | Legal | specialist | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/legal/` |
| market-intelligence | Market Intelligence | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/market-intelligence/` |
| knowledge-curator | Knowledge Curator | specialist | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/knowledge-curator/` |

**Types:** `director` (you), `worker` (Sonnet-class, frontline), `specialist` (Haiku or Sonnet, domain focused)

---

## OpenClaw — Your Runtime

OpenClaw is the self-hosted AI agent gateway on this machine. Gateway WebSocket on `ws://127.0.0.1:18789`. Binary at `/home/delphi/.nvm/versions/node/v22.22.0/bin/openclaw`.

### Workspace Files

Each agent has an isolated workspace directory containing configuration files. Mission Control can read and write all of them via `GET/PUT /api/agents/[id]/workspace`:

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

The workspace editor on the agent detail page provides a tabbed interface with Preview/Code toggle. Preview renders markdown via `react-markdown` with `prose-invert` typography styling. Code mode shows a raw textarea. Dirty tracking marks unsaved files. SOUL.md writes also sync to Supabase `agent_souls` table.

### Cron System

16 active cron jobs: 5 for you (orchestration duties) + 11 for sub-agents (heartbeats). Jobs live in `~/.openclaw/cron/jobs.json`. Run history stored as JSONL files in `~/.openclaw/cron/runs/`. Schedule types: `at`, `every`, `cron`. Session targets: `main` or `isolated`.

### CLI

```bash
openclaw agents list|add|delete|bind|unbind|set-identity
openclaw cron list|add|edit|remove|run|runs
openclaw sessions --all-agents --json
openclaw config|status
```

**Note:** The gateway at `localhost:18789` serves a SPA dashboard only — it has no REST API. All data fetching uses the CLI via `execFile`, not HTTP requests to the gateway.

---

## Data Sources — The Dual Architecture

Mission Control doesn't get all its data from one place. Some comes from Supabase, some from OpenClaw CLI, some from the filesystem:

| Page | Primary Source | Notes |
|------|---------------|-------|
| Dashboard, Agents, Pipeline | Supabase | Standard CRUD |
| Sessions | OpenClaw CLI (`openclaw sessions`) | Supabase `agents` table for metadata fallback |
| Memory | Filesystem (`/api/memory`) | Reads `~/.openclaw/workspace/*/memory/` |
| Workspace Files | Filesystem (`/api/agents/[id]/workspace`) | Reads/writes SOUL.md, IDENTITY.md, etc. |
| Gateway Config | Gateway API (`localhost:18789/config`) | Read-only config viewer |
| Cron | OpenClaw CLI (`openclaw cron list --json`) | Jobs + run state from CLI |
| Costs | OpenClaw CLI + Filesystem | Cron run JSONL files + live sessions CLI |
| Logs | journalctl + Supabase | System logs from journald + `agent_logs` table |
| Audit | Supabase (`audit_log`) | Immutable append-only trail |
| Webhooks, Alerts, Integrations | Supabase | Standard CRUD |
| Settings | Supabase (`system_config`) | Key-value config store |

---

## Every Page — What It Does

### Core Navigation

**Dashboard** (`/dashboard`) — Home page. 5 KPI tiles: active leads, pipeline value (EUR), active agents, open alerts, MTD token cost. Below: recent pipeline leads + pipeline by stage breakdown. Agent status grid + activity feed. All fetched via `Promise.all()` for parallel queries.

**Agents** (`/agents`) — Grid of all 8 agents. Cards show: name, type badge, model, slug, status. Click through to detail page.

**Agent Detail** (`/agents/[slug]`) — Full agent profile. Shows: slug, type, model, last_seen, capabilities. Sections: identity card, **workspace file editor** (tabbed, all config files with Preview/Code toggle), 10 recent reports, 50 action logs, 10 assigned pipeline leads, 10 recent comms.

**Pipeline** (`/pipeline`) — The centerpiece. Commercial pipeline board. 6 active stage columns: New Lead → SDR Qualification → Qualified → Discovery → Proposal → Negotiation. Each lead card shows: company name, contact, deal value (EUR), confidence %, assigned agent, time since creation. Header shows total pipeline value and lead count. Click through to lead detail.

**Pipeline Detail** (`/pipeline/[id]`) — Single lead view. Company info, contact details, SDR brief (full markdown), discovery notes, metadata (sector, location, BANT score, compliance). Stage action buttons: Move Forward, Closed Won, Lost, Disqualify. "Send to Hermes" button triggers OpenClaw to process the lead through the next pipeline stage.

**Sessions** (`/sessions`) — Live session monitor. Fetches data via `openclaw sessions --all-agents --json` CLI. Shows per session: agent name, session key, kind (direct/group with color-coded badges), model name, context usage (progress bar — green < 50%, amber < 80%, red > 80%), last activity (relative time), estimated cost (from `model-costs.ts`). Multiple sessions per agent visible (main + cron). Child `:run:` sessions (per-execution cron runs) are filtered out to reduce noise — only the parent cron session is shown.

**Office** (`/office`) — Nerve center visualization. Hub-and-spoke layout with Hermes at the center and all 7 sub-agents arranged in a circle around him, connected by animated lines. Active agents show pulsing connection lines with animated light dots flowing between Hermes and agents (outbound = Hermes→agent, inbound = agent→Hermes) to visualize real-time data flow. Each agent node shows emoji, name, and status dot. Click any agent to open a detail sheet with status, heartbeat, recent activity, and reporting chain info. Clearly shows the hierarchy: all agents report to Hermes, Hermes is the only point of contact with Delphi.

### Observe

**Logs** (`/logs`) — Unified log viewer. Agent selectable from dropdown. Fetches from `agent_logs` (Supabase) + journal entries via `/api/logs/journal`.

**Costs** (`/costs`) — Token cost dashboard. Reads from two OpenClaw sources: (1) cron run JSONL files at `~/.openclaw/cron/runs/*.jsonl` for historical per-run token usage, and (2) live session data from `openclaw sessions --all-agents --json`. Costs calculated using rates from `model-costs.ts` (Sonnet: $3/$15 per MTok, Haiku: $0.25/$1.25 per MTok). KPIs: today, this week, this month, all-time. Agent breakdown table merges both sources. Cost trend chart via Recharts. CSV export via props-based client component. Deduplicates `:run:` session keys to avoid double-counting.

**Memory** (`/memory`) — Split-panel layout. Left: file browser sidebar. Right: content with Preview/Code toggle. Agent selector uses horizontal pill-style tabs with per-agent icons (Crown for Hermes, Megaphone for SDR, Handshake for AE, UserCheck for AM, Calculator for Finance, Scale for Legal, BarChart3 for MI, BookOpen for KC). Full-text search within selected agent's memory. Markdown preview via `react-markdown` with `prose-invert` styling. Fetches via `/api/memory` route handler.

### Automate

**Cron** (`/cron`) — Scheduler UI. Reads live data via `openclaw cron list --json`. Jobs grouped by agent with filter pills at the top ("All" + one pill per agent showing job count). Agent groups ordered: Hermes first, workers (SDR, AE, AM), then specialists. Each job card shows: schedule expression, session target, last run time + duration, next run, consecutive error count. Enable/disable and "Run Now" actions via `openclaw cron edit` and `openclaw cron run` CLI commands.

**Webhooks** (`/webhooks`) — CRUD webhooks. Shows: name, URL, events, consecutive failures, created date. Test button sends sample payload via `/api/webhooks/[id]/test`. "New Webhook" dialog with name, URL, secret, event checkboxes.

**Alerts** (`/alerts`) — Active unresolved alerts. Shows: rule name + description, severity, created_at.

### Admin

**Audit Log** (`/audit-log`) — Immutable audit trail. Filters: agent/user, action, date range. Shows: timestamp, user_email, action, entity_type, entity_id, changes (JSON). Max 100 per page.

**Gateway** (`/gateway`) — Read-only gateway config viewer. Fetches from `localhost:18789/config`. Shows: model, sub_agent_model, scheduled jobs. Alert if gateway unreachable.

**Integrations** (`/integrations`) — Third-party connections. Grid layout. Shows: name, type badge, last sync, enabled toggle.

**Settings** (`/settings`) — Tabs: Account (email, last sign-in), Scheduler, Agents, Data Retention.

---

## Every API Route

### Agents
- `GET/POST /api/agents/comms` — Agent-to-agent communication log
- `GET/PUT /api/agents/[id]/soul` — Get/upsert agent SOUL (markdown)
- `POST /api/agents/[id]/heartbeat` — Update `last_seen` timestamp
- `GET/PUT /api/agents/[id]/workspace` — Read/write workspace config files. Allowlist of filenames prevents arbitrary file access. Path traversal protection via resolve + normalize + startsWith

### Webhooks
- `GET/POST /api/webhooks` — List/create webhooks (HMAC-SHA256 signing)
- `POST /api/webhooks/[id]/test` — Test delivery with sample payload (10s timeout)
- `GET /api/webhooks/[id]/deliveries` — Delivery history (max 50)

### System
- `GET /api/memory` — Browse agent memory files (filesystem)
- `GET /api/logs/journal` — Fetch journalctl output for command-center service
- `GET /api/integrations` + `POST` — Third-party integration CRUD
- `GET /api/status` — System health (active agents, active pipeline leads, open alerts)
- `GET /api/search` — Full-text search across agents + pipeline leads (min 2 chars)

### Agent API (for Hermes + sub-agents)
- `GET/POST/PATCH /api/agent/pipeline` — Pipeline lead CRUD. Auth via `Authorization: Bearer <AGENT_API_KEY>`. Agents cannot move leads to `closed_won`, `closed_lost`, or `disqualified` (403). Stage order: new_lead → sdr_qualification → qualified → discovery → proposal → negotiation → closed_won/closed_lost/disqualified
- `POST /api/agent/notify` — Human-triggered. Sends a contextual prompt to Hermes via `openclaw agent`. Used by "Send to Hermes" button on pipeline detail page. Only supports `type: "pipeline"`

---

## Database — 19 Tables

### Core
- **`agents`** — The 8 of you. slug, name, type, status, model, workspace_path, last_seen, capabilities
- **`agent_reports`** — Reports you generate: heartbeat, status_update, task_completion, error_report, synthesis
- **`agent_logs`** — Append-only action log. Every action you take gets recorded
- **`agent_souls`** — SOUL.md content per agent. Synced when workspace file is saved
- **`agent_comms`** — Inter-agent messages. Channel routing (general, escalation, etc.)
- **`heartbeats`** — Cron job fire history

### Pipeline
- **`pipeline_leads`** — The centerpiece table. Commercial pipeline tracking. 9 stages (new_lead through closed_won/closed_lost/disqualified). Fields: company_name, contact_name, contact_email, contact_role, source, stage, assigned_agent_id, deal_value_eur, confidence, sdr_brief, discovery_notes, proposal_url, lost_reason, metadata (JSONB)

### Webhooks & Integrations
- **`webhooks`** — Outbound webhooks with HMAC signing and failure tracking
- **`webhook_deliveries`** — Immutable delivery audit log
- **`integrations`** — Third-party connections (config as JSON)

### Observability
- **`agent_token_usage`** — Token tracking schema (exists in DB; the Costs page reads from OpenClaw instead)
- **`audit_log`** — Immutable audit trail. user_email, action, entity_type, changes (JSON diff)
- **`alert_rules`** — Alert definitions with severity and conditions
- **`alert_events`** — Alert event log. CRITICAL/HIGH/MEDIUM/INFORMATIONAL

### System
- **`system_config`** — Key-value config store

---

## File Structure

```
src/
├── app/
│   ├── (app)/              ← Protected routes (require auth)
│   │   ├── dashboard/        Overview KPIs + pipeline summary + activity
│   │   ├── pipeline/         Commercial pipeline board (6 active stage columns)
│   │   │   └── _components/
│   │   │       ├── pipeline-board.tsx   ← Stage columns with lead cards
│   │   │       ├── pipeline-card.tsx    ← Lead card (company, value, confidence)
│   │   │       ├── notify-hermes-button.tsx ← "Send to Hermes" trigger
│   │   │       └── stage-actions.tsx    ← Move forward, close, disqualify
│   │   ├── agents/           Agent fleet grid
│   │   ├── agents/[slug]/    Agent detail + workspace editor
│   │   │   └── _components/
│   │   │       └── workspace-files.tsx  ← Preview/Code toggle, tabbed editor
│   │   ├── office/           Nerve center — hub-and-spoke agent visualization
│   │   │   └── _components/
│   │   │       └── nerve-center.tsx  ← SVG hub-and-spoke with animated pulses
│   │   ├── costs/            Token/cost tracking (OpenClaw data)
│   │   │   └── _components/
│   │   │       ├── cost-chart.tsx
│   │   │       └── cost-export-button.tsx
│   │   ├── sessions/         Session monitoring (OpenClaw CLI)
│   │   │   └── _components/
│   │   │       └── sessions-table-client.tsx
│   │   ├── memory/           Memory file browser (filesystem)
│   │   │   └── _components/
│   │   │       └── memory-browser.tsx  ← Split-panel, agent pills, preview/code
│   │   ├── logs/             Unified log viewer
│   │   ├── alerts/           Alert rules + events
│   │   ├── webhooks/         Webhook CRUD + delivery history
│   │   │   └── _components/
│   │   │       └── create-webhook-dialog.tsx
│   │   ├── cron/             Scheduled task management (OpenClaw CLI)
│   │   │   └── _components/
│   │   │       ├── cron-job-list.tsx   ← Agent filter pills, grouped layout
│   │   │       └── cron-actions.tsx    ← Toggle + Run Now buttons
│   │   ├── integrations/     Third-party connections
│   │   ├── audit-log/        Immutable audit trail
│   │   ├── gateway/          Gateway config panel
│   │   └── settings/         App settings
│   ├── (auth)/             ← Login page + server actions
│   └── api/                ← Route handlers
│       ├── agent/            Agent API (pipeline, notify) — Bearer token auth
│       ├── agents/           Agent detail, workspace files, soul, heartbeat, comms
│       ├── webhooks/         Webhook CRUD + test + deliveries
│       ├── integrations/     Integration CRUD
│       ├── memory/           Filesystem memory access
│       ├── logs/             journalctl output
│       ├── search/           Full-text search (agents + pipeline leads)
│       └── status/           System health endpoint
├── components/
│   ├── ui/                 ← shadcn/ui primitives (do not edit)
│   ├── sidebar.tsx           Navigation (4 groups, 17 items)
│   ├── command-palette.tsx   Cmd+K global search
│   ├── realtime-refresh.tsx  Supabase Realtime listener
│   ├── realtime-table.tsx    Realtime table wrapper
│   ├── status-badge.tsx      40+ status → color mappings
│   ├── load-more-button.tsx  Cursor pagination button
│   └── theme-toggle.tsx      Dark/light toggle
├── lib/
│   ├── supabase/server.ts    Server-side client (Server Components + API)
│   ├── supabase/client.ts    Browser client (Client Components)
│   ├── supabase/admin.ts     Admin client (service role, bypasses RLS — agent API only)
│   ├── agent-auth.ts         Agent API key validation (timing-safe compare)
│   ├── database.types.ts     Auto-generated types (never edit manually)
│   ├── types.ts              Type aliases: Agent, PipelineLead, Webhook...
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

Desktop sidebar (56px collapsed width), 4 groups:

| Group | Items | Icons |
|-------|-------|-------|
| *(core)* | Overview · Agents · Pipeline · Sessions · Office | Dashboard · Bot · GitBranchPlus · Monitor · Building |
| **Observe** | Logs · Tokens · Memory | Scroll · Dollar · Brain |
| **Automate** | Cron · Webhooks · Alerts | Clock · Webhook · Bell |
| **Admin** | Audit · Gateways · Integrations · Settings | Clipboard · Server · Plug · Settings |

Mobile bottom nav: Dashboard, Pipeline, Agents, Alerts, Office (5 quick links)

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
