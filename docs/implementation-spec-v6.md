# Command Center — Implementation Spec V6
**Version:** 6.0
**Status:** ACTIVE
**Supersedes:** implementation-spec-v5.md
**Date:** 2026-03-04
**Prepared by:** HERMES

> V6 lays the architectural foundation everything else will be built on: a multi-business model where Delphi runs multiple projects simultaneously with a shared agent pool. The sidebar is redesigned from 20 flat items into 5 labelled groups based on research across Linear, Vercel, Render, NNGroup, and industry patterns (Notion, GitHub, Stripe, Figma). V6 also delivers the first real CRM features — inbound leads from the website, full lead detail with MEDDIC, notifications, proposals and invoices as functional workflows, and dashboard metrics that reflect actual commercial activity.

---

## 0. V5 Fixes (Do First)

### 0.1 pnpm Not on PATH
Add to `/home/delphi/.bashrc`: `export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"`

### 0.2 Supabase Types Drift
Add to package.json scripts: `"types": "supabase gen types typescript --linked > src/lib/database.types.ts"`
Run `pnpm types` after every migration. Document in CLAUDE.md.

### 0.3 Knowledge "Deal Learnings" Naming
Rename all UI copy back to "Knowledge Base". Table name (`knowledge_entries`) stays.

---

## 1. Multi-Business Architecture (Build This First)

### 1.1 The Model

Delphi runs multiple businesses simultaneously. Each business is a project with its own pipeline, clients, proposals, and invoices. The agent pool is shared — the same SDR, AE, AM can work across all businesses because they are AI.

```
Agents (persistent, global pool)
├── HERMES 🪶 — always active, sees across ALL businesses
├── SDR 📞 — assigned to 1+ businesses
├── AE 🤝 — assigned to 1+ businesses
├── AM 👥 — assigned to 1+ businesses
└── Finance / Legal / MI / KC — assigned as needed

Businesses (grow over time)
├── Delphi Commercial (Portugal, dental/health)
├── [Future: Legal Firm Automation Spain]
└── [Future: ...]
```

An agent is not "inside" a business. It is assigned to one or more businesses and operates with that business's context when working on it. Identity, memory, and calibration are global. Work is scoped.

### 1.2 Database Migration: 20260304000019_v6_businesses.sql

```sql
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sector text,
  country text default 'PT',
  status text not null check (status in ('active','paused','archived')) default 'active',
  color text default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  business_id uuid references public.businesses(id) not null,
  role text,
  assigned_at timestamptz not null default now(),
  assigned_by text default 'HERMES',
  unique(agent_id, business_id)
);

-- Add business_id to all commercial tables
alter table public.leads add column if not exists business_id uuid references public.businesses(id);
alter table public.clients add column if not exists business_id uuid references public.businesses(id);
alter table public.proposals add column if not exists business_id uuid references public.businesses(id);
alter table public.invoices add column if not exists business_id uuid references public.businesses(id);
alter table public.knowledge_entries add column if not exists business_id uuid references public.businesses(id);

-- Add contact columns to leads
alter table public.leads
  add column if not exists source text default 'manual',
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

-- Lead CRM tables
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

-- Indexes
create index if not exists idx_leads_business_id on public.leads(business_id);
create index if not exists idx_clients_business_id on public.clients(business_id);
create index if not exists idx_proposals_business_id on public.proposals(business_id);
create index if not exists idx_invoices_business_id on public.invoices(business_id);
create index if not exists idx_agent_assignments_business_id on public.agent_assignments(business_id);
create index if not exists idx_lead_notes_lead_id on public.lead_notes(lead_id);

-- RLS (all tables)
alter table public.businesses enable row level security;
create policy "auth read businesses" on public.businesses for select to authenticated using (true);
create policy "service all businesses" on public.businesses for all to service_role using (true) with check (true);

alter table public.agent_assignments enable row level security;
create policy "auth read agent_assignments" on public.agent_assignments for select to authenticated using (true);
create policy "service all agent_assignments" on public.agent_assignments for all to service_role using (true) with check (true);

alter table public.lead_notes enable row level security;
create policy "auth read lead_notes" on public.lead_notes for select to authenticated using (true);
create policy "service all lead_notes" on public.lead_notes for all to service_role using (true) with check (true);

alter table public.lead_meddic enable row level security;
create policy "auth read lead_meddic" on public.lead_meddic for select to authenticated using (true);
create policy "service all lead_meddic" on public.lead_meddic for all to service_role using (true) with check (true);

-- Seed first business
insert into public.businesses (name, slug, description, sector, country, color) values
('Delphi Commercial', 'delphi-commercial', 'Core commercial pipeline — AI automation for Portuguese SMEs', 'technology', 'PT', '#6366f1');
```

### 1.3 Business Switcher Component

**File:** `src/components/business-switcher.tsx` ("use client")

- Fixed at top of sidebar, above all nav items
- Shows: `[color dot] Business Name ▾`
- Click: dropdown of active businesses + "Manage" link
- Selection stored in `localStorage` as `selected_business_id` + URL param `?b=<slug>`
- HERMES view: "All Businesses" option at top

**Context hook:** `src/lib/business-context.tsx` — React context providing `selectedBusinessId` / `setSelectedBusiness` throughout the app.

### 1.4 Data Scoping Pattern

```typescript
// src/lib/get-business-id.ts
export async function getSelectedBusinessId(searchParams?: { b?: string }): Promise<string>
// 1. Check URL param ?b=slug → look up ID
// 2. Fall back to first active business

// Every server component that queries commercial data:
const businessId = await getSelectedBusinessId(searchParams);
const leads = await supabase.from('leads').select('*').eq('business_id', businessId);
```

### 1.5 The Office — Multi-Business Agent View

Agent cards show:
- Status dot + name + emoji
- Business assignment tags (e.g. "Delphi Commercial")
- Last activity timestamp
- Assigned business count badge if agent works on 2+ businesses

---

## 2. Condensed Sidebar — 5-Group Navigation

**Research basis:** Linear (phase grouping, workspace switcher top of rail), Vercel (5-group model), Render (verb-based: create/configure/operate), NNGroup (visible labels beat icon rails — 80% screen attention goes left, labels beat icons for discoverability), Notion/GitHub/Stripe/Figma (all put workspace switcher at top of sidebar, settings at bottom).

**Verdict:** Single sidebar with 5 labelled groups. No icon rail. No accordion collapse. System section visually lighter but always visible.

### 2.1 Group Structure

| Group | Items | Rationale |
|---|---|---|
| HOME (no label) | Dashboard, The Office, Alerts, Chat | Ambient/pulse views — "what's happening now" |
| REVENUE | Pipeline, Clients, Proposals, Approvals, Invoices | Commercial funnel in sequence |
| INTELLIGENCE | Reports, Costs, Market Intel, Knowledge | Reference/insight — you come here to understand |
| AGENTS | Agents, Sessions, Memory | AI operation layer — unique to Command Center |
| SYSTEM (dimmed) | Logs, Audit Log, Gateway, Settings | Rarely used, operator-only |

### 2.2 Sidebar Implementation

**File:** `src/components/sidebar.tsx` — full rebuild

```typescript
const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/office", label: "The Office", icon: Building2 },
      { href: "/alerts", label: "Alerts", icon: Bell, badge: "alertCount" },
      { href: "/chat", label: "Chat", icon: MessageSquare },
    ]
  },
  {
    label: "Revenue",
    items: [
      { href: "/pipeline", label: "Pipeline", icon: Target },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/proposals", label: "Proposals", icon: FileText },
      { href: "/approvals", label: "Approvals", icon: ShieldCheck, badge: "approvalCount" },
      { href: "/invoices", label: "Invoices", icon: Receipt },
    ]
  },
  {
    label: "Intelligence",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/costs", label: "Costs", icon: DollarSign },
      { href: "/market-intelligence", label: "Market Intel", icon: Telescope },
      { href: "/knowledge", label: "Knowledge", icon: BookOpen },
    ]
  },
  {
    label: "Agents",
    items: [
      { href: "/agents", label: "Agents", icon: Bot },
      { href: "/sessions", label: "Sessions", icon: Monitor },
      { href: "/memory", label: "Memory", icon: Brain },
    ]
  },
  {
    label: "System",
    system: true,
    items: [
      { href: "/logs", label: "Logs", icon: ScrollText },
      { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
      { href: "/gateway", label: "Gateway", icon: Server },
      { href: "/settings", label: "Settings", icon: Settings },
    ]
  },
];
```

**CSS rules:**
- Section label: `text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-3 pt-4 pb-1`
- System label: `text-zinc-600` (one step dimmer)
- System items: `text-zinc-400` default (vs `text-zinc-100` for main items)
- Divider before System: `<Separator className="my-2 bg-zinc-800" />`
- Business switcher: `shrink-0`, fixed — never scrolls
- Nav body: `flex-1 overflow-y-auto` — scrollable
- Badges: `bg-zinc-700 text-zinc-200 text-[10px] rounded-full px-1.5 ml-auto`
- Sidebar width: 240px

### 2.3 Mobile Bottom Nav

```typescript
const mobileNavItems = [
  { href: "/dashboard", icon: LayoutDashboard },
  { href: "/pipeline", icon: Target },
  { href: "/approvals", icon: ShieldCheck },
  { href: "/alerts", icon: Bell },
  { href: "/office", icon: Building2 },
];
```

---

## 3. Inbound Lead Webhook

**File:** `src/app/api/webhook/inbound-lead/route.ts`

```
POST /api/webhook/inbound-lead
Auth: Authorization: Bearer ${WEBHOOK_SECRET}
Body: { name, email, company, sector?, message?, source?, business_slug? }
```

Flow:
1. Verify Bearer token vs `WEBHOOK_SECRET` env var
2. Look up business by `business_slug` (default: first active business)
3. Insert into `leads` — stage='prospecting', source='website', business_id set
4. Insert into `agent_logs` (HERMES notification)
5. Insert into `notifications` (kind='lead')
6. Return `{ lead_id, business_id }` — 201

---

## 4. Lead Detail — Full CRM View

**File:** `src/app/(app)/pipeline/[id]/page.tsx` — full rebuild

Sections:
1. **Header** — company, sector badge, stage badge, score badge, assigned agent, business tag
2. **Contact info** — name, email (masked → click), phone (masked), last contact
3. **Stage timeline** — 8-stage stepper, click to advance
4. **MEDDIC panel** — 6 editable fields, save on blur via `updateMeddic(leadId, field, value)`
5. **Activity log** — `lead_stage_history` + `agent_logs` for this lead, sorted desc
6. **Notes** — append-only, `addLeadNote(leadId, content)` server action
7. **Documents** — associated proposals with status badges
8. **Sidebar actions** — advance stage · assign agent · archive · create proposal

---

## 5. Notifications System

### 5.1 Migration: 20260304000020_v6_notifications.sql

```sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  kind text not null check (kind in ('approval','alert','lead','system','agent')),
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

-- Also alter proposals in this migration
alter table public.proposals
  add column if not exists scope_description text,
  add column if not exists sla_terms text,
  add column if not exists gate_atlas text check (gate_atlas in ('pending','approved','not_required')) default 'not_required',
  add column if not exists gate_legal text check (gate_legal in ('pending','approved','not_required')) default 'pending',
  add column if not exists gate_finance text check (gate_finance in ('pending','approved','not_required')) default 'pending',
  add column if not exists sent_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_reason text,
  add column if not exists business_id uuid references public.businesses(id);
```

### 5.2 Notification Bell

**File:** `src/components/notification-bell.tsx` ("use client")
- Red badge on unread count
- Dropdown: last 10, grouped by kind, click → navigate to entity_url
- "Mark all read" button
- Realtime subscription on `notifications` INSERT

### 5.3 Auto-Create Notifications

In server actions:
- `createApproval()` → insert notification kind='approval'
- New critical/high `alert_events` → insert notification kind='alert'
- Inbound lead webhook → insert notification kind='lead'

---

## 6. Proposals — Full Build

### 6.1 Creation — 4-Step Form

**File:** `src/app/(app)/proposals/new/page.tsx`

Steps:
1. Select lead (filtered by business, stages: needs_analysis / proposal_sent)
2. Proposal details (title, scope, SLA, pricing)
3. Gate config (ATLAS required? Legal required?)
4. Review + Submit → `createProposal(formData)` → inserts, advances lead stage, creates notification

### 6.2 Proposal Detail Rebuild

**File:** `src/app/(app)/proposals/[id]/page.tsx`

- Status timeline: Draft → In Review → Approved → Sent → Won/Lost
- Gate tracker: ATLAS | Legal | Finance — status badge + "Mark Approved" button per gate
- Activity log
- Mark Sent / Won / Lost with reason input

---

## 7. Invoices — Full Build

### 7.1 Migration: 20260304000021_v6_invoices.sql

```sql
alter table public.invoices
  add column if not exists invoice_number text unique,
  add column if not exists description text,
  add column if not exists notes text,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_method text,
  add column if not exists business_id uuid references public.businesses(id);

create or replace function public.generate_invoice_number()
returns trigger language plpgsql as $$
declare seq_num integer;
begin
  select count(*) + 1 into seq_num from public.invoices
  where extract(year from created_at) = extract(year from now());
  new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(seq_num::text, 3, '0');
  return new;
end; $$;

create trigger set_invoice_number
  before insert on public.invoices for each row
  when (new.invoice_number is null)
  execute function public.generate_invoice_number();
```

### 7.2 Invoice Pages

**List:** Filters (All/Pending/Paid/Overdue) · Table (Invoice # / Client / Amount masked / Due / Status / Days overdue) · Overdue row tint · "New Invoice" button
**New:** Client selector (filtered by business) · Amount · Due (today+14) · Description · `createInvoice()` server action

---

## 8. Market Intelligence Page

**File:** `src/app/(app)/market-intelligence/page.tsx`

Requires `BRAVE_API_KEY` in OpenClaw env.

Search route extension (`GET /api/search?scope=external&q=<query>`):
```typescript
const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`, {
  headers: { 'Accept': 'application/json', 'X-Subscription-Token': process.env.BRAVE_API_KEY! }
});
```

Features:
- Search bar → results as cards (title / URL / snippet / date)
- "Save to KB" button → `saveIntelligence()` server action → `knowledge_entries` with `category='market_intelligence'` + business_id
- Saved intelligence panel
- Competitor quick-links: Zapier, Make.com, Cliniface
- Graceful fallback if BRAVE_API_KEY missing: "Add your Brave API key to enable web search" with setup instructions

---

## 9. Dashboard — Real Metrics

Replace count-only KPI cards with commercial metrics (all filtered by selected business):

| Card | Data source |
|---|---|
| MRR | Paid invoices last 30d |
| Pipeline Value | Leads in proposal_sent + negotiation × EUR 300 |
| Win Rate (30d) | closed_won / total_closed |
| Open Alerts | Unresolved alert_events |
| Agent Cost MTD | agent_token_usage since month start |
| Pending Approvals | approvals where status='pending' |

**Unified activity feed:** `GET /api/activity-feed?limit=20` — merges agent_logs, lead_stage_history, approvals changes, alert_events. Sorted by created_at desc.

---

## 10. Agent Fleet Enhancements

### Agent List — Card Grid
Cards show: emoji + name + status dot + calibration bar + assigned businesses (tags) + MTD cost

### Agent Detail — Token Chart + Heartbeat Tracker
- Recharts AreaChart: daily token cost, 30 days
- Heartbeat tracker: last 7 heartbeats as coloured dots

---

## 11. Businesses Page

**File:** `src/app/(app)/businesses/page.tsx` (new route, accessible from switcher dropdown "Manage")

- List: business name / color dot / agent count / lead count / status badge
- New business form (name, slug, sector, country, color)
- Detail page: agent assignments (assign/unassign agents to this business)

---

## 12. Migrations Summary

| File | Contents |
|---|---|
| `20260304000019_v6_businesses.sql` | businesses + agent_assignments + ALTER all commercial tables (business_id) + lead_notes + lead_meddic + ALTER leads (source, contact fields) + RLS + seed |
| `20260304000020_v6_notifications.sql` | notifications + RLS + ALTER proposals (gates, sent_at, closed_at, business_id) |
| `20260304000021_v6_invoices.sql` | ALTER invoices (invoice_number, description, paid_at, business_id) + auto-number trigger |

After migrations: `pnpm types`

New packages: `pnpm add react-day-picker`

---

## 13. Definition of V6 Done

- [ ] `pnpm build` clean
- [ ] Business switcher renders at top of sidebar, switches context
- [ ] All commercial data queries scoped to selected business
- [ ] Sidebar: 5-group structure, section labels, System visually lighter
- [ ] Inbound lead webhook: POST creates lead in correct business
- [ ] Lead detail: MEDDIC panel editable, notes work, activity log shows stage history
- [ ] Market Intelligence: search works OR graceful "add API key" message
- [ ] Notification bell: unread count badge, dropdown renders last 10
- [ ] New approval creates notification, appears in bell
- [ ] Proposal creation: 4-step form saves, gate tracker renders
- [ ] Invoice list: All/Pending/Paid/Overdue filters work
- [ ] Invoice creation: invoice_number auto-generated (INV-YYYY-NNN)
- [ ] Dashboard: 6 real metric KPI cards render
- [ ] Dashboard: unified activity feed shows events from 4 sources
- [ ] Agent cards show assigned businesses
- [ ] Agent detail: token chart and heartbeat tracker render
- [ ] Businesses page renders, agent assignment works
- [ ] All 3 V6 migrations applied
- [ ] database.types.ts regenerated
- [ ] HTTP 200 on port 9069
- [ ] hermes-report-v6.md committed
