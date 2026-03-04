# Command Center V2 — Implementation Specification

**Version:** 2.0  
**Status:** Ready for Claude Code / GitHub Copilot  
**Last Updated:** 2026-03-04  
**Author:** HERMES (Commercial Director)

---

## 1. Current State Summary

### What's Working ✅
- **Database Schema:** Three migrations deployed (foundation, commercial, RLS)
  - 13 tables designed covering agents, pipeline, proposals, clients, finance, approvals, knowledge
  - Proper relationships and FK constraints in place
  - Basic indexes on high-cardinality columns (stage, status, health)
  - Row-Level Security enabled (authenticated users = full read, service_role = write)
- **Authentication:** Supabase Auth integration in place, middleware correctly routes to /login
- **All App Pages Scaffolded:** dashboard, pipeline, proposals, clients, agents, approvals, knowledge, invoices, settings
- **Error Boundaries:** error.tsx and loading.tsx components deployed
- **Package.json:** All dependencies installed (Next.js 16, Supabase, Recharts, shadcn)
- **Database Types:** Generated from Supabase schema (complete and accurate)

### What's Missing / Incomplete ❌
- **Dashboard KPI Cards:** Pipeline summary is present but no revenue, proposal counts, or client counts
- **Charts:** No Recharts components rendered; pipeline is just text boxes
- **Pipeline Page Logic:** No stage filter UI, no stall detection (>5 days no activity), no quick advance buttons
- **Approvals Page:** Schema ready but no approval list or action buttons
- **Knowledge Page:** Schema ready but no UI implementation
- **Server Actions:** No actions defined for stage advances, approvals, knowledge CRUD
- **Pagination:** No cursor-based pagination on any list
- **Realtime:** No Supabase Realtime subscriptions (deferred to V3)
- **Performance:** No Suspense boundaries, no static/dynamic split per route

### What Filipe Fixed in Recent Commits 🔧
1. **HEAD~2 commit (da80ced):** Major scaffolding
   - Implemented all 9 main pages with full layouts
   - Added 8 page variations (agents, clients, proposals details)
   - Created sidebar navigation and status badge components
   - Set up server-side data fetching with Supabase
   - Added systemd service for deployment
   - Generated complete database types

2. **HEAD~1 commit (08e61d7):** Infrastructure & Context
   - Applied all migrations to live database (port 9069)
   - Added CLAUDE.md and copilot-instructions for future implementation
   - Updated context files with architecture overview

3. **HEAD commit (5de1c23):** Error Boundaries & Type Refinement
   - Added error.tsx (error boundary with digest and reset button)
   - Added loading.tsx (skeleton loading UI)
   - Added not-found.tsx (404 page)
   - Regenerated database.types.ts to capture all schema changes
   - Updated service deployment configuration

---

## 2. Database Schema Improvements

### Current Schema Health Assessment

**Strengths:**
- Proper audit columns (created_at, updated_at)
- FK constraints on all relationships
- Immutable audit tables (lead_stage_history, agent_logs, agent_reports)
- Soft delete support (archived_at on leads, clients)

**Gaps Requiring Migration:**

#### 2.1 Missing Indexes for Query Performance

Add the following indexes to optimize common queries:

```sql
-- MIGRATION: 20260305000004_scalability_indexes.sql

-- Agent queries
create index idx_agents_status on public.agents(status) where status in ('active', 'idle');
create index idx_agents_type on public.agents(type);

-- Lead queries (critical for filtering)
create index idx_leads_created_week on public.leads(created_at desc) where created_at > now() - interval '7 days';
create index idx_leads_last_activity on public.leads(last_activity_at desc) where last_activity_at is not null;
create index idx_leads_stall on public.leads(stage, last_activity_at) where stall_flagged = false;

-- Proposal queries
create index idx_proposals_created_at on public.proposals(created_at desc);
create index idx_proposals_status_multi on public.proposals(status, updated_at);

-- Client queries (health monitoring)
create index idx_clients_created_at on public.clients(created_at desc);
create index idx_clients_renewal on public.clients(renewal_flagged_30d, renewal_flagged_90d);

-- Invoice queries (overdue detection)
create index idx_invoices_due_date on public.invoices(due_date) where status != 'paid';
create index idx_invoices_flagged_level on public.invoices(flag_level) where flagged = true;

-- Approval queries (admin dashboard)
create index idx_approvals_created_at on public.approvals(created_at desc);
create index idx_approvals_pending_urgency on public.approvals(status, urgency) where status = 'pending';

-- Agent reports (flag dashboard)
create index idx_agent_reports_created_at on public.agent_reports(created_at desc);
create index idx_agent_reports_flagged_level on public.agent_reports(flagged, flag_level) where flagged = true;

-- Lead stage history (pipeline analytics)
create index idx_lead_stage_history_created_at on public.lead_stage_history(created_at desc);
```

#### 2.2 High-Volume Table Strategy

agent_logs and lead_stage_history will grow rapidly. Partitioning deferred to V3 (when >500k and >300k rows). For V2: ensure proper indexes above.

#### 2.3 Soft Delete Enforcement

```sql
-- MIGRATION: 20260305000005_soft_delete_consistency.sql

-- Add archived_at to tables missing it
alter table public.proposals add column archived_at timestamptz default null;
alter table public.invoices add column archived_at timestamptz default null;

-- Create indexes for active-only queries
create index idx_proposals_archived on public.proposals(archived_at) where archived_at is null;
create index idx_invoices_archived on public.invoices(archived_at) where archived_at is null;
```

#### 2.4 Stage Transition Validation

```sql
-- MIGRATION: 20260305000006_constraint_hardening.sql

create table public.valid_stage_transitions (
  id uuid primary key default gen_random_uuid(),
  from_stage text not null,
  to_stage text not null,
  unique(from_stage, to_stage),
  created_at timestamptz not null default now()
);

insert into public.valid_stage_transitions (from_stage, to_stage) values
  ('prospecting', 'qualification'),
  ('qualification', 'initial_contact'),
  ('qualification', 'closed_lost'),
  ('initial_contact', 'demo'),
  ('demo', 'needs_analysis'),
  ('demo', 'closed_lost'),
  ('needs_analysis', 'proposal_sent'),
  ('proposal_sent', 'negotiation'),
  ('proposal_sent', 'closed_won'),
  ('proposal_sent', 'closed_lost'),
  ('negotiation', 'closed_won'),
  ('negotiation', 'closed_lost');

-- Trigger function
create or replace function public.validate_stage_transition()
returns trigger as $$
begin
  if new.stage <> old.stage then
    if not exists (
      select 1 from public.valid_stage_transitions
      where from_stage = old.stage and to_stage = new.stage
    ) then
      raise exception 'Invalid stage transition: % -> %', old.stage, new.stage;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger leads_validate_stage_transition
  before update on public.leads
  for each row execute function public.validate_stage_transition();
```

---

## 3. Feature Specifications

Implementation order: Dashboard → Pipeline → Approvals → Knowledge → Settings

### 3a. Dashboard Enhancements

**KPI Cards Query Pattern:**

```sql
-- Leads this week
select count(*) as total
from public.leads
where created_at > now() - interval '7 days' and archived_at is null;

-- Proposals sent (awaiting response)
select count(*) as total, min(sent_at) as oldest
from public.proposals
where status = 'sent' and outcome is null and sent_at > now() - interval '30 days';

-- Active clients
select count(*) as total, count(*) filter (where health_status = 'at_risk') as at_risk
from public.clients where archived_at is null;

-- Revenue (monthly)
select sum(monthly_value) as total from public.clients where health_status = 'healthy' and archived_at is null;
```

**Pipeline Funnel Chart:** Use Recharts BarChart (horizontal) with stage counts and conversion percentages.

**Agent Grid:** 2×4 grid with status badges, last heartbeat, model info.

**Activity Feed:** Last 10 agent_logs with timeline formatting.

---

### 3b. Pipeline Page Improvements

**Stage Filter Tabs:** Client component with URL param updates.

**Stall Detection:** Leads with `(now() - last_activity_at) > 5 days` marked with red border + warning icon.

**Quick Advance Button:** Server action `advanceLeadStage(leadId, toStage)` with stage transition validation.

**Lead Detail Drawer:** Sheet component (shadcn) opening on row click with full lead context.

---

### 3c. Approvals Page

**Approval Card Component:**
- Display urgency badge, action summary, context, draft content
- Approve/Reject buttons (server actions)
- Optimistic UI updates (show success state immediately)
- Auto-refresh every 60 seconds via `useEffect` + `router.refresh()`

**Server Actions:**
```typescript
// approveAction(approvalId): Updates status to 'approved'
// rejectAction(approvalId): Updates status to 'rejected'
```

---

### 3d. Knowledge Page

**Search & Filter:** Client-side input → URL param → server-side filtering

**List View:** Table or card layout with outcome badge (Won/Lost), company name, key learning, date

**Detail View:** Full learnings display (MEDDIC, objections, loss reason, deal velocity, etc.)

---

### 3e. Settings Page

**Account Info:** Read-only display of auth user email

**Theme:** Placeholder (dark mode only for V2)

**Agents Overview:** Read-only list of all agents from DB with status

**Danger Zone:** Sign out button with confirmation

---

## 4. Server Actions Pattern

### Standard Return Type
```typescript
export type ServerActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string; code?: string };
```

### Auth Verification
```typescript
export async function verifyAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user;
}
```

### Revalidation Strategy
- After lead updates: `revalidatePath('/pipeline'); revalidatePath('/dashboard');`
- After approval decisions: `revalidatePath('/approvals'); revalidatePath('/dashboard');`
- After client updates: `revalidatePath('/clients'); revalidatePath('/dashboard');`

---

## 5. Type Safety

**src/lib/types.ts:**
```typescript
import { Database } from './database.types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type Proposal = Database['public']['Tables']['proposals']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Agent = Database['public']['Tables']['agents']['Row'];
export type Approval = Database['public']['Tables']['approvals']['Row'];
export type DealLearning = Database['public']['Tables']['deal_learnings']['Row'];
```

Use these types consistently across server components and actions.

---

## 6. Performance Optimization

### Suspense Boundaries
```tsx
<Suspense fallback={<Skeleton className="h-40" />}>
  <KPICards />
</Suspense>
```

### Static vs Dynamic Routes
- `/dashboard` → Dynamic (ISR 60s)
- `/pipeline` → Dynamic (on-demand revalidation)
- `/approvals` → Dynamic (on-demand)
- `/knowledge` → Static (ISR 3600s)
- `/settings` → Dynamic (no cache)

### Query Optimization
Always select only needed columns:
```typescript
.select('id, company_name, stage, created_at') // not select('*')
```

### Pagination
Use cursor-based pagination for lists >20 items. Pattern:
```typescript
const nextCursor = hasMore ? 
  Buffer.from(`${lastId}|${lastDate}`).toString('base64') : 
  undefined;
```

---

## 7. Build & Deploy

### Environment Variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
NEXT_PUBLIC_APP_ENV=production
```

### Schema Changes
1. Run migration in Supabase
2. Regenerate types: `supabase gen types typescript --project-id [id] > src/lib/database.types.ts`
3. Commit: `git add -A && git commit -m "db: schema + types"`
4. Push: systemd service auto-restarts

### Systemd Service
```bash
sudo systemctl start command-center
sudo systemctl stop command-center
sudo systemctl restart command-center
journalctl -u command-center -f
```

---

## Implementation Checklist

- [ ] Migrations: Add indexes, soft-delete, stage transitions
- [ ] Dashboard: KPI cards, funnel chart, agent grid, activity feed
- [ ] Pipeline: Stage tabs, stall detection, quick advance, detail sheet
- [ ] Server Actions: Define pattern, create utils, implement for each feature
- [ ] Approvals: List, approve/reject buttons, auto-refresh
- [ ] Knowledge: Search, list, detail views
- [ ] Settings: Account, theme, agents, sign out
- [ ] Types: Extract to src/lib/types.ts
- [ ] Performance: Suspense boundaries, revalidation, pagination
- [ ] Testing: Verify all features end-to-end

**Estimated Effort:** 12-16 hours

---

## Known Gaps & Risks

- **Realtime:** Not yet implemented (lightweight polling sufficient for V2)
- **Batch Operations:** Not yet available (one-by-one for V2)
- **User ID in Actions:** Need auth context in server actions (TODO)
- **N+1 Queries:** Use explicit selects to avoid
- **Partition Timeout:** Monitor table sizes, partition in V3 if needed

---

## Status: Ready for Implementation

This spec provides everything Claude Code needs to implement V2 top-to-bottom without ambiguity.

Commit and push when complete:
```bash
git add docs/implementation-spec-v2.md
git commit -m "docs: implementation-spec-v2 — full engineering spec for Command Center V2"
git push
```

