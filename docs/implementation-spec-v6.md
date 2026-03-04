# Command Center — Implementation Spec V6
**Version:** 6.0
**Status:** ACTIVE
**Supersedes:** implementation-spec-v5.md
**Date:** 2026-03-04
**Prepared by:** HERMES

> V6 closes the loop. V1–V5 built the interface and connected it to live data. V6 makes Command Center the operational layer that HERMES actually uses to run the commercial department: approval decisions that HERMES can read programmatically, a Brave API web search integration that unblocks Market Intelligence, a proper notification system, a CRM-grade lead detail view, and the first version of the website-to-pipeline integration. V6 also cleans up every known issue from prior versions and completes the mobile experience.

---

## 0. V5 Issues to Fix First

### 0.1 Approval Decision API — HERMES Integration
**File:** `src/app/api/hermes/approval-decision/route.ts`
The route exists but HERMES has no skill to call it. This is a dead endpoint until:
1. Add to OpenClaw env: `COMMAND_CENTER_API_TOKEN` (Bearer token for HERMES → Command Center auth)
2. Create `workspace/skills/command-center-read/SKILL.md` — teaches HERMES to poll `/api/hermes/approval-decision` and read pending approval decisions
3. This is an ATLAS-side task (API design) but HERMES skill creation is in scope here

### 0.2 Supabase Types Drift
V5 manually updated `database.types.ts`. Next migration cycle will drift again. Fix:
- Add to `package.json` scripts: `"types": "supabase gen types typescript --linked > src/lib/database.types.ts"`
- Document in CLAUDE.md: run `pnpm types` after every migration

### 0.3 pnpm Not on PATH
`pnpm` is at `~/.nvm/versions/node/v22.22.0/bin/pnpm` but not in system PATH for the service user. Fix:
- Add to `/home/delphi/.bashrc`: `export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"`
- Or symlink: `ln -s ~/.nvm/versions/node/v22.22.0/bin/pnpm /usr/local/bin/pnpm` (requires sudo — flag to Boss)

### 0.4 Knowledge "Deal Learnings" Rename
V5 renamed knowledge entries to "deal learnings" in the UI but the underlying table is still `knowledge_entries`. This inconsistency will cause confusion as the KB grows. Decision: keep `knowledge_entries` as the DB table name. Update all UI copy to use "Knowledge Base" consistently — not "Deal Learnings".

---

## 1. Brave API Web Search Integration

### 1.1 Why This Matters
The Market Intelligence agent cannot do broad discovery scanning without web search. This is a named blocker in the research report. The Brave Search API costs $3/1000 queries — negligible at Delphi's usage level.

### 1.2 Config
Boss adds Brave API key via OpenClaw config:
```
BRAVE_API_KEY=<key from https://api.search.brave.com/>
```

### 1.3 Search Route Handler Enhancement
**File:** `src/app/api/search/route.ts` — extend to support external search

Add `?scope=external` query param:
```typescript
if (scope === 'external') {
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': process.env.BRAVE_API_KEY! }
  });
  const data = await res.json();
  return NextResponse.json({ results: data.web?.results ?? [] });
}
```

### 1.4 Market Intelligence Page
**New route:** `src/app/(app)/market-intelligence/page.tsx`

Features:
- Search bar → calls `/api/search?scope=external&q=<query>`
- Results displayed as cards: title, URL, snippet, date
- "Save to Knowledge Base" button on each result → fires `saveIntelligence(result)` server action → inserts into `knowledge_entries` with `category='market_intelligence'`
- Saved items appear in a "Saved Intelligence" panel below search
- Competitor quick-links: pre-built search buttons for known competitors (Zapier, Make.com, Cliniface)
- Sidebar: `{ href: "/market-intelligence", label: "Market Intel", icon: Telescope }` — between Knowledge and Agents

### 1.5 Sidebar Update
Add Market Intelligence nav item (20 total):
```typescript
{ href: "/market-intelligence", label: "Market Intel", icon: Telescope },
```

---

## 2. Website → Pipeline Integration

### 2.1 Context
Delphi will have a public website. When a prospect submits a contact form, it should land in the Command Center pipeline automatically. V6 builds the receiving end.

### 2.2 Inbound Lead Webhook
**New route:** `src/app/api/webhook/inbound-lead/route.ts`

```typescript
// POST /api/webhook/inbound-lead
// Body: { name, email, company, sector?, message?, source? }
// Auth: Bearer token (WEBHOOK_SECRET env var)

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  // Insert into leads table
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('leads').insert({
    company_name: body.company,
    contact_name: body.name,
    contact_email: body.email,
    sector: body.sector ?? 'unknown',
    stage: 'prospecting',
    source: body.source ?? 'website',
    notes: body.message,
    last_activity_at: new Date().toISOString(),
  }).select().single();
  // Also insert an agent_log entry (HERMES notification)
  await supabase.from('agent_logs').insert({
    agent_id: HERMES_AGENT_ID,
    level: 'info',
    message: `New inbound lead: ${body.company} (${body.email})`,
    metadata: { lead_id: data.id, source: body.source }
  });
  return NextResponse.json({ lead_id: data.id }, { status: 201 });
}
```

### 2.3 New DB Column
```sql
-- Migration: 20260304000019_v6_leads_source.sql
alter table public.leads add column if not exists source text default 'manual';
alter table public.leads add column if not exists contact_email text;
alter table public.leads add column if not exists contact_phone text;
create index if not exists idx_leads_source on public.leads(source);
```

### 2.4 Lead Detail Page — Full CRM View
**File:** `src/app/(app)/pipeline/[id]/page.tsx` — full rebuild

Current state is minimal. V6 makes it a proper CRM record:

**Sections:**
1. **Header:** company name + sector badge + stage badge + score badge + assigned agent
2. **Contact info:** name, email, phone (masked → click to reveal), last contact date
3. **Stage timeline:** visual stepper showing all 8 stages, current highlighted, dates for completed stages
4. **MEDDIC panel:** 6-field grid (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion) — editable inline, saved via `updateMeddic(leadId, field, value)` server action
5. **Activity log:** timeline of all `lead_stage_history` entries + `agent_logs` referencing this lead_id
6. **Notes:** free-text notes, append-only log (same pattern as client notes)
7. **Documents:** list of associated proposals with status badges + links to `/proposals/[id]`
8. **Actions sidebar:** Advance stage button · Assign agent dropdown · Archive button · Create proposal button

### 2.5 New DB Tables
```sql
-- Part of 20260304000019_v6_leads_source.sql
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) not null,
  content text not null,
  author text not null default 'HERMES',
  created_at timestamptz not null default now()
);

create table if not exists public.lead_meddic (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) not null unique,
  metrics text,
  economic_buyer text,
  decision_criteria text,
  decision_process text,
  identify_pain text,
  champion text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_lead_notes_lead_id on public.lead_notes(lead_id);
alter table public.lead_notes enable row level security;
create policy "auth read lead_notes" on public.lead_notes for select to authenticated using (true);
create policy "service all lead_notes" on public.lead_notes for all to service_role using (true) with check (true);
alter table public.lead_meddic enable row level security;
create policy "auth read lead_meddic" on public.lead_meddic for select to authenticated using (true);
create policy "service all lead_meddic" on public.lead_meddic for all to service_role using (true) with check (true);
```

---

## 3. Notifications System

### 3.1 In-App Notification Bell
Add a notification bell icon to the header (next to theme toggle and search). Shows unread count badge.

**DB Table:**
```sql
-- Migration: 20260304000020_v6_notifications.sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  kind text not null check (kind in ('approval', 'alert', 'lead', 'system', 'agent')),
  read boolean not null default false,
  read_at timestamptz,
  entity_type text,
  entity_id uuid,
  entity_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_read on public.notifications(read, created_at desc);
alter table public.notifications enable row level security;
create policy "auth read notifications" on public.notifications for select to authenticated using (true);
create policy "service all notifications" on public.notifications for all to service_role using (true) with check (true);
```

### 3.2 Notification Sources
Auto-create a notification when:
- New approval request created → `kind='approval'`, `entity_url='/approvals'`
- New critical/high alert event → `kind='alert'`, `entity_url='/alerts'`
- New inbound lead via webhook → `kind='lead'`, `entity_url='/pipeline/[id]'`
- Agent offline (no heartbeat 24h) → `kind='agent'`, `entity_url='/agents/[slug]'`

All done via DB triggers or server actions that write to both the primary table and `notifications`.

### 3.3 Notification Panel Component
**File:** `src/components/notification-bell.tsx` ("use client")
- Bell icon with unread count badge (red if > 0)
- Click → dropdown panel: last 10 notifications, grouped by kind
- Each item: icon + title + body + time ago + click navigates to entity_url
- "Mark all read" button → bulk update
- Realtime subscription on `notifications` table INSERT

### 3.4 Route Handler
`PATCH /api/notifications/[id]/read` — marks single notification read
`PATCH /api/notifications/read-all` — marks all read

---

## 4. Proposals — Full Build

V2–V5 created the proposals page but it remains mostly read-only. V6 makes it functional.

### 4.1 Proposal Creation Flow
**File:** `src/app/(app)/proposals/new/page.tsx`

Multi-step form:
1. **Step 1 — Select Lead:** Dropdown of leads in `needs_analysis` or `proposal_sent` stages
2. **Step 2 — Proposal Details:** Title, description, scope (textarea), pricing (masked input), SLA terms
3. **Step 3 — ATLAS Trigger:** Optional — if technical scope, generates `ae-atlas-trigger.md` format for ATLAS briefing (displayed, not sent)
4. **Step 4 — Review:** Summary view of all fields. "Submit for HERMES Review" button.

Server action: `createProposal(formData)` → inserts proposal, advances lead to `proposal_sent` stage, creates notification.

### 4.2 Proposal Detail View
**File:** `src/app/(app)/proposals/[id]/page.tsx` — rebuild

Sections:
- Status timeline: Draft → In Review → Approved → Sent → Won/Lost
- Proposal content display (title, scope, pricing masked, SLA)
- Associated lead card with link
- Gate status tracker: ATLAS | Legal | Finance — each with status badge (pending/approved/not required)
- Activity log: stage changes, approval events
- Actions: "Mark as Sent" · "Mark as Won" · "Mark as Lost" (with reason input)

### 4.3 DB Schema Addition
```sql
-- Part of migration 20260304000020_v6_notifications.sql
alter table public.proposals
  add column if not exists scope_description text,
  add column if not exists sla_terms text,
  add column if not exists gate_atlas text check (gate_atlas in ('pending','approved','not_required')) default 'not_required',
  add column if not exists gate_legal text check (gate_legal in ('pending','approved','not_required')) default 'pending',
  add column if not exists gate_finance text check (gate_finance in ('pending','approved','not_required')) default 'pending',
  add column if not exists sent_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_reason text;
```

---

## 5. Invoices — Full Build

Currently a placeholder page. V6 makes it functional.

### 5.1 Invoice List Page
**File:** `src/app/(app)/invoices/page.tsx` — rebuild

Features:
- Filter: All | Pending | Paid | Overdue
- Table: Invoice # | Client | Amount (masked) | Due Date | Status | Days overdue
- "New Invoice" button → `/invoices/new`
- Overdue invoices highlighted (red row tint)
- Total outstanding MRR widget in header

### 5.2 Invoice Creation
**File:** `src/app/(app)/invoices/new/page.tsx`

Fields: Client (select) · Invoice number (auto-generated: `INV-YYYY-MM-NNN`) · Amount · Due date (default: today + 14 days) · Description · Notes
Server action: `createInvoice(formData)` → inserts, creates notification if overdue at creation (edge case).

### 5.3 DB Schema
```sql
-- Part of migration 20260304000021_v6_invoices.sql
alter table public.invoices
  add column if not exists invoice_number text unique,
  add column if not exists description text,
  add column if not exists notes text,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_method text;

create or replace function public.generate_invoice_number()
returns trigger language plpgsql as $$
declare
  seq_num integer;
begin
  select count(*) + 1 into seq_num
  from public.invoices
  where extract(year from created_at) = extract(year from now());
  new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(seq_num::text, 3, '0');
  return new;
end;
$$;

create trigger set_invoice_number
  before insert on public.invoices
  for each row
  when (new.invoice_number is null)
  execute function public.generate_invoice_number();
```

---

## 6. Dashboard — Metrics That Matter

Current dashboard KPI cards show counts. V6 adds the commercial metrics Boss actually cares about.

### 6.1 New KPI Cards
Replace generic counts with:
- **MRR** — sum of active client monthly values (from invoices where status='paid' in last 30d)
- **Pipeline Value** — sum of leads in `proposal_sent` + `negotiation` stages × EUR 300
- **Win Rate (30d)** — closed_won / total_closed in last 30 days
- **Avg Deal Cycle** — mean days from `initial_contact` to `closed_won`
- **Agent Cost MTD** — sum of `agent_token_usage.cost_usd` since start of month
- **Open Alerts** — count of unresolved alert_events (existing, keep)

### 6.2 Activity Feed — Real Events
The activity feed currently shows `agent_logs`. V6 adds a unified feed that merges:
- `agent_logs` (agent activity)
- `lead_stage_history` (pipeline movements)
- `approvals` status changes
- `alert_events` (new alerts)

**Route Handler:** `GET /api/activity-feed?limit=20` — queries all 4 tables, merges, sorts by `created_at desc`, returns unified format.

**File:** `src/app/(app)/dashboard/_components/activity-feed.tsx` — rewrite to use this endpoint.

### 6.3 30-Day Pipeline Chart
Add a bar chart to dashboard showing new leads per day (last 30 days). Uses Recharts BarChart. Server component fetches `leads` grouped by `created_at::date`.

---

## 7. Agent Fleet Panel Enhancements

### 7.1 Agent List Page — Status Dashboard
**File:** `src/app/(app)/agents/page.tsx` — rebuild

Layout: card grid (4 columns desktop, 2 tablet, 1 mobile)

Each agent card:
- Emoji + name + status dot
- Status badge: active (green) / idle (amber) / built_not_calibrated (zinc)
- Last heartbeat: "X minutes ago" or "Never"
- Calibration progress: mini progress bar (gates completed/total)
- Token cost MTD: from `agent_token_usage` for this month
- "View Details" button → `/agents/[slug]`

### 7.2 Agent Detail — Token Usage Chart
**File:** `src/app/(app)/agents/[slug]/page.tsx`

Add Recharts AreaChart showing this agent's daily token cost over last 30 days. Fetches from `agent_token_usage` grouped by date.

### 7.3 Heartbeat Tracker
Add to agent detail: last 7 heartbeats displayed as a row of colored dots (green = on time, amber = late, red = missed). Pull from `agent_logs` where `message = 'heartbeat'`.

---

## 8. Audit Log — Filter & Export

**File:** `src/app/(app)/audit-log/page.tsx` — add filtering and export

### 8.1 Filters
- Date range picker (from/to)
- Entity type filter (lead, client, proposal, approval, agent)
- Action type filter
- Text search

### 8.2 Export
"Export CSV" button → `GET /api/audit-log/export?from=&to=&entity_type=` → streams CSV download.
Columns: timestamp, entity_type, entity_id, action, actor, old_value, new_value.

---

## 9. Database Migrations for V6

| File | Contents |
|---|---|
| `20260304000019_v6_leads_crm.sql` | leads ALTER (source, contact_email, contact_phone) + lead_notes + lead_meddic + RLS |
| `20260304000020_v6_notifications.sql` | notifications table + RLS + proposals ALTER (gates, sent_at, closed_at) |
| `20260304000021_v6_invoices.sql` | invoices ALTER + invoice_number trigger |

After migrations:
```bash
pnpm types  # or: npx supabase gen types typescript --linked > src/lib/database.types.ts
```

New packages:
```bash
pnpm add react-day-picker  # for date range picker in audit log
```

---

## 10. New Sidebar (21 items)

```typescript
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/office", label: "The Office", icon: Building2 },
  { href: "/pipeline", label: "Pipeline", icon: Target },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/market-intelligence", label: "Market Intel", icon: Telescope },  // NEW
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/sessions", label: "Sessions", icon: Monitor },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/gateway", label: "Gateway", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
];
```

Header: notification bell (left of theme toggle).

---

## 11. CLAUDE.md Updates Required

Add to CLAUDE.md:
1. V6 feature list
2. New tables: lead_notes, lead_meddic, notifications, invoice trigger
3. New packages: react-day-picker
4. Webhook pattern: inbound-lead endpoint
5. `pnpm types` script for type regeneration
6. HERMES polling endpoint authentication pattern
7. Brave Search API integration pattern

---

## 12. Definition of V6 Done

- [ ] `pnpm build` clean — no TypeScript errors
- [ ] All 21 pages render without error (20 existing + market-intelligence)
- [ ] Inbound lead webhook: POST to `/api/webhook/inbound-lead` creates a lead record
- [ ] Lead detail page: MEDDIC panel editable, activity log shows stage history, notes work
- [ ] Market Intelligence page: Brave search returns results, "Save to KB" works
- [ ] Notification bell: shows unread count, dropdown renders last 10 notifications
- [ ] New approval → notification created and appears in bell
- [ ] Proposal creation flow: 4-step form completes, proposal saved, lead advanced
- [ ] Proposal detail: gate status tracker renders (ATLAS/Legal/Finance)
- [ ] Invoice list: all filter states work (All/Pending/Paid/Overdue)
- [ ] Invoice creation: auto-generates invoice number (INV-YYYY-NNN format)
- [ ] Dashboard: MRR, pipeline value, win rate, agent cost MTD KPI cards render
- [ ] Dashboard: unified activity feed shows events from all 4 sources
- [ ] Agent list: all 8 agents shown as cards with calibration progress and MTD cost
- [ ] Agent detail: token usage chart renders (30-day area chart)
- [ ] Audit log: date range filter works, CSV export downloads
- [ ] All 3 V6 migrations applied to Supabase
- [ ] `database.types.ts` regenerated with V6 tables
- [ ] Service HTTP 200 on port 9069
- [ ] hermes-report-v6.md committed
