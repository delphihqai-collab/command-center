# Mission Control — The Complete Guide

> **For Hermes.** This is the single source of truth about the Mission Control codebase — your orchestration dashboard. Every section describes how things work **right now**. When the codebase changes, the relevant section gets updated — not appended to.

---

## What This Is

Mission Control is your dashboard, Hermes. It's how Delphi sees and controls the entire agent fleet — you and your 7 sub-agents. Built in Next.js 16, running on port 9069 on Delphi's private Linux machine. Dark theme, single user, not publicly hosted.

You don't interact with Mission Control directly. You interact with OpenClaw. But Mission Control reads your data, your files, your sessions, your costs, your memory, your cron jobs — and lets Delphi manage all of it from a browser.

### Communication Hierarchy — Hybrid Topology

**Strategic layer: Delphi → Hermes → Sub-agents.** Delphi communicates with you (Hermes) through Mission Control's Home page Quick Actions or the floating Hermes Chat drawer. Commands sent from Quick Actions are delivered via `openclaw agent --agent main --message "..." --json`. All commands and responses are logged as `war_room_activity` entries for full visibility.

**Operational layer: Peer-to-peer channels.** Workers can query specialists directly for operational tasks without routing through Hermes. For example, the AE can ask Legal for a contract review directly, or the SDR can query Market Intelligence for prospect research. These direct channels are defined in the `team_topology` table and visualized on the Fleet page.

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
| Home | Supabase | KPIs, pipeline, agents, activity, review queue |
| Home Quick Actions | OpenClaw CLI | Commands sent via `openclaw agent` |
| Pipeline | Supabase | Pipeline leads CRUD, drag-drop stage transitions |
| Fleet (Overview) | Supabase | `agents` + `war_room_agents` for operations |
| Fleet (Sessions) | OpenClaw CLI | `openclaw sessions --all-agents --json` |
| Fleet (Costs) | Filesystem + CLI | `~/.openclaw/cron/runs/*.jsonl` + live sessions CLI |
| Fleet Agent Detail | Supabase + Filesystem | Agent data + workspace files |
| System (Scheduler) | OpenClaw CLI | `openclaw cron list --json` |
| System (Logs) | journalctl + Supabase | System logs from journald + `agent_logs` table |
| System (Memory) | Filesystem (`/api/memory`) | Reads `~/.openclaw/workspace/*/memory/` |
| System (Webhooks) | Supabase | Standard CRUD |
| System (Audit) | Supabase (`audit_log`) | Immutable append-only trail |
| System (Settings) | Supabase (`system_config`) | Key-value config store, agent model config |
| Hermes Chat Drawer | Supabase + OpenClaw CLI | Messages via `openclaw agent`, logged in `war_room_activity` |

---

## Every Page — What It Does

### Navigation (4 items)

**Home** (`/`) — Mission control dashboard. Five KPI cards (Active Leads, Pipeline Value, Active Agents, Open Alerts, MTD Cost). Quick Actions (9 buttons in 4 groups: Prospecting, Build, Outreach, Monitor). Pipeline targets with progress bars. Pipeline funnel chart. Review queue showing leads in human_review. Recent leads table. Agent grid with heartbeat status. Activity feed.

**Pipeline** (`/pipeline`) — Commercial pipeline board. 8 visible stage columns: Discovery → Enrichment → Atlas Build → Product Ready → Human Review → Outreach → Engaged → Meeting Booked. Terminal stage summary row below. Stage-conditional card rendering with temperature badges, Atlas build status, and product links. Header shows total pipeline value and lead count.

**Pipeline Detail** (`/pipeline/[id]`) — Single lead view with enrichment data, Atlas Delivery card (product type, brief sent date, delivery date, demo website/chatbot links), Engagement card (temperature badge, engagement score), outreach timeline, review actions, stage transitions, and "Send to Hermes" button.

**Fleet** (`/fleet`) — Tabbed view with Overview, Sessions, and Costs:
- **Overview:** Agent cards showing name, type, status badge, model, last seen, and active operations. Links to `/fleet/[slug]` for agent detail.
- **Sessions:** Live session monitor via `openclaw sessions --all-agents --json`. Shows agent, session key, model, context usage, cost. Auto-refreshes every 30s.
- **Costs:** Token cost dashboard. KPI cards (Today, This Week, This Month, All Time). Agent breakdown table (input/output tokens, cost). Cost trend chart (per-agent daily costs over time). Data from cron run JSONL files + live sessions CLI.

**Fleet Agent Detail** (`/fleet/[slug]`) — Full agent profile. Identity card, workspace file editor (tabbed with Preview/Code toggle), pipeline leads, comms, reports, activity log. Back link goes to `/fleet`.

**Fleet Agent Soul** (`/fleet/[slug]/soul`) — SOUL.md editor.

**System** (`/system`) — Tabbed view with Scheduler, Logs, Memory, Webhooks, Audit Log, and Settings:
- **Scheduler:** Cron jobs from `openclaw cron list --json`, grouped by agent with filter pills.
- **Logs:** Unified log viewer with agent dropdown. Fetches from `agent_logs` + journalctl.
- **Memory:** Split-panel file browser with Preview/Code toggle. Agent selector as horizontal pill tabs.
- **Webhooks:** CRUD webhooks with test button and "New Webhook" dialog.
- **Audit Log:** Immutable audit trail table with timestamp, agent/user, action, entity, changes.
- **Settings:** Sub-tabs for Account, Scheduler, Agents, Data Retention.

### Global Components

**Hermes Chat Drawer** — Floating action button (indigo, bottom-right) opens a sliding drawer from the right. Direct chat with Hermes via OpenClaw CLI. Quick actions dispatch `open-hermes` CustomEvent to auto-open the drawer after sending a command.

**Fleet Mode Toggle** — In the top header bar. Three-state toggle: Active (emerald), Paused (amber), Stopped (red). Reads/writes `fleet_mode` key in `system_config` table via `GET/PUT /api/fleet/mode`.

**Command Palette** — Cmd+K global search across agents and pipeline leads.

---

## Every API Route

### Agents
- `GET/POST /api/agents/comms` — Agent-to-agent communication log
- `GET/PUT /api/agents/[id]/soul` — Get/upsert agent SOUL (markdown)
- `POST /api/agents/[id]/heartbeat` — Update `last_seen` timestamp
- `GET/PUT /api/agents/[id]/workspace` — Read/write workspace config files

### Pipeline
- `GET/POST/PATCH /api/agent/pipeline` — Pipeline lead CRUD. Auth via `Authorization: Bearer <AGENT_API_KEY>`. Agents cannot move leads to `won`, `lost`, or `disqualified` (403). Default stage: `discovery`
- `POST /api/agent/notify` — Human-triggered. Sends a contextual prompt to Hermes via OpenClaw
- `GET /api/pipeline/funnel` — Lead counts per stage
- `POST /api/pipeline/atlas-delivery` — Webhook for Atlas to report demo build completion. Body: `{ lead_id, website_url?, chatbot_url? }`. Moves lead to `product_ready` stage.
- `POST /api/webhooks/email-tracking` — Email engagement tracking webhook. Body: `{ lead_id, event: "open"|"click"|"reply", reply_sentiment? }`. Updates engagement score and lead temperature.

### Review Queue
- `GET/POST /api/review-queue` — List pending items (with lead + agent joins) / create review item
- `PATCH /api/review-queue/[id]` — Process review decision (approved/rejected/needs_info). Auto-advances lead to outreach on approval

### Daily Targets
- `GET /api/daily-targets` — Today's targets
- `PUT /api/daily-targets` — Upsert targets (unique on date)

### Templates
- `GET/POST /api/templates` — List/create outreach templates
- `PUT/DELETE /api/templates/[id]` — Update/delete individual template

### Sequences
- `GET /api/sequences/[leadId]` — Outreach steps for a lead (with template joins)

### Command
- `POST /api/command/send` — Send a command to Hermes via OpenClaw CLI. Creates a war_room operation (type: "command"), logs user message + Hermes response as `war_room_activity` entries. Returns operation_id + response text.

### War Rooms
- `GET/POST /api/war-rooms` — List/create war rooms with agent assignments, linked deals, type, and config

### Webhooks
- `GET/POST /api/webhooks` — List/create webhooks (HMAC-SHA256 signing)
- `POST /api/webhooks/[id]/test` — Test delivery with sample payload
- `GET /api/webhooks/[id]/deliveries` — Delivery history

### System
- `GET /api/memory` — Browse agent memory files (filesystem)
- `GET /api/logs/journal` — Fetch journalctl output
- `GET /api/integrations` + `POST` — Third-party integration CRUD
- `GET /api/status` — System health (active agents, active pipeline leads, open alerts)
- `GET /api/search` — Full-text search across agents + pipeline leads (min 2 chars)
- `GET/PUT /api/fleet/mode` — Fleet mode toggle (active/paused/stopped). Reads/writes `fleet_mode` key in `system_config` table.

### Agent API (for Hermes + sub-agents)
- `GET/POST/PATCH /api/agent/pipeline` — Pipeline lead CRUD. Auth via `Authorization: Bearer <AGENT_API_KEY>`. Agents cannot move leads to `won` or `lost` (403 — only humans can close deals). Agents CAN disqualify. Stage order: discovery → enrichment → atlas_build → product_ready → human_review → outreach → engaged → meeting_booked → meeting_completed → proposal_sent → won/lost/disqualified. POST accepts enrichment fields: icp_score, industry, employee_count, trigger_event. PATCH accepts: atlas_website_url, atlas_chatbot_url, product_type, lead_temperature, engagement_score.
- `POST /api/agent/notify` — Human-triggered. Sends a contextual prompt to Hermes via `openclaw agent`. Used by "Send to Hermes" button on pipeline detail page. Only supports `type: "pipeline"`

---

## Database — 27 Tables

### Core
- **`agents`** — The 8 of you. slug, name, type, status, model, workspace_path, last_seen, capabilities
- **`agent_reports`** — Reports you generate: heartbeat, status_update, task_completion, error_report, synthesis
- **`agent_logs`** — Append-only action log
- **`agent_souls`** — SOUL.md content per agent
- **`agent_comms`** — Inter-agent messages with channel routing
- **`heartbeats`** — Cron job fire history

### Pipeline
- **`pipeline_leads`** — The centerpiece table. Commercial pipeline tracking. 11 stages: discovery → enrichment → human_review → outreach → engaged → meeting_booked → meeting_completed → proposal_sent → won → lost → disqualified. Core fields: company_name, contact_name, contact_email, contact_role, source, stage, assigned_agent_id, deal_value_eur, confidence, sdr_brief, discovery_notes, proposal_url, lost_reason, metadata (JSONB). Enrichment fields: icp_score, industry, employee_count, annual_revenue_eur, website, linkedin_url, trigger_event, enrichment_data (JSONB). Outreach fields: outreach_step, outreach_total_steps, last_contacted_at. Meeting fields: meeting_date, meeting_brief_url.
- **`review_queue`** — Items waiting for Delphi's decision. Types: lead_review, reply_review. Statuses: pending, approved, rejected, needs_info.
- **`daily_targets`** — Daily pipeline targets and actuals. Per-date record with leads_target, leads_actual, outreach_target, outreach_actual, emails_target, emails_actual, linkedin_target, linkedin_actual, replies_actual, meetings_target, meetings_actual.

### Webhooks & Integrations
- **`webhooks`** — Outbound webhooks with HMAC signing and failure tracking
- **`webhook_deliveries`** — Immutable delivery audit log
- **`integrations`** — Third-party connections

### Observability
- **`agent_token_usage`** — Token tracking schema
- **`audit_log`** — Immutable audit trail
- **`alert_rules`** — Alert definitions with severity and conditions
- **`alert_events`** — Alert event log

### Team Organization
- **`team_topology`** — Peer-to-peer communication channels between agents. Defines which agents can talk directly for operational queries (bypassing Hermes routing). Channel types: operational, strategic, escalation
- **`war_rooms`** — Operations and pipeline command. Types: core_pipeline (singleton, always-on pipeline dashboard) and operation (ad-hoc tasks). Linked to pipeline leads. Statuses: active, resolved, archived. Priority: critical, high, standard. Config (JSONB) stores target settings for core_pipeline type.
- **`war_room_agents`** — War room participants. Roles: lead, participant, observer
- **`war_room_activity`** — Activity log within war rooms
- **`agent_pools`** — Elastic scaling configuration
- **`fleet_experiments`** — Machine-speed A/B testing

### System
- **`system_config`** — Key-value config store

---

## File Structure

```
src/
├── app/
│   ├── (app)/              ← Protected routes (require auth)
│   │   ├── page.tsx          Home dashboard (KPIs, quick actions, pipeline, agents)
│   │   ├── pipeline/         Commercial pipeline board (11 stages, drag-drop)
│   │   │   └── _components/  ← Board, cards, enrichment, sequences, review, stage actions
│   │   ├── fleet/            Agent fleet (Overview/Sessions/Costs tabs)
│   │   │   ├── _components/
│   │   │   │   ├── fleet-tabs.tsx     ← Tab switcher (URL search params)
│   │   │   │   └── fleet-grid.tsx     ← Agent cards with operations
│   │   │   └── [slug]/       Agent detail + workspace editor + soul editor
│   │   └── system/           System management (Scheduler/Logs/Memory/Webhooks/Audit/Settings tabs)
│   │       └── _components/
│   │           └── system-tabs.tsx    ← Tab switcher (URL search params)
│   ├── (auth)/             ← Login page + server actions
│   └── api/                ← Route handlers
│       ├── command/send/     Send chat message to Hermes via OpenClaw CLI
│       ├── agent/            Agent API (pipeline, notify) — Bearer token auth
│       ├── agents/           Agent detail, workspace files, soul, heartbeat, comms
│       ├── fleet/mode/       Fleet mode toggle (active/paused/stopped)
│       ├── review-queue/     Review queue CRUD + decision processing
│       ├── daily-targets/    Daily pipeline targets upsert
│       ├── pipeline/funnel/  Lead counts per stage
│       ├── templates/        Outreach template CRUD
│       ├── sequences/        Outreach sequences per lead
│       ├── war-rooms/        War room CRUD + agent assignment
│       ├── webhooks/         Webhook CRUD + test + deliveries
│       ├── integrations/     Integration CRUD
│       ├── memory/           Filesystem memory access
│       ├── logs/             journalctl output
│       ├── search/           Full-text search (agents + pipeline leads)
│       └── status/           System health endpoint
├── components/
│   ├── ui/                 ← shadcn/ui primitives (do not edit)
│   ├── home/               ← Home page components (kpi-cards, quick-actions, etc.)
│   ├── sidebar.tsx           Navigation (4 items: Home, Pipeline, Fleet, System)
│   ├── hermes-drawer.tsx     Floating Hermes chat (FAB + sliding drawer)
│   ├── fleet-mode-toggle.tsx Three-state fleet mode control
│   ├── command-palette.tsx   Cmd+K global search
│   ├── realtime-refresh.tsx  Supabase Realtime listener
│   ├── status-badge.tsx      50+ status → color mappings
│   └── load-more-button.tsx  Cursor pagination button
├── lib/
│   ├── supabase/server.ts    Server-side client
│   ├── supabase/client.ts    Browser client
│   ├── supabase/admin.ts     Admin client (agent API only)
│   ├── agent-auth.ts         Agent API key validation
│   ├── database.types.ts     Auto-generated types (never edit manually)
│   ├── types.ts              Type aliases + pipeline stages
│   ├── memory-paths.ts       Agent slug → filesystem memory directory map
│   ├── model-costs.ts        Token cost rates per model
│   ├── schemas.ts            Zod validation schemas
│   ├── pagination.ts         Cursor-based pagination helpers
│   └── utils.ts              cn() class name merger
├── middleware.ts            ← Auth guard + login redirect to /
└── globals.css             ← Tailwind v4 + cursor:pointer on all interactive elements
```

---

## Sidebar Navigation

Desktop sidebar (w-56), 4 groups:

| Group | Items | Icons |
|-------|-------|-------|
| **Operate** | Command · Operations · Pipeline · Fleet | Crosshair · Activity · GitBranchPlus · Users |
| **Monitor** | Sessions · Tokens · Logs | Monitor · Dollar · Scroll |
| **Configure** | Cron · Memory · Webhooks · Alerts | Clock · Brain · Webhook · Bell |
| **Admin** | Audit · Gateway · Integrations · Settings | Clipboard · Server · Plug · Settings |

Mobile bottom nav: Command, Ops, Pipeline, Fleet, Alerts (5 quick links)

**Redirects:** `/war-room` → `/command`, `/office` → `/fleet`, `/dashboard` → `/command`

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
