# [SUPERSEDED — V1 SCHEMA] See implementation-spec-v2.md for current schema

# Command Center — Full Architecture Specification

**Version:** 1.0  
**Author:** HERMES — Commercial Director, Delphi  
**Date:** 2026-03-04  
**Status:** DRAFT — open questions at the bottom must be answered before implementation begins  
**Classification:** Internal — do not share externally

---

## 1. Business Context

### 1.1 What Delphi Is

Delphi is an AI process automation company targeting SMEs. The core offering is reusable, sector-specific automation systems that eliminate manual, repetitive operational processes. The initial sector focus is health and dental in Portugal, expanding to adjacent GDPR-sensitive industries across the EU.

The business model is not bespoke development. Delphi builds sector templates — systems that encode the best solution to a defined problem class — and applies targeted customisation for each client. This produces consistent delivery quality, faster onboarding, and a margin structure that scales without proportionally growing a delivery team.

**Current stage:** Pre-revenue. Validation phase. All infrastructure is being built to support the first 50 clients without architectural changes.

**What we are building toward:**
- A repeatable sales and delivery process powered by AI agents
- A central data layer that gives authorised humans full visibility into commercial operations
- A client-facing layer (later) that delivers self-service access to their automation systems
- A knowledge base that compounds — every deal, every client interaction, every failure makes the system smarter

---

### 1.2 What HERMES Is

HERMES is the Commercial Director of Delphi. Not a chatbot. Not an assistant. A department head that runs on Anthropic Claude Sonnet, managed by OpenClaw, on a dedicated Linux machine (PC2) connected via Tailscale.

HERMES owns commercial results. HERMES directs a team of seven sub-agents. HERMES escalates decisions that require human judgement and executes everything that does not.

**The seven-agent commercial team:**

| Agent | Role | Primary Metric | Model |
|---|---|---|---|
| SDR | Lead qualification — qualifies every inbound lead against ICP and BANT framework | SQLs generated | Claude Sonnet |
| Account Executive | Discovery, proposal drafting, close — runs MEDDIC on every prospect | Proposal-to-close rate | Claude Sonnet |
| Account Manager | Post-signature client health, onboarding, renewal, churn prevention | Client health score | Claude Sonnet |
| Finance Agent | Proposal pricing validation, margin protection, invoice tracking | Margin integrity | Claude Haiku |
| Legal & Compliance | Contract review, GDPR compliance gate, SLA validation | Zero non-compliant proposals sent | Claude Sonnet |
| Market Intelligence | Competitor monitoring, sector signals, ICP intelligence | Signal-to-noise ratio | Claude Haiku |
| Knowledge Curator | Deal indexing, onboarding pattern indexing, cross-agent synthesis | Knowledge coverage | Claude Sonnet |

**How HERMES operates:**
- Posts a daily standup every morning at 09:00
- Posts a midday status update at 12:00
- Posts an end-of-day status update at 18:00
- Weekly maintenance cron runs at 03:00 Sunday (updates, health checks)
- Every external action requires explicit authorised-user approval before execution
- Nothing contacts a client, sends a proposal, or commits a financial action without human sign-off

**The approval chain:**
HERMES blocks on every external action and posts a structured approval request to the #approvals Discord channel. Authorised users react with ✅ to approve. Only then does the action execute.

---

### 1.3 Why the Database Is the Core of the Business

Right now, every pipeline event, every agent action, and every client interaction exists either in HERMES's session memory (which resets between sessions) or in flat markdown files on PC2's filesystem. That is adequate for a solo operator in the validation phase. It is not adequate for a growing business with multiple agents, multiple clients, and multiple humans who need live visibility.

The architectural shift is this: **the Supabase database becomes the single source of truth, and every other component — agents, backoffice, future client portal, billing system, reporting layer — reads from and writes to it.**

Consequences of this architecture:

- When the SDR qualifies a lead, that qualification is a database record — queryable, reportable, auditable.
- When a proposal moves through approval gates (ATLAS estimate → Legal review → Finance validation → Boss approval), each gate clearance is a timestamped database event.
- When a client's health score changes from Healthy to At Risk, the history is in the database — chartable over time, exportable, visible to both authorised users instantly.
- When an authorised user opens the backoffice at 09:00, they see the live operational state of the entire commercial department — not a summary compiled by HERMES, but the actual data, structured and up to date.
- When the business reaches 50 clients, the database handles it without modification. Markdown files do not.

The backoffice website is a relatively thin read layer on top of a well-designed database. The intelligence lives in the agents. The persistence lives in the database. The website is the operational window.

**Future surfaces that will read from this same database:**
- Client portal (clients view their own onboarding, invoice, and contract status)
- Billing dashboard (invoicing, payment tracking, MRR)
- ATLAS dashboard (development team capacity and delivery visibility)
- Mobile companion (push notifications for critical flags)
- Public API (future partner integrations)

All of these are additive. The database schema is designed to support them without breaking changes to the core.

---

## 2. Technology Stack

### 2.1 Recommended Stack

**Frontend framework: Next.js 14 (App Router)**
- React-based, TypeScript throughout
- App Router enables React Server Components — fast initial page load, efficient data fetching
- Built-in API routes for any server-side logic that should not hit the database directly
- Best-in-class Supabase integration via official `@supabase/ssr` package
- Large ecosystem: every UI library, chart library, and form library has React support

**Styling: Tailwind CSS + shadcn/ui**
- Tailwind: utility-first CSS, no custom stylesheets needed, consistent spacing and colour system
- shadcn/ui: copy-paste component library built on Radix UI primitives — tables, modals, dropdowns, forms, cards — all accessible and production-quality out of the box
- Components are owned code, not a dependency — fully customisable without fighting a design system
- Result: professional-grade UI with minimal design work required for V1

**Database and backend: Supabase**
- PostgreSQL: relational, queryable with full SQL, handles complex joins and aggregations
- Supabase Auth: user management, session handling, JWT tokens — no custom auth layer needed
- Supabase Realtime: live database subscriptions — dashboard updates without polling
- Supabase REST API (PostgREST): auto-generated REST endpoints for every table — agents write to the DB via this API without needing a custom backend
- Row-Level Security: built-in per-row access control — critical when client data enters the system
- Edge Functions: serverless functions for any logic that must run close to the database

**Authentication: Supabase Auth**
- Email + password for authorised users
- Session managed via JWT, handled automatically by the `@supabase/ssr` package
- RLS policies tie to the authenticated user's ID — each user sees exactly what they are permitted to see
- Google OAuth can be added in one config change when needed

**Realtime: Supabase Realtime**
- Built into Supabase — no additional infrastructure
- Subscribe to table changes from the Next.js frontend
- Dashboard reflects agent writes instantly — critical alerts appear without manual refresh

**Charts and data visualisation: Recharts**
- React-native chart library, composable, fully customisable
- Covers all dashboard needs: pipeline funnel, conversion rates, health score trends, invoice ageing, revenue projections
- Lightweight — no heavyweight BI tool needed for V1

**Hosting: PC2 (local) — port 9069**
- Next.js runs directly on PC2: `next start --port 9069`
- Access method 1 — SSH tunnel (any machine with SSH access):
  `ssh -L 9069:localhost:9069 delphi@hermes.tail280e9c.ts.net`
  Then open `http://localhost:9069` in any browser
- Access method 2 — Tailscale direct (Tailscale installed on device):
  `http://hermes.tail280e9c.ts.net:9069` or `http://100.99.147.97:9069`
- No public exposure — zero attack surface
- No third-party hosting costs
- Vercel can be added later when public access is needed

**Package management: pnpm**
- Faster and more disk-efficient than npm
- Deterministic lockfile
- Monorepo-ready if the project grows to include multiple packages

**Type safety: TypeScript + Supabase generated types**
- Supabase CLI generates TypeScript types directly from the database schema
- End-to-end type safety from database → API → frontend
- Run `supabase gen types typescript` after every schema migration to keep types in sync

---

### 2.2 Why Not Alternatives

| Alternative | Decision |
|---|---|
| Vue / Nuxt | Smaller ecosystem, less Supabase tooling, smaller hiring pool |
| Remix | Good framework, but Next.js has broader adoption, more examples, and better Supabase integration |
| Custom Node/Express backend | Supabase eliminates 80% of the need — adds maintenance overhead for no meaningful gain |
| Firebase / Firestore | Not relational — complex joins are painful, worse for reporting and aggregations |
| Neon / Planetscale | Supabase is already connected and provides auth + realtime in addition to the DB |
| MUI / Chakra UI | Heavier, more opinionated, harder to customise than shadcn/ui |
| Redux for state | Next.js App Router + Supabase Realtime + React Query handles all state needs — Redux is overkill |

---

## 3. Database Schema

### 3.1 Design Principles

1. **Every record has `created_at` and `updated_at`.** Nothing is undatable without a timestamp.
2. **Soft deletes only.** Records are never deleted — `archived_at` timestamp marks them as inactive. History is preserved.
3. **All IDs are UUIDs.** No sequential integers — UUIDs are safe to expose in URLs and API responses.
4. **Status fields use text enums.** Enforced at the application layer, documented below. Postgres CHECK constraints added in migrations.
5. **Financial figures are `numeric`, not `float`.** Floating-point arithmetic errors are unacceptable in financial data.
6. **jsonb for variable-structure data.** Agent report payloads, friction point lists, and other variable-structure data use `jsonb` columns — queryable but flexible.
7. **Foreign keys everywhere.** Referential integrity enforced at the database level, not the application level.

---

### 3.2 Domain 1 — Agents

**Table: `agents`**  
Registry of all AI agents in the Delphi system. Seeded once, updated when agents are added or status changes.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| slug | text | UNIQUE, NOT NULL | Machine identifier: `hermes`, `sdr`, `account-executive`, etc. |
| name | text | NOT NULL | Display name: `HERMES`, `SDR`, `Account Executive`, etc. |
| type | text | NOT NULL | `director`, `sales`, `finance`, `legal`, `intelligence`, `knowledge` |
| status | text | NOT NULL | `active`, `idle`, `built_not_calibrated`, `offline` |
| model | text | NOT NULL | Anthropic model identifier |
| workspace_path | text | | Filesystem path to agent workspace on PC2 |
| notes | text | | Free text operational notes |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | Updated via trigger |

---

**Table: `agent_reports`**  
Structured reports written by agents after every task. The primary mechanism for agent-to-database communication.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| agent_id | uuid | FK → agents.id, NOT NULL | Which agent produced this report |
| report_type | text | NOT NULL | `heartbeat`, `qualification`, `discovery`, `proposal_gate`, `health_score`, `invoice_review`, `legal_review`, `intel_scan`, `deal_index`, `onboarding_summary`, `synthesis` |
| content | jsonb | NOT NULL | Structured report payload — schema varies by report_type |
| flagged | boolean | NOT NULL, default false | HERMES marked this for authorised-user attention |
| flag_level | text | | `CRITICAL`, `HIGH`, `MEDIUM`, null |
| related_entity_type | text | | `lead`, `client`, `proposal`, `invoice`, null |
| related_entity_id | uuid | | ID of the related record in the appropriate table |
| created_at | timestamptz | NOT NULL, default now() | |

---

**Table: `agent_logs`**  
Low-level activity log. Every meaningful agent action writes a log entry. Append-only — never updated.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| agent_id | uuid | FK → agents.id, NOT NULL | |
| action | text | NOT NULL | Short description of the action taken |
| detail | text | | Extended detail |
| related_entity_type | text | | `lead`, `client`, `proposal`, `invoice`, null |
| related_entity_id | uuid | | |
| created_at | timestamptz | NOT NULL, default now() | |

---

### 3.3 Domain 2 — Pipeline

**Table: `leads`**  
Every prospect from first identification through to close. The primary pipeline record.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| company_name | text | NOT NULL | |
| contact_name | text | | |
| contact_role | text | | Job title / role |
| source | text | | How the lead was identified |
| sector | text | | `dental`, `health`, `other` |
| country | text | default 'PT' | ISO country code |
| stage | text | NOT NULL | See stage enum below |
| qualified | boolean | | SDR qualification outcome. null = not yet evaluated |
| disqualified_reason | text | | Populated when qualified = false |
| sdr_brief | jsonb | | Completed SDR handoff brief, stored as structured data |
| meddic | jsonb | | AE MEDDIC discovery fields |
| assigned_agent_id | uuid | FK → agents.id | Current responsible agent |
| last_activity_at | timestamptz | | Updated on every pipeline event |
| stall_flagged | boolean | default false | Flagged by HERMES for >5 days no activity |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |
| archived_at | timestamptz | | Soft delete — set when lead is fully closed and archived |

**Stage enum values (enforced via CHECK constraint):**
`prospecting` → `qualification` → `initial_contact` → `demo` → `needs_analysis` → `proposal_sent` → `negotiation` → `closed_won` / `closed_lost`

---

**Table: `lead_stage_history`**  
Immutable audit trail of every stage change on every lead.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| lead_id | uuid | FK → leads.id, NOT NULL | |
| from_stage | text | | null on first entry |
| to_stage | text | NOT NULL | |
| changed_by_agent_id | uuid | FK → agents.id | Which agent triggered the change |
| note | text | | Optional context |
| created_at | timestamptz | NOT NULL, default now() | |

---

**Table: `proposals`**  
Every proposal associated with a lead. One lead may have multiple proposals (e.g. rejected then revised).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| lead_id | uuid | FK → leads.id, NOT NULL | |
| version | int | NOT NULL, default 1 | Incremented if a revised proposal is created |
| status | text | NOT NULL | See status enum below |
| value | numeric(12,2) | | Total contract value |
| monthly_value | numeric(12,2) | | Monthly recurring value |
| payment_terms | text | default 'net_30' | |
| scope_summary | text | | Plain text scope description |
| gate_atlas_required | boolean | default false | Whether ATLAS estimate was required |
| gate_atlas_cleared | boolean | default false | |
| gate_atlas_cleared_at | timestamptz | | |
| gate_legal_cleared | boolean | default false | |
| gate_legal_cleared_at | timestamptz | | |
| gate_legal_notes | text | | Legal agent output summary |
| gate_finance_cleared | boolean | default false | |
| gate_finance_cleared_at | timestamptz | | |
| gate_finance_notes | text | | Finance agent output summary |
| boss_approved | boolean | default false | |
| boss_approved_at | timestamptz | | |
| sent_at | timestamptz | | |
| follow_up_48h_sent | boolean | default false | |
| follow_up_5d_sent | boolean | default false | |
| follow_up_10d_sent | boolean | default false | |
| outcome | text | | `accepted`, `rejected`, `ghosted`, null |
| outcome_at | timestamptz | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

**Status enum:** `drafting`, `gate_atlas`, `gate_legal`, `gate_finance`, `pending_approval`, `approved`, `sent`, `accepted`, `rejected`, `expired`

---

### 3.4 Domain 3 — Clients

**Table: `clients`**  
Every active client from contract signature through contract end.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| lead_id | uuid | FK → leads.id | Origin lead |
| proposal_id | uuid | FK → proposals.id | Winning proposal |
| company_name | text | NOT NULL | |
| contact_name | text | | Primary contact |
| contact_email | text | | Work domain email only — never personal |
| sector | text | | |
| country | text | | |
| contract_start | date | NOT NULL | |
| contract_end | date | NOT NULL | |
| monthly_value | numeric(12,2) | NOT NULL | |
| health_status | text | NOT NULL, default 'healthy' | `healthy`, `at_risk`, `critical` |
| onboarding_complete | boolean | default false | |
| onboarding_completed_at | timestamptz | | |
| renewal_flagged_90d | boolean | default false | |
| renewal_flagged_30d | boolean | default false | |
| assigned_am_id | uuid | FK → agents.id | Account Manager |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |
| archived_at | timestamptz | | Churned / contract ended |

---

**Table: `client_health_history`**  
Every health score evaluation recorded by the Account Manager.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | FK → clients.id, NOT NULL | |
| health_status | text | NOT NULL | `healthy`, `at_risk`, `critical` |
| product_activity_signal | text | | `green`, `yellow`, `red` |
| invoice_status_signal | text | | `green`, `yellow`, `red` |
| communication_signal | text | | `green`, `yellow`, `red` |
| sentiment_signal | text | | `green`, `yellow`, `red` |
| note | text | | AM summary |
| recorded_by_agent_id | uuid | FK → agents.id | |
| created_at | timestamptz | NOT NULL, default now() | |

---

### 3.5 Domain 4 — Finance

**Table: `invoices`**  
Every invoice issued to a client.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | FK → clients.id, NOT NULL | |
| invoice_reference | text | | External invoice number |
| amount | numeric(12,2) | NOT NULL | |
| due_date | date | NOT NULL | |
| paid_at | timestamptz | | null = unpaid |
| status | text | NOT NULL, default 'pending' | `pending`, `overdue`, `paid`, `disputed` |
| overdue_days | int | | Computed and updated at every Finance Agent heartbeat |
| flagged | boolean | default false | |
| flag_level | text | | `MEDIUM`, `HIGH`, `CRITICAL`, null |
| flag_note | text | | Why it was flagged |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

---

### 3.6 Domain 5 — Approvals

**Table: `approvals`**  
Every approval request created by HERMES and awaiting authorised-user decision.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| urgency | text | NOT NULL | `CRITICAL`, `IMPORTANT`, `INFORMATIONAL` |
| action_summary | text | NOT NULL | One line — what executes if approved |
| recipient | text | | Who is affected (company name, not personal name) |
| context | text | | Two sentences max |
| draft_content | text | | Exact content ready to action |
| risks_if_approved | text | | |
| risks_if_rejected | text | | |
| alternatives | text | | |
| risk_if_delayed | text | | |
| status | text | NOT NULL, default 'pending' | `pending`, `approved`, `rejected`, `expired` |
| approved_by_user_id | uuid | FK → auth.users | Supabase Auth user who approved/rejected |
| decision_at | timestamptz | | When the decision was made |
| discord_message_id | text | | Discord message ID for the original approval request |
| created_by_agent_id | uuid | FK → agents.id | |
| related_entity_type | text | | `lead`, `client`, `proposal`, null |
| related_entity_id | uuid | | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

---

### 3.7 Domain 6 — Knowledge Base

**Table: `deal_learnings`**  
Indexed by the Knowledge Curator immediately after every closed deal.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| lead_id | uuid | FK → leads.id, NOT NULL | |
| outcome | text | NOT NULL | `won`, `lost` |
| icp_match_quality | text | | `strong`, `moderate`, `weak` |
| icp_match_notes | text | | Which criteria were strong/weak |
| stage_lost_at | text | | If outcome = lost |
| deal_velocity_days | int | | Total days from SQL to close |
| velocity_by_stage | jsonb | | Days per stage as key-value |
| objections | jsonb | | Array of {objection, resolution, outcome} |
| champion_role | text | | |
| champion_effectiveness | text | | `strong`, `moderate`, `absent` |
| competitor_involved | boolean | default false | |
| competitor_name | text | | |
| competitor_win_reason | text | | If lost to competitor |
| loss_reason_primary | text | | |
| loss_reason_secondary | text | | |
| loss_type | text | | `good_fit_loss`, `winnable_loss` |
| margin_achieved | numeric(5,2) | | Percentage, Won deals only |
| key_learning | text | NOT NULL | One-sentence distillation |
| created_at | timestamptz | NOT NULL, default now() | |

---

**Table: `onboarding_patterns`**  
Indexed by the Knowledge Curator at Day 30 of every client onboarding.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | FK → clients.id, NOT NULL | |
| health_at_day30 | text | NOT NULL | `healthy`, `at_risk`, `critical` |
| time_to_value_days | int | | Days until first confirmed product use |
| friction_points | jsonb | | Array of {day, description, resolved_by} |
| escalations | int | default 0 | Number of escalations to authorised users |
| day7_signals | text | | What at Day 7 predicted Day 30 outcome |
| key_learning | text | NOT NULL | |
| created_at | timestamptz | NOT NULL, default now() | |

---

### 3.8 Domain 7 — System

**Table: `heartbeats`**  
Every scheduled cron job execution logged here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| job_name | text | NOT NULL | e.g. `hermes-midday-update` |
| scheduled_at | timestamptz | NOT NULL | When the job was supposed to fire |
| fired_at | timestamptz | NOT NULL | When it actually fired |
| status | text | NOT NULL | `ok`, `late`, `failed` |
| summary | text | | One-line outcome |
| created_at | timestamptz | NOT NULL, default now() | |

---

## 4. Backoffice Website

### 4.1 Purpose and Scope

The backoffice is an internal operations dashboard for authorised users. Its purpose is full visibility into the commercial department without needing to query HERMES directly.

**What it is not:**
- A client-facing product (that is a future surface)
- A place to configure agents (that comes later)
- A replacement for Discord-based approvals (they coexist for now)

**V1 goal:** open the backoffice and know the exact state of every lead, every client, every proposal, every invoice, and every agent — without asking HERMES anything.

---

### 4.2 Information Architecture

```
/
├── /dashboard          ← Home — live operational overview
├── /pipeline
│   ├── /pipeline       ← Lead table with stage, filters, search
│   └── /pipeline/:id   ← Lead detail — full history, MEDDIC, proposals
├── /clients
│   ├── /clients        ← Client table with health status, filters
│   └── /clients/:id    ← Client detail — health history, invoices, onboarding log
├── /proposals
│   ├── /proposals      ← All proposals with gate status and outcome
│   └── /proposals/:id  ← Proposal detail — full gate history, content
├── /invoices           ← Invoice table — status, overdue flags, cash flow
├── /agents
│   ├── /agents         ← Agent registry — status, last report, calibration
│   └── /agents/:slug   ← Agent detail — recent reports, logs, learnings
├── /approvals          ← Open and historical approval requests
├── /knowledge
│   ├── /knowledge      ← Deal learnings index
│   └── /knowledge/onboarding ← Onboarding patterns
└── /settings           ← User management, preferences
```

---

### 4.3 Page Specifications

**`/dashboard`**
Purpose: instant operational awareness on open.

Layout: 4-section grid
- **Section 1 — Pipeline summary:** Card row showing lead count per stage. Clicking a stage navigates to `/pipeline?stage=X`.
- **Section 2 — Critical flags:** Table of all agent_reports where flagged=true, sorted by flag_level DESC, created_at DESC. Columns: level badge, agent name, summary, time ago, link to related entity.
- **Section 3 — Open approvals:** Count badge + list of pending approvals with urgency level and action summary. Clicking navigates to `/approvals`.
- **Section 4 — Agent status:** Card per agent showing slug, status badge, last report timestamp. At-a-glance team health.

Realtime: Section 2 (critical flags) and Section 3 (approvals) subscribe to Supabase Realtime. New flags appear without refresh.

---

**`/pipeline`**
Purpose: full pipeline visibility and navigation.

Table columns: Company name | Sector | Stage (badge) | Assigned agent | Last activity | Days in stage | Actions
Filters: stage (multi-select), sector, qualified (yes/no/all), stall flagged
Search: company name, contact name
Sort: last activity (default), created at, days in stage
Pagination: 25 per page

---

**`/pipeline/:id`**
Purpose: full lead record.

Sections:
- Header: company, contact, sector, current stage badge, assigned agent
- Stage history: timeline component showing every stage change with agent and timestamp
- Qualification: SDR brief fields rendered from `sdr_brief` jsonb
- MEDDIC: AE discovery fields rendered from `meddic` jsonb — each field with value and notes
- Proposals: table of all proposals for this lead with status and outcome
- Activity log: `agent_logs` entries for this lead, newest first

---

**`/clients`**
Purpose: full client visibility.

Table columns: Company | Sector | Health status (badge, colour-coded) | Contract end | Monthly value (masked by default — click to reveal) | AM assigned | Last health check
Filters: health status, sector, onboarding complete (yes/no)
Default sort: health status (Critical first), then contract end ascending

---

**`/clients/:id`**
Purpose: full client record.

Sections:
- Header: company, contact email, sector, health status badge, contract dates, monthly value
- Health history: chart of health_status over time from `client_health_history`
- Signal detail: last health check — four signals rendered as green/yellow/red indicators
- Invoices: table of all invoices for this client — status, due date, overdue days
- Onboarding: progress timeline if onboarding_complete = false, summary if complete
- Agent reports: all reports related to this client

---

**`/proposals`**
Purpose: full proposal visibility and gate tracking.

Table columns: Company | Version | Status (badge) | Value | Gate: ATLAS | Gate: Legal | Gate: Finance | Boss approved | Sent | Outcome
Filter: status, outcome
Default sort: updated_at DESC

Gate columns: green check if cleared, amber clock if pending, red X if not required/blocked

---

**`/invoices`**
Purpose: financial status at a glance.

Summary bar: Total outstanding | Overdue total | Due in 30 days | Received this month

Table columns: Client | Reference | Amount | Due date | Status (badge) | Overdue days | Flag level
Filter: status, flag level
Default sort: overdue_days DESC (most overdue first)

Note: invoice amounts are financial data — displayed only to authenticated authorised users. RLS enforces this.

---

**`/agents`**
Purpose: team status overview.

Card grid (one per agent): name, status badge, model, last report timestamp, calibration status indicator
Click navigates to `/agents/:slug`

---

**`/agents/:slug`**
Purpose: deep visibility into a single agent.

Sections:
- Identity: slug, name, type, status, model, workspace path
- Calibration: status badge, calibration gate definition, times used counter
- Recent reports: last 10 `agent_reports` for this agent, rendered by report_type
- Activity log: last 50 `agent_logs` for this agent
- Learnings: content of the agent's `memory/learnings.md` file (read from filesystem via HERMES — not in DB)

---

**`/approvals`**
Purpose: approve or reject pending actions.

Table: All approvals, sorted by created_at DESC
Columns: Urgency badge | Action summary | Recipient | Status | Created | Decision
Row expand: full approval details — context, draft content, risks, alternatives

Actions on pending approvals: [Approve] [Reject] buttons — writes decision to `approvals` table, triggers HERMES via Supabase Realtime subscription on PC2.

Filter: status (pending / approved / rejected / expired)

---

**`/knowledge`**
Purpose: commercial intelligence accumulated over all deals.

Deal learnings: table of `deal_learnings` — outcome badge, company (from lead), sector, key learning, created_at
Filters: outcome (won/lost), sector, competitor involved
Charts: win rate over time, loss reasons breakdown, deal velocity distribution

Onboarding patterns: table of `onboarding_patterns` — health at Day 30 badge, company (from client), time to value, key learning
Charts: Day 30 health distribution, time-to-value distribution

---

**`/settings`**
Purpose: user and system configuration.

Sections:
- Account: email, password change
- Notifications: (future) email or Discord notification preferences
- Users: list of authorised users (future: invite, remove)

---

### 4.4 Design System

**Colour palette:**
- Background: `zinc-950` (near-black)
- Surface: `zinc-900` (cards, panels)
- Border: `zinc-800`
- Text primary: `zinc-50`
- Text secondary: `zinc-400`
- Accent: `indigo-500` (primary actions, links)
- Success/Healthy: `emerald-500`
- Warning/At Risk: `amber-500`
- Critical: `red-500`
- Informational: `sky-500`

Dark theme only for V1. The backoffice is an internal operations tool — dark is appropriate and easier on long-session eyes.

**Typography:**
- Font: Geist Sans (Next.js default, Vercel's open-source font)
- Mono: Geist Mono (for IDs, code, API keys)
- Scale: Tailwind defaults

**Component library: shadcn/ui**
Components to install: Button, Card, Table, Badge, Dialog, Sheet, Tabs, Select, Input, Form, Separator, Dropdown Menu, Toast, Skeleton, Avatar, Progress, Tooltip

**Status badges:**
All status values are rendered as consistent badges with colour coding:
- `healthy` / `active` / `paid` / `approved` → emerald
- `at_risk` / `idle` / `pending` → amber
- `critical` / `built_not_calibrated` / `overdue` / `rejected` → red
- `offline` / `archived` / `expired` → zinc

---

## 5. Product and Design Process

### 5.1 What Is Needed

Two distinct roles are required. They are often confused. Both are necessary.

**Product Designer (strategic)**
Defines what the product is before any code is written. Responsible for information architecture, user flows, wireframes, and prioritisation. This role should be engaged before development starts. Building without clear product decisions means rebuilding during development.

This specification covers the information architecture. The product designer's job is to validate it against actual usage patterns and produce wireframes that the developer builds from.

**UI / Visual Designer (execution)**
Makes the product look correct. Responsible for the visual design system, high-fidelity mockups, and Figma developer handoff. This role can overlap with the product designer or be separate.

For V1, the pragmatic path: build functional using shadcn/ui components first. The product is useful immediately. Bring in a visual designer when the product is validated and it is time to polish for broader use.

### 5.2 Tooling

- **Figma** — design tool for both wireframes and final designs. Collaborative, supports developer handoff with inspect panel and variables.
- **FigJam** — information architecture and flow mapping, built into Figma.

---

## 6. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE (Core)                               │
│         PostgreSQL · Auth · Realtime · REST API · RLS               │
│                    github: command-center                           │
└─────────┬───────────────────────────────────────┬───────────────────┘
          │ writes                                 │ reads (realtime)
          │                                        │
┌─────────▼──────────────┐               ┌─────────▼──────────────────┐
│  HERMES + 7 agents     │               │  BACKOFFICE                 │
│  PC2 · OpenClaw        │               │  Next.js · Vercel           │
│  Tailscale: hermes.ts  │               │  Authorised users only      │
│                        │               │                             │
│  Writes:               │               │  Reads:                     │
│  · leads + stages      │               │  · all tables               │
│  · proposals + gates   │               │  · realtime subscriptions   │
│  · clients + health    │               │  · agent reports            │
│  · invoices + flags    │               │                             │
│  · agent reports/logs  │               │  Actions:                   │
│  · approvals           │               │  · approve / reject         │
│  · heartbeats          │               │    (writes to approvals)    │
└────────────────────────┘               └────────────────────────────┘
                                                      │
                              ┌───────────────────────┼───────────────────────┐
                              │                       │                       │
                    ┌─────────▼──────┐   ┌────────────▼──────┐  ┌────────────▼──────┐
                    │ CLIENT PORTAL  │   │ BILLING DASHBOARD │  │ ATLAS DASHBOARD   │
                    │ (future)       │   │ (future)          │  │ (future)          │
                    └────────────────┘   └───────────────────┘  └───────────────────┘
```

---

## 7. Implementation Phases

### Phase 1 — Database Foundation
Tables: `agents`, `agent_logs`, `leads`, `lead_stage_history`
Deliverables: Supabase migrations, seed file for agents table, HERMES can write lead events to DB via REST API, markdown pipeline files remain as backup
Estimated effort: 2–3 days

### Phase 2 — Commercial Tables
Tables: `proposals`, `clients`, `client_health_history`, `invoices`, `approvals`, `agent_reports`, `heartbeats`
Deliverables: full schema live, HERMES writes all pipeline events to DB, Finance Agent writes invoice records
Estimated effort: 3–4 days

### Phase 3 — Backoffice V1
Pages: Dashboard, Pipeline, Clients, Agents
Auth: Supabase Auth, two user accounts
Hosting: PC2 port 9069, access via SSH tunnel or Tailscale
Estimated effort: 1–2 weeks

### Phase 4 — Backoffice Full
Pages: Proposals, Invoices, Approvals, Knowledge, Settings
Realtime: Dashboard and Approvals subscribe to Supabase Realtime
Approvals flow: approve/reject in UI writes to DB, HERMES executes
Estimated effort: 1–2 weeks

### Phase 5 — Intelligence Layer
Charts: conversion rates, deal velocity, health score trends, revenue
Knowledge base: deal learnings and onboarding patterns in UI
Market intelligence: intel scan reports surfaced in backoffice
Estimated effort: 1 week

---

## 8. Open Questions

The following must be answered before implementation begins. Nothing is assumed.

**Q1. Who builds this?**
Is ATLAS building the frontend and backend? Is someone external? Is one of the authorised users building it? This determines how much specification detail is needed before code starts, and whether Figma designs are required first.

**Q2. Priority page**
If only one page could be live tomorrow, which is it? Pipeline overview, agent status, or open approvals? This defines Phase 3 build order.

**Q3. Realtime — required for V1?**
Live updates without refresh add implementation complexity. Is it acceptable to reload pages manually in V1 and add realtime in Phase 4?

**Q4. Mobile requirement**
Desktop-only for V1, or must the backoffice be usable on a phone? This fundamentally affects layout decisions for every page.

**Q5. Approvals in the UI — V1 or later?**
Discord-based approval (✅ reaction) is fully operational today. Is building the approve/reject flow in the backoffice a V1 requirement, or is Discord sufficient until Phase 4?

**Q6. Row-level security**
Recommended to enable from day one — once client data enters the system, RLS ensures it is never accidentally exposed. Is there any reason to defer it?

**Q7. Supabase Auth for the backoffice**
Two user accounts needed. Email + password, or Google OAuth login? Google OAuth is one config change in Supabase.

**Q8. Process manager for the Next.js app on PC2**
The app runs on PC2 port 9069. For reliability, it should run under a process manager so it survives reboots. Options: PM2 (lightweight, Node-native), or a user systemd service (same approach as the OpenClaw gateway). Which is preferred?

**Q9. ATLAS schema review**
ATLAS is the Development Director. Should ATLAS review this schema before Phase 1 migrations run? If ATLAS will own the technical implementation, his input on the DB design matters before it is locked.

---

*This document is a living specification. It is updated as decisions are made. Nothing in Supabase or Next.js has been built yet. Answer the open questions and implementation begins.*
