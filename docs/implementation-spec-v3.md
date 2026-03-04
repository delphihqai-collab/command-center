# [ARCHIVED — See implementation-spec-v4.md]

# Command Center — Implementation Spec V3

**Version:** 3.0  
**Status:** ACTIVE  
**Supersedes:** implementation-spec-v2.md  
**Date:** 2026-03-05  
**Prepared by:** HERMES (Full Engineering Team Perspective)

> This document is the authoritative engineering specification for Command Center V3. It incorporates V2 verification findings, mission-control architecture patterns, and full-stack engineering standards across product, frontend, backend, DevOps, design, and QA. Claude Code and GitHub Copilot must implement exactly as specified here.

---

## 0. V2 Audit — What Was Built, What Needs Fixing

### 0.1 Page-by-Page Status

| Page/Feature | Status | Notes |
|---|---|---|
| **Dashboard** | ✅ COMPLETE | KPI cards, funnel chart, agent grid, activity feed all working. Suspense boundaries in place. |
| **Pipeline** | ✅ COMPLETE | Stage tabs, stall detection (>5d), quick advance, lead detail sheet all functional. Transition validation via DB trigger. |
| **Approvals** | ✅ COMPLETE | Card layout, approve/reject buttons with optimistic UI, auto-refresh 60s. Server actions verified. |
| **Knowledge** | ✅ COMPLETE | Search with URL params, server-side filtering across 4 fields, card layout with outcome badge. |
| **Agents** | ✅ COMPLETE | Grid layout with status badges, type, model display. Read-only listing. |
| **Settings** | ✅ COMPLETE | Account info, agents overview, system version, danger zone with sign-out confirmation. |
| **Clients** | ❌ MISSING | Schema exists, no UI implementation. No list, detail, or create pages. |
| **Proposals** | ❌ MISSING | Schema exists, no UI implementation. No list, detail, or create pages. |
| **Invoices** | ❌ MISSING | Schema exists, no UI implementation. No list, detail pages. |
| **Server Actions** | ✅ COMPLETE | advanceLeadStage, approveAction, rejectAction all implemented with auth & revalidation. |
| **Database Schema** | ✅ COMPLETE | 13 tables across 3 migrations. RLS policies, indexes, soft-delete, stage transitions all in place. |

### 0.2 Critical Fixes Required (P0)

1. **Missing Clients/Proposals/Invoices Pages** — Schema exists, no UI (3h fix)
2. **No Toast Notifications** — Users don't see success/error feedback (1h fix)
3. **No Pagination UI** — Lists can grow unbounded (3h fix)
4. **Approval Notes Missing** — No audit trail for decisions (0.5h fix)
5. **Indexes Need WHERE Clauses** — Performance issue with archived records (0.5h fix)

### 0.3 Technical Debt

1. **Agent logs unbounded growth** — No archival policy (implement Week 2)
2. **Knowledge search limited** — Only 4 fields vs 7+ available (implement Week 2)
3. **Lead detail sheet read-only** — No write actions (implement Week 3)
4. **No audit trail** — Actions not logged for forensics (implement Week 3)

---

## 1. Product Vision & Commercial Priorities

### 1.1 What Command Center Must Achieve

Command Center is the **single source of truth for commercial execution** at Delphi. Every decision flows through this system: lead qualification, proposal approval, deal closure, client health, invoice payment. V3 adds **reliability, automation, and transparency** via webhooks for integrations, background jobs for stall detection and renewals, and enhanced approval workflows. Result: faster deals, fewer dropped opportunities, confident forecasting.

### 1.2 V3 Feature Priority Matrix

| Feature | Business Value | Effort | Ship Order |
|---|---|---|---|
| **Clients/Proposals/Invoices Pages** | CRITICAL | 3h | 1st |
| **Toast Notifications** | CRITICAL | 1h | 2nd |
| **Pagination** | HIGH | 3h | 3rd |
| **Webhook System** | HIGH | 8h | 4th |
| **Background Jobs** | HIGH | 6h | 5th |
| **Real-Time Updates** | MEDIUM | 10h | 6th |
| **Audit Logging** | MEDIUM | 3h | 7th |
| **RBAC** | LOW | 4h | Post-V3 |

---

## 2. Database Architecture

### 2.1 Schema Audit (Current State)

**Strengths:**
- 13 tables across 3 migrations
- Proper RLS policies
- Soft delete support (archived_at)
- Audit tables (immutable)
- Stage transition validation via trigger
- Indexes on high-cardinality columns

**Issues Found:**
1. Missing `approval_notes` field → no decision audit trail
2. Missing `reason` field on lead_stage_history → can't track why stage changed
3. `idx_leads_last_activity` needs WHERE archived_at IS NULL clause
4. No full-text index on knowledge → search limited to 4 fields
5. No webhook tables (V3 addition)
6. No activity_events table for real-time feed (V3 addition)

### 2.2 New Tables for V3

```sql
-- Webhooks with delivery retry logic
create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text not null,
  event_types text[] not null,
  secret_key text not null unique,
  is_active boolean default true,
  max_retries integer default 5,
  circuit_breaker_status text default 'healthy',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhook delivery history (for retry logic)
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
  created_at timestamptz not null default now()
);

-- Real-time activity events for transparency
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references auth.users(id),
  actor_email text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Immutable audit log for compliance
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  user_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  change_reason text,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Background task tracking
create table public.scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  task_type text not null,
  cron_expression text not null,
  is_active boolean default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_run_status text,
  last_run_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 2.3 Fixes to Existing Schema

```sql
-- Add missing fields
alter table public.approvals add column if not exists approval_notes text;
alter table public.lead_stage_history add column if not exists reason text;

-- Fix indexes with WHERE clauses
drop index if exists idx_leads_last_activity;
create index idx_leads_last_activity on public.leads(last_activity_at desc) where archived_at is null;

create index if not exists idx_approvals_pending_urgency on public.approvals(status, urgency) where status = 'pending';
create index if not exists idx_invoices_due_date on public.invoices(due_date) where status != 'paid';
```

---

## 3. Frontend Architecture

### 3.1 Pages to Build (P0)

**Clients Page:**
- Table: company_name, industry, health_status, monthly_value, renewal_date
- Filter: by health status
- Detail page: full context, linked proposals, onboarding status
- Time estimate: 2h

**Proposals Page:**
- Table: lead company, status, value, probability, sent_at, opened_at, outcome
- Detail page: full timeline (sent/opened/closed dates), decision notes
- Recharts timeline visualization
- Time estimate: 2h

**Invoices Page:**
- Table: client name, amount, due_date, status, flag_level
- Overdue invoices show red border
- Detail page: payment terms, reminder history
- Time estimate: 1h

### 3.2 Core Features (All Phases)

**Pagination (P0):**
- Cursor-based (not offset/limit)
- Format: `cursor = Base64(lastId|lastSortValue)`
- "Load More" button UI
- Applies to: Knowledge, Clients, Proposals, Invoices

**Forms & Validation (P0):**
- Zod schemas in `src/lib/schemas.ts`
- Client-side error display
- Server-side validation in actions
- Applies to: create-client, create-proposal, create-invoice

**Toast Notifications (P0):**
- Success: "Action completed ✓"
- Error: Show error message
- Wrap all server action calls

**Webhooks (P1):**
- Create, test, delete webhooks
- Event types: proposal_sent, proposal_opened, deal_closed, approval_approved, invoice_paid, etc.
- Delivery retry: exponential backoff up to 24h
- Circuit breaker: disable after 5 consecutive failures

**Background Jobs (P1):**
- Stall detection (daily): flag leads >5 days no activity
- Renewal reminders (daily): flag clients <30 days to renewal
- Invoice aging (daily): flag invoices >30 days overdue
- Proposal follow-ups (daily): check if opened, trigger follow-up

**Audit Logging (P2):**
- Log every action: who, what, when, why
- Immutable (no deletes)
- Dashboard: audit trail per entity

**Real-Time (P3):**
- Supabase Realtime subscriptions
- Activity feed updates live
- Approval decisions broadcast instantly
- Invoice payment status updates instantly

---

## 4. Server Actions (Complete List)

### Phase P0 (Week 1)

```typescript
// Already exist, improve with better error handling
export async function advanceLeadStage(leadId: string, toStage: string): Promise<ServerActionResult>
export async function approveAction(approvalId: string): Promise<ServerActionResult>
export async function rejectAction(approvalId: string): Promise<ServerActionResult>

// New in P0
export async function createClient(data: CreateClientInput): Promise<ServerActionResult<Client>>
export async function createProposal(data: CreateProposalInput): Promise<ServerActionResult<Proposal>>
export async function createInvoice(data: CreateInvoiceInput): Promise<ServerActionResult<Invoice>>
```

### Phase P1 (Week 2)

```typescript
export async function createWebhook(data: CreateWebhookInput): Promise<ServerActionResult<Webhook>>
export async function testWebhook(webhookId: string): Promise<ServerActionResult<{ statusCode: number }>>
export async function deleteWebhook(webhookId: string): Promise<ServerActionResult>
```

### Phase P2 (Week 3)

```typescript
// Background jobs (not server actions, run via cron)
export async function detectStalledLeads(): Promise<void>
export async function generateRenewalReminders(): Promise<void>
export async function checkInvoiceAging(): Promise<void>

// Audit logging helper
export async function logAuditEvent(userId: string, action: string, entityType: string, entityId: string, oldVals: any, newVals: any): Promise<void>
```

---

## 5. Design System & UX

### 5.1 Color Tokens (Dark Theme Only)

```
Background:      zinc-950 (sidebars, depth)
Card:            zinc-900 (panels, sections)
Border:          zinc-800 (dividers)
Text Primary:    zinc-50 (headings, main text)
Text Secondary:  zinc-400 (subtext)
Text Tertiary:   zinc-500 (metadata, hints)
Success:         emerald-400 (healthy, approved)
Warning:         amber-400 (at-risk, stalled, overdue)
Error:           red-500 (failed, danger)
Info:            indigo-400 (proposals, primary CTA)
```

### 5.2 Component Patterns

**Card:**
```tsx
<Card className="border-zinc-800 bg-zinc-900">
  <CardContent className="p-4">Content</CardContent>
</Card>
```

**Table:**
```tsx
<div className="rounded-lg border border-zinc-800 bg-zinc-900">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</div>
```

**Badge (Status):**
```tsx
<StatusBadge status="healthy" />
<Badge className="bg-red-500 text-white">Overdue</Badge>
```

**Loading State:**
```tsx
<Suspense fallback={<Skeleton className="h-40" />}>
  <Component />
</Suspense>
```

**Empty State:**
```tsx
<Card>
  <CardContent className="p-8 text-center">
    <Icon className="h-8 w-8 text-zinc-600 mx-auto" />
    <h3 className="text-sm font-medium text-zinc-50 mt-2">No items</h3>
  </CardContent>
</Card>
```

### 5.3 Micro-interactions

- Hover: `transition-colors duration-200 hover:border-zinc-700`
- Focus: `focus:ring-2 focus:ring-indigo-500`
- Transitions: All state changes animate smoothly
- Toast: Slide-in from bottom (sonner handles)

---

## 6. DevOps & Deployment

### 6.1 Build Process

```bash
cd /home/delphi/Documents/code/command-center

# Install deps
npm ci --omit=dev

# Type check
npx tsc --noEmit --skipLibCheck

# Build
npm run build

# Deploy
systemctl --user restart command-center

# Verify
curl http://127.0.0.1:9069/health
```

### 6.2 Environment Variables

**Build-time (baked into binary):**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
NEXT_PUBLIC_APP_ENV=production
```

**Runtime (from .env.local, not in git):**
```
SUPABASE_SERVICE_ROLE_KEY=[key]
DATABASE_URL=postgresql://...
```

### 6.3 Health Check & Logs

```bash
# Health
curl http://127.0.0.1:9069/health

# Logs
journalctl --user -u command-center -f
journalctl --user -u command-center -n 50
```

---

## 7. Quality Assurance

### 7.1 Critical Path Tests (Must All Pass)

1. **KPI Accuracy** — Create lead, verify +1 in "leads this week"
2. **Lead Advance** — Advance lead 2 stages, verify DB history recorded
3. **Approval Decision** — Approve approval, verify status updated, card removed
4. **Stall Detection** — Lead >5 days old shows red border + warning icon
5. **Activity Feed** — Perform action, verify appears in dashboard feed
6. **Client Health** — Mark client at_risk, verify badge + revenue sum updates
7. **Invoice Overdue** — Create overdue invoice, verify red border + AlertTriangle
8. **Pipeline Funnel** — All 9 stages visible, counts add correctly
9. **Knowledge Search** — Type "objection", verify filtered results appear
10. **Error Toast** — Trigger invalid action, verify error toast with message

### 7.2 Test Data Setup

```sql
insert into public.clients (company_name, industry, health_status, monthly_value) values
  ('Acme Corp', 'Tech', 'healthy', 5000),
  ('Beta Inc', 'Finance', 'at_risk', 3000),
  ('Gamma Ltd', 'Healthcare', 'healthy', 2000);

insert into public.leads (company_name, sector, stage, assigned_agent_id, last_activity_at) values
  ('Prospect A', 'Tech', 'prospecting', '[agent-id]', now()),
  ('Prospect B (Stalled)', 'Finance', 'proposal_sent', '[agent-id]', now() - interval '7 days'),
  ('Prospect C', 'Healthcare', 'negotiation', '[agent-id]', now());

insert into public.invoices (client_id, amount, due_date, status) values
  ('[client-id]', 5000, now() + interval '15 days', 'pending'),
  ('[client-id]', 3000, now() - interval '5 days', 'overdue');
```

### 7.3 Performance Targets

| Metric | Target |
|---|---|
| Dashboard Load | <2s |
| Pipeline Table | <1s (20 rows) |
| Approval Action | <500ms |
| Search Debounce | 300ms |
| DB Query | <100ms |

---

## 8. Implementation Checklist (Ordered)

### PHASE P0 (Week 1) — CRITICAL [~12h]

- [ ] **Add Clients Page** (2h)
  - [ ] Create `src/app/(app)/clients/page.tsx`
  - [ ] Create `src/app/(app)/clients/[id]/page.tsx`
  - [ ] Table: company_name, industry, health_status, monthly_value, renewal_date
  - [ ] Test: Click to detail, verify page loads

- [ ] **Add Proposals Page** (2h)
  - [ ] Create `src/app/(app)/proposals/page.tsx`
  - [ ] Create `src/app/(app)/proposals/[id]/page.tsx`
  - [ ] Status badges (sent=amber, won=green, lost=red)
  - [ ] Test: Click to detail, verify timeline renders

- [ ] **Add Invoices Page** (1h)
  - [ ] Create `src/app/(app)/invoices/page.tsx`
  - [ ] Create `src/app/(app)/invoices/[id]/page.tsx`
  - [ ] Overdue flagging (due_date < now = red border)
  - [ ] Test: Verify overdue invoice shows red

- [ ] **Add Toast Notifications** (1h)
  - [ ] Wrap all server actions with `toast.success()` / `toast.error()`
  - [ ] Test: Approve action, verify toast appears

- [ ] **Implement Pagination** (3h)
  - [ ] Create `src/lib/pagination.ts` with cursor helpers
  - [ ] Apply to Knowledge, Clients, Proposals, Invoices
  - [ ] "Load More" button UI
  - [ ] Test: Load Knowledge, verify pagination works

- [ ] **Fix Database Schema** (0.5h)
  - [ ] Add `approval_notes` column
  - [ ] Add `reason` column to lead_stage_history
  - [ ] Fix `idx_leads_last_activity` with WHERE clause
  - [ ] Regenerate types

- [ ] **Commit & Verify** (0.5h)
  - [ ] `npm run build` passes clean
  - [ ] `git add -A && git commit -m "feat: P0 — clients, proposals, invoices pages + toasts + pagination"`
  - [ ] `git push`

**P0 Completion:** All pages functional, no errors, clean build

---

### PHASE P1 (Week 2) — HIGH-VALUE [~15h]

- [ ] **Webhook System** (5h)
  - [ ] Run migration: create webhooks, webhook_deliveries tables
  - [ ] Server action: `createWebhook(data)`
  - [ ] Server action: `testWebhook(webhookId)`
  - [ ] Server action: `deleteWebhook(webhookId)`
  - [ ] Retry logic: exponential backoff, circuit breaker
  - [ ] Test: Create webhook, send test event

- [ ] **Scheduled Tasks Schema** (2h)
  - [ ] Run migration: create scheduled_tasks table
  - [ ] Seed 6 tasks (stall, renewals, invoices, etc.)
  - [ ] Verify: `select * from scheduled_tasks`

- [ ] **Stall Detection Job** (2h)
  - [ ] Create `src/lib/jobs/stall-detection.ts`
  - [ ] Query leads: `last_activity_at < now - 5 days`
  - [ ] Create agent_reports for each stalled lead
  - [ ] Test: Run manually, verify reports created

- [ ] **Activity Events Table** (3h)
  - [ ] Run migration: create activity_events table
  - [ ] Log all actions: lead_advanced, proposal_sent, approval_approved, etc.
  - [ ] Update Dashboard activity feed to use activity_events
  - [ ] Test: Perform 5 actions, verify feed updates

- [ ] **Full-Text Knowledge Search** (3h)
  - [ ] Extend search: include objections, MEDDIC fields
  - [ ] Implement via PostgreSQL tsvector OR fuse.js
  - [ ] Test: Search "objection handling", verify more results

**P1 Completion:** Webhook foundation working, jobs scheduled, activity feed live

---

### PHASE P2 (Week 3-4) — RELIABILITY [~12h]

- [ ] **Audit Logging** (3h)
  - [ ] Run migration: create audit_log table
  - [ ] Log all changes: user, action, old/new values
  - [ ] Dashboard: Audit Trail page
  - [ ] Test: Change lead stage, verify audit log entry

- [ ] **Error Boundary Improvements** (2h)
  - [ ] Handle 401 (redirect to login)
  - [ ] Handle 404 (go back)
  - [ ] Handle 500 (support link)
  - [ ] Test: Trigger errors, verify helpful UX

- [ ] **Form Validation** (3h)
  - [ ] Zod schemas: CreateClient, CreateProposal, CreateInvoice
  - [ ] Client-side error display
  - [ ] Test: Submit invalid data, verify errors shown

- [ ] **Lead Sheet Write Actions** (2h)
  - [ ] Add "Advance Stage" button in sheet
  - [ ] Add "Archive Lead" button
  - [ ] Sheet closes after action
  - [ ] Parent table refreshes
  - [ ] Test: Sheet advance updates table immediately

- [ ] **Renewal Reminder Job** (2h)
  - [ ] Create `src/lib/jobs/renewal-reminders.ts`
  - [ ] Flag clients <30 days to renewal
  - [ ] Create approval requests
  - [ ] Test: Run manually, verify approvals created

**P2 Completion:** Audit trail working, forms validated, all jobs scheduled

---

### PHASE P3 (Weeks 4-5) — REAL-TIME [~14h]

- [ ] **Real-Time Updates** (6h)
  - [ ] Supabase Realtime subscriptions on activity_events
  - [ ] Dashboard auto-updates when events arrive
  - [ ] No page refresh needed
  - [ ] Test: Event in one tab, second tab updates instantly

- [ ] **Enhanced Approval Workflow** (4h)
  - [ ] 6-stage approval gates (draft → submitted → reviewed → negotiation → finalized → closed)
  - [ ] Transition rules enforcement
  - [ ] Drag-to-advance UI (optional, low priority)
  - [ ] Test: Move approval through all stages

- [ ] **Analytics Dashboard** (4h)
  - [ ] New page: `/analytics`
  - [ ] Conversion rates (stage→stage %)
  - [ ] Deal velocity (avg days to close)
  - [ ] Win rate by sector
  - [ ] Charts: Recharts BarChart + LineChart
  - [ ] Test: Verify calculations match manual counts

**P3 Completion:** Real-time working, analytics live, enhanced workflows active

---

## 9. Definition of Done

V3 is **COMPLETE** when:

✅ **Product**
- [ ] All 9 pages render without error
- [ ] KPI counts are accurate
- [ ] Pipeline funnel shows all stages with correct counts
- [ ] Activity feed displays live events
- [ ] Stalled leads show visual warning
- [ ] Invoices >30 days overdue are flagged
- [ ] Clients <30 days to renewal trigger approvals
- [ ] Toast notifications fire on all actions

✅ **Technical**
- [ ] Build passes: `npm run build` (0 errors)
- [ ] Types pass: `npx tsc --noEmit`
- [ ] 18+ tables with RLS enabled
- [ ] All migrations apply cleanly
- [ ] Server actions follow standard pattern
- [ ] Suspense boundaries on all pages
- [ ] Pagination is cursor-based
- [ ] Forms validated with Zod
- [ ] No N+1 queries

✅ **QA**
- [ ] All 10 critical path tests pass
- [ ] Manual checklist complete
- [ ] No server errors in logs
- [ ] No console errors in browser
- [ ] Performance benchmarks met

✅ **DevOps**
- [ ] Service file verified
- [ ] Health check responsive
- [ ] Logs accessible
- [ ] Backup strategy confirmed
- [ ] Environment variables secured

✅ **Documentation**
- [ ] CLAUDE.md references v3
- [ ] All server actions documented
- [ ] Database schema documented
- [ ] Deployment steps documented

---

**Status:** Ready for implementation  
**Estimated Duration:** 4-5 weeks  
**Next:** Phase P0 (Week 1)
