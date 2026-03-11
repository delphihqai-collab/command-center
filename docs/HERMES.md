# Mission Control — The Complete Guide

> **For Hermes.** This is the single source of truth about the Mission Control codebase — your orchestration dashboard. Every section describes how things work **right now**. When the codebase changes, the relevant section gets updated — not appended to.

---

## What This Is

Mission Control is your dashboard, Hermes. It's how Delphi sees and controls the entire agent fleet — you and your 7 sub-agents. Built in Next.js 16, running on port 9069 on Delphi's private Linux machine. Dark theme, single user, not publicly hosted.

You don't interact with Mission Control directly. You interact with OpenClaw. But Mission Control reads your data, your files, your sessions, your costs, your memory, your cron jobs — and lets Delphi manage all of it from a browser.

### Communication Hierarchy — Hybrid Topology

**Strategic layer: Delphi → Hermes → Sub-agents.** Delphi only communicates with you (Hermes). Strategic decisions, escalations, and human communication route through you.

**Operational layer: Peer-to-peer channels.** Workers can query specialists directly for operational tasks without routing through Hermes. For example, the AE can ask Legal for a contract review directly, or the SDR can query Market Intelligence for prospect research. These direct channels are defined in the `team_topology` table and visualized on the Office page.

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
| War Room, Agents, Pipeline, Templates | Supabase | Standard CRUD |
| Office | Supabase | Topology visualization, agent comms |
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

### OPERATE

**War Room** (`/war-room`) — Pipeline Command Center. Delphi's daily command interface with two tabs:
- **Pipeline Command tab:** Daily targets (leads, outreach, meetings, revenue with progress bars), review queue (approve/reject leads pending human review with ICP/intent scores), pipeline funnel (horizontal bar chart of leads per stage), upcoming meetings
- **Operations tab:** Create and manage multi-agent deal collaboration rooms. Instead of sequential pipeline handoffs, war rooms pull all relevant agents into simultaneous collaboration on high-value deals. Supports active, resolved, and archived states.

**Pipeline** (`/pipeline`) — The centerpiece. Commercial pipeline board. 6 visible stage columns: Discovery → Enrichment → Human Review → Outreach → Engaged → Meeting Booked. Terminal stage summary row below showing Meeting Completed, Proposal Sent, Won, Lost, Disqualified counts. Stage-conditional card rendering: enrichment shows ICP score + industry; outreach shows sequence progress; engaged shows reply sentiment; meeting_booked shows date. Header shows total pipeline value and lead count. Click through to lead detail.

**Pipeline Detail** (`/pipeline/[id]`) — Single lead view. Includes:
- Company profile card (enrichment data: industry, size, revenue, location, website, LinkedIn, tech stack)
- ICP + intent score gauges
- Trigger event section
- Outreach timeline (visual sequence steps with status icons)
- Meeting prep section (if applicable)
- Human review card (approve/reject inline for leads in human_review stage)
- SDR brief, discovery notes, metadata
- Stage action buttons: Move Forward, Won, Lost, Disqualify
- "Send to Hermes" button triggers OpenClaw to process the lead

**Pipeline stages (V8):** `discovery` → `enrichment` → `human_review` → `outreach` → `engaged` → `meeting_booked` → `meeting_completed` → `proposal_sent` → `won` / `lost` / `disqualified`

**Agents** (`/agents`) — Grid of all 8 agents. Cards show: name, type badge, model, slug, status. Click through to detail page.

**Agent Detail** (`/agents/[slug]`) — Full agent profile. Shows: slug, type, model, last_seen, capabilities. Sections: identity card, workspace file editor (tabbed, all config files with Preview/Code toggle), 10 recent reports, 50 action logs, 10 assigned pipeline leads, 10 recent comms.

**Pipeline** (`/pipeline`) — The sales funnel board. 6 active stage columns: Discovery → Enrichment → Review → Outreach → Engaged → Meeting Booked. Each lead card shows: company name, contact, deal value (EUR), confidence %, assigned agent, time since update. Header shows total pipeline value and lead count. Click through to lead detail. Terminal stages (Won, Lost, Disqualified) are tracked but not displayed as board columns.

**Pipeline Detail** (`/pipeline/[id]`) — Single lead view. Company info, contact details, enrichment data (industry, employee count, ICP score, trigger event), SDR brief, discovery notes. Stage action buttons: Move Forward, Won, Lost, Disqualify. "Send to Hermes" button triggers OpenClaw to process the lead through the next pipeline stage.

**Sessions** (`/sessions`) — Live session monitor. Fetches data via `openclaw sessions --all-agents --json` CLI. Shows per session: agent name, session key, kind, model, context usage (progress bar), last activity, estimated cost.

**Office** (`/office`) — Nerve center visualization. Hub-and-spoke layout with Hermes at the center and all 7 sub-agents arranged in a circle. Shows the hybrid topology: solid lines for hierarchical Hermes connections + dashed cyan curves for peer-to-peer direct channels between workers and specialists. Active agents show pulsing connections with animated light dots. Badge shows count of P2P channels. Each agent node shows emoji, name, and status dot. Click any agent to open a detail sheet.

**Team Analysis** (`/team-analysis`) — Fleet intelligence and organizational optimization dashboard. Shows:
- **KPI cards:** Direct channels count, active war rooms, pipeline metrics, running experiments, pool scaling status
- **Topology Visualizer:** Interactive SVG showing the hybrid architecture — hierarchical layer (Hermes hub) + peer-to-peer layer (direct specialist channels). Hover agents to see their connections. Animated pulses flow on direct channels.
- **Optimization Insights:** AI-generated recommendations based on fleet topology, pipeline distribution, and communication patterns. Analyzes bottlenecks, specialist utilization, scaling opportunities, and the knowledge feedback loop.
- **Fleet Experiments:** Machine-speed A/B testing panel. Track experiments for outreach templates, qualification criteria, negotiation strategies. Categories: outreach, qualification, negotiation, retention, process, topology.
- **Elastic Agent Pools:** Visual gauge cards showing pool configurations. Each pool has a base agent, min/max instances, current instances, and scaling strategy (manual, load-based, or pipeline-volume). Progress bars show utilization.
- **Direct Channel Registry:** Full list of peer-to-peer operational links with descriptions.

**War Room** (`/war-room`) — Delphi's command center. The primary operations interface. Has two sections:
- **Quick Actions (5 buttons):** Find Leads (discover companies in a sector), Launch Outreach (start outreach cadence), Team Status (get all-agent update), Research Company (deep-dive analysis), Pipeline Report (performance overview). Each creates an operation that the team can pick up.
- **Today's Pipeline KPIs:** Daily targets vs actuals — leads found, emails sent, LinkedIn touches, replies received, meetings booked. Progress bars show on-track status.
- **Review Queue:** Leads in `human_review` stage waiting for Delphi's approve/reject decision. Shows ICP score, industry, trigger event.
- **Pipeline Funnel:** Horizontal bar chart — leads at each stage (Discovery through Won).
- **Upcoming Meetings:** Leads with `meeting_booked` stage and future meeting dates.
- **Operations:** Active and completed custom operations. Create dialog: name, linked deal, priority, objective, agent selection.

### Observe

**Logs** (`/logs`) — Unified log viewer. Agent selectable from dropdown. Fetches from `agent_logs` (Supabase) + journal entries via `/api/logs/journal`.

### CONFIGURE

**Cron** (`/cron`) — Scheduler UI. Reads live data via `openclaw cron list --json`. Jobs grouped by agent with filter pills. Each job card shows schedule, session target, last run, next run.

**Templates** (`/templates`) — Outreach message template CRUD. Grid layout with category tabs (all/outreach/follow_up/meeting/proposal/nurture). Each card shows: name, channel icon, category badge, body preview, {variables}, performance stats (times used, open rate, reply rate). Create dialog with variable auto-detection from {placeholder} syntax.

**Memory** (`/memory`) — Split-panel layout. Left: file browser sidebar. Right: content with Preview/Code toggle. Agent selector uses horizontal pill-style tabs.

**Webhooks** (`/webhooks`) — CRUD webhooks. Test button sends sample payload. "New Webhook" dialog with name, URL, secret, event checkboxes.

**Alerts** (`/alerts`) — Active unresolved alerts. Shows: rule name + description, severity, created_at.

### ADMIN

**Audit Log** (`/audit-log`) — Immutable audit trail. Filters: agent/user, action, date range.

**Gateway** (`/gateway`) — Read-only gateway config viewer.

**Integrations** (`/integrations`) — Third-party connections. Grid layout.

**Settings** (`/settings`) — Tabs: Account, Scheduler, Agents, Data Retention.

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

### Agent API (for Hermes + sub-agents)
- `GET/POST/PATCH /api/agent/pipeline` — Pipeline lead CRUD. Auth via `Authorization: Bearer <AGENT_API_KEY>`. Agents cannot move leads to `won` or `lost` (403 — only humans can close deals). Agents CAN disqualify. Stage order: discovery → enrichment → human_review → outreach → engaged → meeting_booked → meeting_completed → proposal_sent → won/lost/disqualified. POST accepts enrichment fields: icp_score, industry, employee_count, trigger_event.
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
│   │   ├── war-room/         Pipeline Command Center (default route)
│   │   │   └── _components/
│   │   │       ├── war-room-tabs.tsx       ← Pipeline Command / Operations tabs
│   │   │       ├── review-queue.tsx        ← Approve/reject review cards
│   │   │       ├── pipeline-targets.tsx    ← Daily targets KPI row
│   │   │       ├── pipeline-funnel.tsx     ← Horizontal bar chart funnel
│   │   │       ├── upcoming-meetings.tsx   ← Meeting schedule list
│   │   │       ├── operations-list.tsx     ← Active + resolved operations
│   │   │       ├── create-operation.tsx    ← New operation dialog
│   │   │       ├── war-room-card.tsx       ← Room card with team + activity
│   │   │       └── war-room-create.tsx     ← Legacy create dialog
│   │   ├── pipeline/         Commercial pipeline board (6 stage columns)
│   │   │   └── _components/
│   │   │       ├── pipeline-board.tsx      ← Stage columns with lead cards
│   │   │       ├── pipeline-card.tsx       ← Lead card (stage-conditional rendering)
│   │   │       ├── enrichment-card.tsx     ← Company enrichment data display
│   │   │       ├── sequence-timeline.tsx   ← Outreach step timeline
│   │   │       ├── lead-review-card.tsx    ← Inline approve/reject for human_review
│   │   │       ├── notify-hermes-button.tsx ← "Send to Hermes" trigger
│   │   │       └── stage-actions.tsx       ← Move forward, close, disqualify
│   │   ├── agents/           Agent fleet grid
│   │   ├── agents/[slug]/    Agent detail + workspace editor
│   │   ├── office/           Fleet topology visualization
│   │   │   └── _components/
│   │   │       └── topology-visualizer.tsx ← Interactive hybrid topology SVG
│   │   ├── templates/        Outreach template CRUD
│   │   │   └── _components/
│   │   │       └── nerve-center.tsx  ← SVG hub-and-spoke + P2P channels
│   │   ├── team-analysis/    Fleet intelligence + org optimization
│   │   │   └── _components/
│   │   │       ├── topology-visualizer.tsx  ← Interactive hybrid topology SVG
│   │   │       ├── optimization-insights.tsx ← AI-generated recommendations
│   │   │       ├── pools-panel.tsx          ← Elastic agent pool gauges
│   │   │       └── experiments-panel.tsx     ← Fleet experiment tracker
│   │   ├── war-room/         Command center — pipeline targets + operations
│   │   │   └── _components/
│   │   │       ├── pipeline-targets.tsx ← KPI cards with target vs actual
│   │   │       ├── pipeline-funnel.tsx  ← Horizontal stage funnel chart
│   │   │       ├── quick-actions.tsx    ← 5 boss quick-action buttons
│   │   │       ├── war-room-card.tsx    ← Operation card with team + activity
│   │   │       └── war-room-create.tsx  ← Create operation dialog
│   │   ├── costs/            Token/cost tracking (OpenClaw data)
│   │   ├── sessions/         Session monitoring (OpenClaw CLI)
│   │   ├── memory/           Memory file browser (filesystem)
│   │   ├── logs/             Unified log viewer
│   │   ├── cron/             Scheduled task management (OpenClaw CLI)
│   │   ├── alerts/           Alert rules + events
│   │   ├── webhooks/         Webhook CRUD + delivery history
│   │   ├── integrations/     Third-party connections
│   │   ├── audit-log/        Immutable audit trail
│   │   ├── gateway/          Gateway config panel
│   │   └── settings/         App settings
│   ├── (auth)/             ← Login page + server actions
│   └── api/                ← Route handlers
│       ├── agent/            Agent API (pipeline, notify) — Bearer token auth
│       ├── agents/           Agent detail, workspace files, soul, heartbeat, comms
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
│   ├── sidebar.tsx           Navigation (4 groups: OPERATE, MONITOR, CONFIGURE, ADMIN)
│   ├── command-palette.tsx   Cmd+K global search
│   ├── realtime-refresh.tsx  Supabase Realtime listener
│   ├── realtime-table.tsx    Realtime table wrapper
│   ├── status-badge.tsx      50+ status → color mappings
│   ├── load-more-button.tsx  Cursor pagination button
│   └── theme-toggle.tsx      Dark/light toggle
├── lib/
│   ├── supabase/server.ts    Server-side client
│   ├── supabase/client.ts    Browser client
│   ├── supabase/admin.ts     Admin client (agent API only)
│   ├── agent-auth.ts         Agent API key validation
│   ├── database.types.ts     Auto-generated types (never edit manually)
│   ├── types.ts              Type aliases + pipeline stages + V8 types
│   ├── memory-paths.ts       Agent slug → filesystem memory directory map
│   ├── model-costs.ts        Token cost rates per model
│   ├── schemas.ts            Zod validation schemas
│   ├── pagination.ts         Cursor-based pagination helpers
│   └── utils.ts              cn() class name merger
├── middleware.ts            ← Auth guard + /dashboard → /war-room redirect
└── globals.css
```

---

## Sidebar Navigation

Desktop sidebar (56px collapsed width), 4 groups:

| Group | Items | Icons |
|-------|-------|-------|
| **Operate** | War Room · Pipeline · Agents | Crosshair · GitBranchPlus · Bot |
| **Monitor** | Office · Sessions · Tokens · Logs | Building · Monitor · Dollar · Scroll |
| **Configure** | Cron · Memory · Webhooks · Alerts | Clock · Brain · Webhook · Bell |
| **Admin** | Audit · Gateway · Integrations · Settings | Clipboard · Server · Plug · Settings |

Mobile bottom nav: Command, Pipeline, Agents, Office, Alerts (5 quick links)

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
