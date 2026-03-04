# Command Center V3 — Preliminary Specification

**Status:** PRELIMINARY — Will be updated after V2 verification  
**Last Updated:** 2026-03-04  
**Author:** HERMES (Commercial Director)  
**Source:** Mission Control (builderz-labs) analysis + Command Center V2 insights

---

## Source Attribution

This V3 specification is informed by analysis of **[Mission Control](https://github.com/builderz-labs/mission-control)** — an open-source dashboard for AI agent orchestration built with Next.js, React 19, TypeScript, and SQLite.

Mission Control demonstrates powerful patterns for:
- Multi-column workflow tracking with drag-and-drop status progression
- Role-based access control with fine-grained permissions
- Webhook delivery with exponential backoff and circuit breaker
- Background task scheduling and automation
- WebSocket + Server-Sent Events for real-time updates
- Token/cost tracking with per-model breakdowns
- Quality gates that enforce review/approval workflows
- Agent SOUL system for personality/capability management
- Inter-agent messaging and coordination
- Direct CLI integration without gateway requirement

Key architectural insights:
- SQLite (better-sqlite3, WAL mode) proves sufficient for complex dashboards
- Zustand for client-side state management
- Zod for validation throughout
- Recharts for financial/metrics visualization
- Ed25519 device identity for secure handshakes

---

## What V2 Delivers (Placeholder)

**To be confirmed after V2 implementation verification.**

Current V2 spec promises:
- ✅ Supabase database schema with 13 tables (agents, leads, proposals, clients, approvals, knowledge)
- ✅ Next.js 16 app router with authenticated pages
- ✅ Dashboard with pipeline summary, critical flags, approvals, agent status
- ✅ Pipeline page with lead management and stage filtering
- ✅ Approvals page with decision gates
- ✅ Knowledge base for deal learnings
- ✅ Server actions for CRUD operations
- ✅ Soft delete patterns and indexes
- ✅ Stage transition validation

---

## New Features from Mission-Control Analysis

### 1. Enhanced Quality Gates & Workflow

**What it does in Mission Control:**
- 6-column Kanban board: Inbox → Backlog → Todo → In-Progress → Review → Done
- Drag-and-drop status progression with validation
- Task blocking until review approval (quality gate)
- Comment threads on each task
- Priority levels and assignments
- Auto-advance after review sign-off

**How it would work in Command Center:**
- Extend approvals workflow from 2 states (pending/approved) to 6-stage workflow
- Proposals flow: Draft → Submitted → Opened → Reviewed → Negotiation → Closed
- Each stage transition can require specific approvals
- Add proposal comment threads (internal notes, objection tracking)
- Implement drag-and-drop for deal acceleration
- Auto-trigger next actions (e.g., "send follow-up email" after 5 days in Opened state)

**Implementation Complexity:** Medium  
**Priority:** High (directly improves deal velocity tracking and approvals workflow)

---

### 2. Webhook Delivery System with Reliability

**What it does in Mission Control:**
- Outbound webhooks with HMAC-SHA256 signature verification
- Delivery history and retry tracking
- Exponential backoff on failures
- Circuit breaker to pause delivery on repeated failures
- Configurable alert rules with cooldowns
- Manual retry capability

**How it would work in Command Center:**
- Webhook events: proposal_sent, proposal_opened, deal_closed, approval_needed, invoice_due
- Integrations with Slack, Discord, email services, HubSpot CRM
- Signature verification so external systems trust Command Center
- Track delivery success/failure rates per integration
- Auto-disable integration if >10 consecutive failures
- Dashboard widget showing integration health status
- Retry policy: exponential backoff up to 24 hours

**Implementation Complexity:** Medium  
**Priority:** High (enables real-time notifications to business partners)

---

### 3. Workflow Templates & Automation

**What it does in Mission Control:**
- Reusable workflow templates with configurable prompts and timeouts
- Template versioning and usage tracking
- Agent-specific workflows
- Template parameters passed at runtime

**How it would work in Command Center:**
- Sales workflow templates:
  - "Initial Qualification" — auto-generate qualification summary
  - "Proposal Sent" — auto-compose follow-up email, set 5-day review reminder
  - "Negotiation" — auto-track objections, log pricing changes
  - "Onboarding Kickoff" — auto-generate onboarding checklist
- Each template stores: name, description, trigger event, required actions, success criteria
- Templates are versioned (v1, v2, etc.) for audit trail
- Track usage: which deals/approvals used which template version
- Allow customization per client (e.g., enterprise clients have different negotiation flow)

**Implementation Complexity:** Medium  
**Priority:** Medium (automation amplifies commercial execution)

---

### 4. Background Task Scheduler

**What it does in Mission Control:**
- Built-in scheduler for recurring tasks (backups, cleanup, monitoring)
- Configurable via UI or API
- Timezone-aware scheduling
- Task history and last-run tracking

**How it would work in Command Center:**
- Scheduled commercial tasks:
  - **Stall Detection:** Daily scan for leads >5 days no activity, flag as stalled
  - **Renewal Reminders:** Weekly check for clients within 90 days of renewal, queue approval requests
  - **Invoice Aging:** Daily check for invoices >30 days overdue, escalate to Boss
  - **Proposal Follow-up:** 48h after proposal sent, auto-check if opened; if not, auto-queue follow-up approval
  - **Cleanup:** Monthly soft-delete of archived records >6 months old
- Admin UI to view scheduled jobs, last runs, next scheduled time
- Failure notifications to #critical-alerts if a scheduled task fails

**Implementation Complexity:** Medium  
**Priority:** High (reduces manual work, improves response time)

---

### 5. Real-Time Updates with WebSocket + SSE

**What it does in Mission Control:**
- WebSocket connection to gateway for instant event delivery
- Server-Sent Events (SSE) for browser-to-client push
- Smart polling that pauses when user is idle (away)
- Live activity feed with timestamps

**How it would work in Command Center:**
- Real-time events:
  - Proposal opened → instant notification badge
  - Approval decision needed → real-time card update
  - Invoice paid → status badge updates to "paid"
  - Deal closed → celebration animation + confetti
- Live activity feed on dashboard showing last 20 commercial events (proposal sent, deal closed, invoice paid, approval approved)
- Activity filtering by type (proposals, deals, approvals, invoices)
- Timestamp relative display (e.g., "3 minutes ago")

**Implementation Complexity:** High  
**Priority:** Medium (UX enhancement; polling via Supabase Realtime is alternative for V2)

---

### 6. Enhanced Stall Detection & AI-Driven Insights

**What it does in Mission Control:**
- Records flagged with no activity >14 days
- Agent report system for critical issues
- Flag levels: CRITICAL, HIGH, MEDIUM, LOW
- Agent-generated insights on stalled tasks

**How it would work in Command Center:**
- Extend stall detection:
  - Lead stalled >5 days: auto-flag, suggest next action (send email, schedule call)
  - Proposal unopened >48h: flag as at-risk, suggest follow-up
  - Negotiation stalled >14 days: escalate to Boss
- AI insights (via Claude):
  - Auto-draft follow-up email based on stall reason
  - Suggest objection handling based on deal history
  - Recommend pricing adjustment based on competitor data
- Flag dashboard showing all critical items with suggested actions

**Implementation Complexity:** Medium  
**Priority:** Medium (improves velocity tracking and decision-making)

---

### 7. Role-Based Access Control (RBAC) Refinement

**What it does in Mission Control:**
- Three roles: viewer (read-only), operator (read+write), admin (full access)
- Fine-grained permissions per endpoint
- Session + API key auth
- Google Sign-In with approval workflow

**How it would work in Command Center:**
- Extend current auth model (logged-in = full access) to:
  - **Viewer** — Read all data, no actions (for stakeholders, investors)
  - **Operator** — Full commercial access (SDRs, AEs, AMs)
  - **Admin** — Settings, user management, system logs
  - **Finance** — Read-only invoices/revenue, full access to approvals
- Add permission checks on every server action
- Audit log every change with user and role
- API key auth for external integrations (CI/CD, webhooks)

**Implementation Complexity:** Low (schema already supports role column)  
**Priority:** Low (defer post-V2)

---

### 8. Integration Extensibility Framework

**What it does in Mission Control:**
- Multi-gateway support (OpenClaw, others planned)
- Direct CLI integration without gateway
- Custom integration endpoints

**How it would work in Command Center:**
- CRM integrations: HubSpot, Salesforce sync (bidirectional)
- Communication: Slack notifications, Discord alerts
- Document generation: proposals, contracts from templates
- Calendar: sync with Outlook/Google Calendar for meeting scheduling
- Analytics: export deal pipeline to analytics platform
- Plugin architecture:
  - Each integration lives in `integrations/` directory
  - Standardized hook system (on_proposal_sent, on_deal_closed, etc.)
  - Webhook delivery as transport layer

**Implementation Complexity:** High  
**Priority:** Low (post-V3; focus on core workflows first)

---

### 9. Comprehensive Audit Logging

**What it does in Mission Control:**
- Audit log of all changes
- User identity on every action
- Timestamp and change details
- Exportable via API

**How it would work in Command Center:**
- Log every commercial action:
  - Lead stage change (with reason)
  - Proposal sent/opened/updated
  - Approval approved/rejected (with notes)
  - Invoice status change
  - Knowledge entry created/updated
- Fields: user_id, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address
- Compliance: audit logs never deleted (archived, not soft-deleted)
- Export API: CSV dump for compliance/financial review
- Dashboard view: filterable audit trail per deal/proposal/invoice

**Implementation Complexity:** Low  
**Priority:** Medium (important for compliance and troubleshooting)

---

### 10. Extensible Custom Fields

**What it does in Mission Control:**
- Agent SOUL system allows custom personality definitions
- SOUL files stored on disk, synced bidirectionally

**How it would work in Command Center:**
- Allow admins to define custom fields per entity (leads, proposals, clients):
  - Example: "industry_vertical" (select), "deal_discount_approval" (checkbox), "internal_notes" (text)
  - Custom field visibility rules (e.g., show discount_approval only to AEs and Boss)
  - Validation rules (e.g., discount_approval requires >20%)
- Store in schema with custom_fields table
- Values stored in JSONB on each entity

**Implementation Complexity:** Medium  
**Priority:** Low (post-V3; standard fields sufficient for launch)

---

## Database Additions

### V3 Schema (proposed SQL migrations)

```sql
-- Webhooks & Integrations (MIGRATION)
create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  event_types text[] not null,
  secret_key text not null unique,
  is_active boolean default true,
  retry_policy jsonb default '{"max_attempts": 5, "initial_delay_ms": 1000}'::jsonb,
  circuit_breaker_status text default 'healthy',
  last_delivery_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  event_id uuid not null,
  payload jsonb not null,
  http_status integer,
  error_message text,
  attempt_number integer default 1,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- Workflow Templates (MIGRATION)
create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trigger_event text not null,
  actions jsonb not null,
  success_criteria jsonb,
  is_active boolean default true,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scheduled Tasks (MIGRATION)
create table public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  task_type text not null,
  cron_expression text not null,
  is_active boolean default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_run_status text,
  last_run_error text,
  created_at timestamptz default now()
);

-- Activity Feed (MIGRATION)
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references auth.users(id),
  metadata jsonb,
  created_at timestamptz default now()
);

-- Audit Logging (MIGRATION - IMMUTABLE)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  change_reason text,
  ip_address text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_webhooks_active on public.webhooks(is_active) where is_active = true;
create index idx_webhook_deliveries_webhook_id on public.webhook_deliveries(webhook_id);
create index idx_webhook_deliveries_next_retry on public.webhook_deliveries(next_retry_at) where delivered_at is null;
create index idx_workflow_templates_trigger on public.workflow_templates(trigger_event);
create index idx_scheduled_tasks_next_run on public.scheduled_tasks(next_run_at) where is_active = true;
create index idx_activity_events_created_at on public.activity_events(created_at desc);
create index idx_activity_events_entity on public.activity_events(entity_type, entity_id);
create index idx_audit_log_created_at on public.audit_log(created_at desc);
create index idx_audit_log_user_id on public.audit_log(user_id);
```

---

## Architecture Improvements

### 1. Server Actions Organization
- Move server actions to `lib/actions/` with subdirectories: leads, proposals, approvals, etc.
- Centralize validation (Zod schemas)
- Standard error handling and revalidation patterns
- Type-safe result unions

### 2. Event-Driven Architecture
- Webhook system as backbone for integrations
- Activity events table as event log for audit trail
- Background scheduler consuming scheduled_tasks queue
- Real-time updates via activity_events table

### 3. Observability
- Structured logging with pino-like logger
- Metrics dashboard (webhook success rate, proposal velocity, approval latency)
- Error tracking and alerting for failed integrations
- SLO tracking: "95% of proposals opened within 24h"

### 4. Schema Organization
- Split migrations by domain: users.sql, commercial.sql, integrations.sql
- Immutable audit log (never soft-delete)
- Event-sourcing-ready activity_events table
- Temporal queries for historical analysis

---

## V3 Implementation Order (Proposed)

1. **Phase 1 (Weeks 1-2):**
   - Enhanced quality gates: 6-stage proposal workflow
   - Webhook delivery system (table schema + delivery engine)
   - Activity feed (real-time or poll-based)

2. **Phase 2 (Weeks 3-4):**
   - Background scheduler + stall detection task
   - Renewal reminders + invoice aging automation
   - Proposal follow-up automation (48h/5d/10d cadence)

3. **Phase 3 (Weeks 5-6):**
   - Workflow templates (proposal flow, negotiation flow)
   - Real-time updates (WebSocket or Supabase Realtime)
   - Audit logging

4. **Phase 4 (Weeks 7-8):**
   - RBAC refinement (viewer/operator/admin roles)
   - Integration extensibility (CRM, Slack, etc.)
   - Custom fields framework

5. **Phase 5 (Weeks 9-10):**
   - Analytics dashboard (conversion rates, deal velocity)
   - AI-driven insights (stall detection, objection handling)
   - Performance optimization (indexing, caching)

---

## Open Questions

**To be clarified once V2 is verified:**

1. **Realtime vs Polling:** Should Command Center use Supabase Realtime subscriptions or custom WebSocket layer?

2. **Webhook Delivery:** Where should webhook payload be generated? Should webhooks cover all commercial events or just critical ones?

3. **Background Scheduler:** Hosted in Next.js server, or separate worker? Should stall detection auto-trigger approvals?

4. **Workflow Templates:** Should templates be editable via UI or code-only? Should templates support conditional logic?

5. **RBAC Granularity:** Which roles see which entities? Should finance team see only approvals they own?

6. **Audit Trail Retention:** How long to retain audit logs? Should sensitive fields be redacted?

7. **Integration Priority:** Which 3 integrations first: Slack, HubSpot, Discord?

8. **Cost Tracking:** Per-team cost tracking needed, or company-wide only?

---

## Top 5 Most Valuable Ideas from Mission Control

1. **Webhook delivery with retry/circuit breaker** — Robust external integrations, audit trail of all communication
2. **Enhanced quality gates & Kanban workflow** — Improves deal velocity tracking and collaborative decision-making
3. **Background task scheduler** — Automates repetitive commercial tasks (stall detection, follow-ups, renewals)
4. **Real-time activity feed** — Transparency and team alignment on pipeline changes
5. **Comprehensive audit logging** — Compliance, forensics, and learning from past decisions

---

**Document Status:** Ready for team review  
**Next Steps:** Verify V2 implementation, prioritize V3 features, schedule kick-off
