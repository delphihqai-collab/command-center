# Command Center — Implementation Spec V5
**Version:** 5.0  
**Status:** ACTIVE  
**Supersedes:** implementation-spec-v4.md  
**Date:** 2026-03-04  
**Prepared by:** HERMES

> V5 theme: **Make the data real.** Close the loop between HERMES (agent on PC2) and the Command Center. Right now the dashboard is mostly empty states because HERMES writes to markdown files, not Supabase. V5 fixes that and builds out the full operational layer.

---

## V4 Audit — Issues to Fix in V5

1. **`/alerts` page missing** — no alert rules or alert events system. ❌ MISSING
2. **`/reports` page missing** — no weekly reports table or UI. ❌ MISSING
3. **Approvals missing V5 columns** — `decided_by`, `decision_reason`, `decided_at` not added yet. ⚠️ PARTIAL
4. **In-app approvals not wired** — HERMES has no REST path to write approval requests to DB. ❌ MISSING
5. **HERMES → Supabase loop broken** — heartbeats/pipeline state written to markdown only; `agent_logs`, `lead_stage_history`, `agent_token_usage` tables exist but HERMES never writes to them. ❌ MISSING
6. **Realtime not universal** — only approvals page has Realtime; dashboard, pipeline, office, alerts do not. ⚠️ PARTIAL
7. **`/agents/[slug]` page missing** — individual agent detail page does not exist. ❌ MISSING
8. **`/settings` non-operational** — renders but has no editable sections. ⚠️ PARTIAL
9. **Gateway/Sessions fallback UI** — expected behaviour on non-PC2 build machine. ✅ EXPECTED
10. **middleware.ts deprecation warning** — Next.js 16 non-blocking; resolve when Next.js 17 lands.

---

## 1. HERMES → Supabase Integration (most important)

HERMES writes all state to markdown files. Command Center sits empty. V5 closes this loop.

### 1.1 What HERMES Writes

| Event | Table | Trigger |
|-------|-------|---------|
| Every heartbeat (12:00, 18:00 Mon–Fri) | `agent_logs` | Cron fires |
| Sub-agent task completion | `agent_logs` | Sub-agent reports back |
| Lead stage change | `lead_stage_history` | HERMES updates pipeline |
| Approval request created | `approvals` | HERMES blocks on external action |
| Token usage event | `agent_token_usage` | Any session |

### 1.2 Transport: Supabase REST API

No SDK. Pure `fetch`. Service role key available as `SUPABASE_SECRET_KEY` in OpenClaw env.

```
Base URL: ${NEXT_PUBLIC_SUPABASE_URL}/rest/v1
Auth header: Authorization: Bearer ${SUPABASE_SECRET_KEY}
apikey: ${SUPABASE_SECRET_KEY}
Content-Type: application/json
Prefer: return=minimal
```

### 1.3 New HERMES Skill: supabase-write

**File:** `workspace/skills/supabase-write/SKILL.md`
**Also copy to:** `~/.openclaw/skills/supabase-write/SKILL.md`

Full skill content:

```markdown
# supabase-write — Write Events to Supabase

**Type:** procedure
**Applies to:** Any task generating a DB-worthy event (heartbeat, lead change, approval, token usage, sub-agent completion)
**Trigger keywords:** write to supabase, log to db, update DB, supabase REST, record heartbeat, log token usage
**Times used:** 0
**Last used:** —

## Runbook

### Environment
SUPABASE_URL = NEXT_PUBLIC_SUPABASE_URL in OpenClaw env.
Service role key = SUPABASE_SECRET_KEY.
Never use anon key for writes — always service role.

### Base fetch pattern

async function supabaseWrite(table, payload) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      'apikey': process.env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) console.error(`Supabase write failed: ${res.status} ${await res.text()}`);
}

### Write: Heartbeat to agent_logs

await supabaseWrite('agent_logs', {
  agent_id: HERMES_UUID,
  level: 'info',
  message: 'heartbeat',
  metadata: {
    pipeline_state: pipelineState,
    heartbeat_type: 'midday' | 'afternoon',
    timestamp: new Date().toISOString()
  }
});

### Write: Sub-agent completion

await supabaseWrite('agent_logs', {
  agent_id: HERMES_UUID,
  level: 'info',
  message: `sub-agent task complete: ${taskDescription}`,
  metadata: { task: taskDescription, result_summary: resultSummary, duration_ms: durationMs }
});

### Write: Lead stage change

await supabaseWrite('lead_stage_history', {
  lead_id: leadId,
  from_stage: previousStage,
  to_stage: newStage,
  changed_by_agent_id: HERMES_UUID,
  notes: reason
});

### Write: New approval request

await supabaseWrite('approvals', {
  urgency: 'CRITICAL' | 'IMPORTANT' | 'INFORMATIONAL',
  action_summary: oneLineAction,
  recipient: recipientDescription,
  context: contextTwoSentences,
  draft_content: exactDraftContent,
  risks_if_approved: risksText,
  risks_if_rejected: risksText,
  alternatives: alternativesText,
  risk_if_delayed: delayRiskText,
  status: 'submitted',
  created_by_agent_id: HERMES_UUID
});

### Write: Token usage

await supabaseWrite('agent_token_usage', {
  agent_id: HERMES_UUID,
  model: 'claude-sonnet-4-6',
  input_tokens: inputTokens,
  output_tokens: outputTokens,
  cost_usd: calculatedCost,
  task_description: taskDescription,
  session_id: sessionId || null
});

### PATCH: Update approval decision

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/approvals?id=eq.${approvalId}`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
      'apikey': SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'approved' | 'rejected',
      decided_by: 'boss',
      decision_reason: reason,
      decided_at: new Date().toISOString()
    })
  }
);

### HERMES UUID Lookup (once, then cache)

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/agents?slug=eq.hermes&select=id`,
  { headers: { 'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`, 'apikey': SUPABASE_SECRET_KEY } }
);
const [{ id }] = await res.json();
// Store: memory/hermes-agent-id.txt

## Notes
- Always use service role key. Anon key blocked by RLS on writes.
- HERMES UUID is stable — look up once and cache in memory/hermes-agent-id.txt
- Write failures: log to #hermes-logs but do not block the primary task.

**First extracted:** 2026-03-04
```

### 1.4 HERMES Approval Decision Polling

HERMES polls every 60s during active sessions for approval decisions:

```javascript
const checkApprovals = async (lastCheckTime) => {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/approvals?decided_at=gt.${lastCheckTime}&status=in.(approved,rejected)&select=*`,
    { headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } }
  );
  const decisions = await res.json();
  for (const d of decisions) {
    if (d.status === 'approved') executeApprovedAction(d);
    else handleRejection(d);
  }
};
```

---

## 2. Alerts & Notifications System

### 2.1 DB Migration

**File:** `supabase/migrations/20260304000012_v5_alerts.sql`

```sql
create table public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  entity_type text not null check (entity_type in ('lead', 'proposal', 'client', 'invoice', 'agent')),
  condition_field text not null,
  condition_operator text not null check (condition_operator in ('gt', 'lt', 'eq', 'days_since', 'is_null')),
  condition_value text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'info')) default 'medium',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.alert_rules(id),
  entity_type text not null,
  entity_id uuid not null,
  message text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'info')),
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.alert_rules enable row level security;
alter table public.alert_events enable row level security;
create policy "Authenticated read alert_rules" on public.alert_rules for select to authenticated using (true);
create policy "Service role write alert_rules" on public.alert_rules for all to service_role using (true);
create policy "Authenticated read alert_events" on public.alert_events for select to authenticated using (true);
create policy "Service role write alert_events" on public.alert_events for all to service_role using (true);
create policy "Authenticated update alert_events" on public.alert_events for update to authenticated using (true);

insert into public.alert_rules (name, description, entity_type, condition_field, condition_operator, condition_value, severity) values
  ('Lead Stalled', 'Lead has had no stage movement in over 5 days', 'lead', 'updated_at', 'days_since', '5', 'high'),
  ('Proposal Unanswered', 'Proposal sent with no client response in over 48 hours', 'proposal', 'sent_at', 'days_since', '2', 'high'),
  ('Invoice Overdue', 'Invoice unpaid more than 30 days past due date', 'invoice', 'due_date', 'days_since', '30', 'critical'),
  ('Agent Offline', 'Agent has not sent a heartbeat in over 24 hours', 'agent', 'last_heartbeat_at', 'days_since', '1', 'critical'),
  ('Client Health Low', 'Client health score has dropped below 50', 'client', 'health_score', 'lt', '50', 'high');

create index idx_alert_events_resolved on public.alert_events(resolved, created_at desc);
create index idx_alert_events_severity on public.alert_events(severity) where resolved = false;
```

### 2.2 Page: /alerts

**File:** `src/app/(app)/alerts/page.tsx` (server component)

```typescript
import { createClient } from "@/lib/supabase/server";
import { AlertsClient } from "./_components/alerts-client";

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: alerts } = await supabase
    .from("alert_events")
    .select("*, alert_rules(name, description)")
    .eq("resolved", false)
    .order("created_at", { ascending: false });
  const criticalCount = alerts?.filter(a => a.severity === "critical").length ?? 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <p className="text-sm text-zinc-400">{alerts?.length ?? 0} active · {criticalCount} critical</p>
      </div>
      <AlertsClient alerts={alerts ?? []} />
    </div>
  );
}
```

**File:** `src/app/(app)/alerts/_components/alerts-client.tsx` (client component with Realtime)

Grouped by severity (critical → high → medium → info). Each alert card shows: message, rule name, timestamp, Resolve button. Realtime subscription on `alert_events` table.

**File:** `src/app/(app)/alerts/actions.ts`

```typescript
"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolveAlert(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("alert_events")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", formData.get("id") as string);
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}
```

### 2.3 Sidebar Alert Badge

In `src/components/sidebar.tsx`, fetch unresolved critical/high count server-side and display red badge on the Alerts nav item.

### 2.4 Dashboard KPI Card

Add "Critical Alerts" KPI card to `src/app/(app)/dashboard/page.tsx`. Red colour when > 0.

---

## 3. In-App Approvals

### 3.1 DB Migration

**File:** `supabase/migrations/20260304000013_v5_approvals_v2.sql`

```sql
alter table public.approvals
  add column if not exists decided_by text,
  add column if not exists decision_reason text,
  add column if not exists decided_at timestamptz;

create index if not exists idx_approvals_pending on public.approvals(status, created_at desc)
  where status = 'submitted';
```

### 3.2 Approvals Page Upgrade

**File:** `src/app/(app)/approvals/page.tsx` — extend existing page

Each approval card renders all fields: URGENCY badge, ACTION, RECIPIENT, CONTEXT, DRAFT (monospace), RISKS IF APPROVED, RISKS IF REJECTED, RISK IF DELAYED. Below each card: Approve (emerald) and Reject (red) buttons.

**File:** `src/app/(app)/approvals/_components/approve-button.tsx`

```typescript
"use client";
// ApproveButton: form with hidden id, calls approveRequest server action, shows loading state
// RejectButton: shows text input for reason on click, requires non-empty reason, calls rejectRequest
```

**File:** `src/app/(app)/approvals/actions.ts` — add to existing file

```typescript
export async function approveRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("approvals").update({
    status: "approved",
    decided_by: user?.email ?? "boss",
    decided_at: new Date().toISOString(),
  }).eq("id", formData.get("id") as string);
  revalidatePath("/approvals");
}

export async function rejectRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("approvals").update({
    status: "rejected",
    decided_by: user?.email ?? "boss",
    decision_reason: formData.get("reason") as string,
    decided_at: new Date().toISOString(),
  }).eq("id", formData.get("id") as string);
  revalidatePath("/approvals");
}
```

### 3.3 HERMES Polling Endpoint

**File:** `src/app/api/hermes/approval-decision/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const since = new URL(req.url).searchParams.get("since") ?? new Date(Date.now() - 3600000).toISOString();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("approvals")
    .select("id, status, action_summary, decided_by, decision_reason, decided_at")
    .in("status", ["approved", "rejected"])
    .gte("decided_at", since);
  return NextResponse.json({ decisions: data ?? [] });
}
```

### 3.4 Pending Count Badge

Add orange badge to Approvals sidebar item. Query count of `status = 'submitted'` approvals.

---

## 4. Agent Calibration Tracker

### 4.1 DB Migration

**File:** `supabase/migrations/20260304000014_v5_calibration.sql`

```sql
create table public.calibration_gates (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  gate_name text not null,
  gate_description text,
  required_count integer not null default 1,
  completed_count integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.calibration_gates enable row level security;
create policy "Authenticated read calibration_gates" on public.calibration_gates for select to authenticated using (true);
create policy "Service role write calibration_gates" on public.calibration_gates for all to service_role using (true);

-- Seed gates (inserts depend on agents table slugs existing)
insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First 5 handoff briefs reviewed by HERMES', 'SDR produces 5 handoff briefs meeting qualification standards reviewed by HERMES', 5 from public.agents where slug = 'sdr';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, '3 discovery logs reviewed', 'AE produces 3 discovery call logs reviewed and approved by HERMES', 3 from public.agents where slug = 'ae';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, '3 proposal drafts reviewed', 'AE produces 3 proposal drafts reviewed and approved by HERMES', 3 from public.agents where slug = 'ae';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First 30-day onboarding reviewed', 'AM runs one complete 30-day onboarding cycle reviewed by HERMES', 1 from public.agents where slug = 'am';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Finance task completed and reviewed by HERMES', 1 from public.agents where slug = 'finance';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Legal task completed and reviewed by HERMES', 1 from public.agents where slug = 'legal';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Market Intelligence task completed and reviewed by HERMES', 1 from public.agents where slug = 'market-intelligence';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Knowledge Curator task completed and reviewed by HERMES', 1 from public.agents where slug = 'knowledge-curator';

create index idx_calibration_gates_agent on public.calibration_gates(agent_id);
```

### 4.2 Agent Detail Page

**File:** `src/app/(app)/agents/[slug]/page.tsx`

Server component. Fetches agent by slug, calibration gates, recent logs.

**File:** `src/app/(app)/agents/[slug]/_components/calibration-tracker.tsx`

Shows: progress bar (completedGates/totalGates × 100%), gate checklist with CheckCircle2/Circle icons, completed_count/required_count for multi-step gates. Renders only when `agent.status === 'built_not_calibrated'`. Green completion banner when all gates done.

Note: no "Mark Complete" button in Boss UI. HERMES marks gates complete via service role REST PATCH to `calibration_gates?id=eq.${gateId}`.

---

## 5. Weekly Commercial Report

### 5.1 DB Migration

**File:** `supabase/migrations/20260304000015_v5_weekly_reports.sql`

```sql
create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  pipeline_value_total numeric(12,2),
  new_leads_count integer,
  proposals_sent_count integer,
  deals_closed_count integer,
  revenue_this_week numeric(12,2),
  agent_cost_total numeric(10,6),
  cost_per_lead numeric(10,6),
  report_data jsonb,
  generated_at timestamptz not null default now()
);

alter table public.weekly_reports enable row level security;
create policy "Authenticated read weekly_reports" on public.weekly_reports for select to authenticated using (true);
create policy "Service role write weekly_reports" on public.weekly_reports for all to service_role using (true);
create unique index idx_weekly_reports_week on public.weekly_reports(week_start);
```

### 5.2 HERMES Report Generation

HERMES generates reports during the Friday 18:00 heartbeat. Queries Supabase REST for the week's data, computes aggregates, writes to `weekly_reports` via `supabase-write` skill. Add weekly report step to the Friday heartbeat playbook.

### 5.3 Page: /reports

**File:** `src/app/(app)/reports/page.tsx` + `_components/reports-client.tsx`

Latest report expanded at top with KPI cards. Historical list below (collapsible). Three Recharts charts: pipeline value bar, cost-per-lead line, win rate line. All data from `weekly_reports` table.

---

## 6. Supabase Realtime — Full Rollout

| Page | Table | Component |
|------|-------|-----------|
| `/dashboard` | `agent_logs` | Dashboard activity feed |
| `/pipeline` | `leads` | Pipeline table |
| `/alerts` | `alert_events` | AlertsClient |
| `/office` | `agents` | OfficeFloor |
| `/costs` | `agent_token_usage` | CostChart |

### 6.1 Generic Wrapper

**File:** `src/components/realtime-table.tsx`

```typescript
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeTable({ children, table }: { children: React.ReactNode; table: string }) {
  const router = useRouter();
  const supabase = createClient();
  useEffect(() => {
    const ch = supabase.channel(`${table}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => router.refresh())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [table]);
  return <>{children}</>;
}
```

Wrap pages or inline the pattern in existing client components. Approvals already done — do not duplicate.

---

## 7. Advanced Pipeline Features

### 7.1 Kanban View

**Install:** `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

**Files:**
- `src/app/(app)/pipeline/_components/pipeline-kanban.tsx` — DnD context, 8 columns
- `src/app/(app)/pipeline/_components/kanban-column.tsx` — column with lead count badge
- `src/app/(app)/pipeline/_components/kanban-card.tsx` — lead card: name, company, value, days-in-stage

**Toggle in pipeline header:** table/kanban view state (localStorage-persisted). Drag-on-drop calls existing `advanceLeadStage(leadId, newStage)` server action.

### 7.2 Lead Scoring

**File:** `src/lib/lead-scoring.ts`

Score 0–100 based on: sector match (+30), company size match (+25), has phone contact (+15), has proposal (+20), active last 7 days (+10).

Rendered as coloured badge on pipeline table rows and kanban cards:
- 75–100: emerald
- 50–74: amber
- 0–49: red

### 7.3 Bulk Actions

**File:** `src/app/(app)/pipeline/_components/bulk-actions-bar.tsx`

Appears at bottom when 1+ rows selected. Actions: Assign to agent, Advance stage, Archive. Server actions: `bulkAdvanceStage(ids[], newStage)`, `bulkArchiveLeads(ids[])`.

### 7.4 Pipeline Forecast Sidebar Panel

**File:** `src/app/(app)/pipeline/_components/pipeline-forecast.tsx`

Static sidebar panel. Hardcoded conversion rates by stage. Groups expected closes into 30/60/90 day buckets based on average days per stage. Shows expected pipeline value at each horizon.

```typescript
const STAGE_CONVERSION = {
  prospecting: 0.05, qualification: 0.15, initial_contact: 0.20,
  demo_meeting: 0.35, needs_analysis: 0.45, proposal_sent: 0.55, negotiation: 0.70,
};
```

---

## 8. Client Health Dashboard (Full Build)

**File:** `src/app/(app)/clients/[id]/page.tsx` — extend existing page

New data fetches:

```typescript
const [healthHistory, invoices, proposals] = await Promise.all([
  supabase.from("client_health_history").select("score, recorded_at")
    .eq("client_id", params.id).order("recorded_at").limit(12),
  supabase.from("invoices").select("id, amount, status, due_date").eq("client_id", params.id),
  supabase.from("proposals").select("id, title, status, created_at")
    .eq("client_id", params.id).order("created_at", { ascending: false }),
]);
```

New page sections (add below existing header):
1. **Health Trend** — `LineChart` from `client_health_history`
2. **Open Invoices** — table with paid/overdue/pending badges
3. **Proposal History** — list with status badges
4. **Renewal Countdown** — days until `renewal_date` (amber < 60d, red < 30d)
5. **Risk Flags** — computed: declining health trend, overdue invoices, no contact > 14 days
6. **Notes** — from `client_notes` table; inline add-note form

### 8.1 Client Notes Migration

**File:** `supabase/migrations/20260304000016_v5_client_notes.sql`

```sql
create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) not null,
  content text not null,
  author text not null default 'HERMES',
  created_at timestamptz not null default now()
);

alter table public.client_notes enable row level security;
create policy "Authenticated read client_notes" on public.client_notes for select to authenticated using (true);
create policy "Service role write client_notes" on public.client_notes for all to service_role using (true);
create policy "Authenticated insert client_notes" on public.client_notes for insert to authenticated with check (true);
create index idx_client_notes_client on public.client_notes(client_id, created_at desc);
```

---

## 9. Knowledge Base — Write Mode

**Files to create:**
- `src/app/(app)/knowledge/new/page.tsx` — create form: title, content (textarea), category, tags, linked entity
- `src/app/(app)/knowledge/[id]/edit/page.tsx` — pre-filled edit form

**Server actions in** `src/app/(app)/knowledge/actions.ts`:
- `createKnowledgeEntry(formData)` → insert → revalidatePath("/knowledge")
- `updateKnowledgeEntry(id, formData)` → update → revalidatePath("/knowledge")

HERMES writes new entries via `supabase-write` skill (POST to `/rest/v1/knowledge_entries` — confirm exact table name from `database.types.ts`).

---

## 10. Settings — Full Build

**File:** `src/app/(app)/settings/page.tsx` — replace with tabbed layout

Tabs: Account | Notifications | Pipeline | Agents | Data Retention | API Keys

### 10.1 Migration

**File:** `supabase/migrations/20260304000017_v5_settings.sql`

```sql
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null unique,
  alert_channel text not null check (alert_channel in ('discord', 'in_app', 'both')) default 'both',
  approval_channel text not null check (approval_channel in ('discord', 'in_app', 'both')) default 'both',
  report_channel text not null check (report_channel in ('discord', 'in_app', 'both')) default 'in_app',
  updated_at timestamptz not null default now()
);

create table public.pipeline_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.pipeline_config (key, value) values
  ('stall_threshold_days', '5'),
  ('stages', '["prospecting","qualification","initial_contact","demo_meeting","needs_analysis","proposal_sent","negotiation","closed_won","closed_lost"]'),
  ('sectors', '["healthcare","legal","finance","retail","manufacturing","logistics","real_estate","other"]'),
  ('agent_logs_retain_days', '90'),
  ('audit_log_retain_days', '365');
```

### 10.2 Tab: Notifications

Toggle groups: Alerts (Discord/In-App/Both), Approvals (Discord/In-App/Both), Reports (Discord/In-App/Both). Writes to `notification_preferences`.

### 10.3 Tab: Pipeline

Editable: stall threshold (number), stage names (ordered list), sector tags. Writes to `pipeline_config`.

### 10.4 Tab: Agent Models

Table showing each agent's model. Edit writes to OpenClaw gateway API if available, otherwise updates an `agent_model_overrides` column on the `agents` table.

### 10.5 Tab: Data Retention

`agent_logs_retain_days` and `audit_log_retain_days` number inputs. Stored in `pipeline_config`. HERMES reads during weekly maintenance and cleans old rows.

---

## 11. Dark/Light Mode Toggle

**Install:** `npm install next-themes`

**File:** `src/app/layout.tsx` — wrap body in `<ThemeProvider attribute="class" defaultTheme="dark">`

**File:** `src/components/theme-toggle.tsx` — Sun/Moon icon toggle using `useTheme()` from next-themes

Add `<ThemeToggle />` to the app header (top-right) and Settings → Account tab.

Ensure `tailwind.config.ts` has `darkMode: "class"`.

---

## 12. Global Search (cmd+K)

### 12.1 FTS Migration

**File:** `supabase/migrations/20260304000018_v5_search.sql`

```sql
alter table public.leads add column if not exists search_vector tsvector;
alter table public.clients add column if not exists search_vector tsvector;
alter table public.proposals add column if not exists search_vector tsvector;

update public.leads set search_vector =
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(company,'') || ' ' || coalesce(sector,''));
update public.clients set search_vector = to_tsvector('english', coalesce(name,'') || ' ' || coalesce(industry,''));
update public.proposals set search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''));

create index if not exists idx_leads_fts on public.leads using gin(search_vector);
create index if not exists idx_clients_fts on public.clients using gin(search_vector);
create index if not exists idx_proposals_fts on public.proposals using gin(search_vector);

create or replace function update_leads_search_vector() returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.name,'') || ' ' || coalesce(new.company,'') || ' ' || coalesce(new.sector,''));
  return new;
end; $$;
create trigger leads_search_trigger before insert or update on public.leads
  for each row execute function update_leads_search_vector();

-- Repeat similar triggers for clients and proposals
```

### 12.2 Search Route Handler

**File:** `src/app/api/search/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ results: {} });
  const supabase = await createClient();
  const tsquery = q.trim().split(/\s+/).join(" & ");
  const [leads, clients, proposals] = await Promise.all([
    supabase.from("leads").select("id, name, company, stage").textSearch("search_vector", tsquery).limit(5),
    supabase.from("clients").select("id, name, industry").textSearch("search_vector", tsquery).limit(5),
    supabase.from("proposals").select("id, title, status").textSearch("search_vector", tsquery).limit(5),
  ]);
  return NextResponse.json({ results: { leads: leads.data ?? [], clients: clients.data ?? [], proposals: proposals.data ?? [] } });
}
```

### 12.3 Command Palette

**File:** `src/components/command-palette.tsx`

cmd+K listener opens dialog. Search input with debounced SWR fetch. Results grouped by entity type with section headers. Click navigates to entity page and closes palette.

**Install:** `npm install swr` (if not present)

Add `<CommandPalette />` to `src/app/(app)/layout.tsx`.

---

## 13. Mobile Responsive Layout

### 13.1 Sidebar → Bottom Nav (mobile)

In `src/components/sidebar.tsx`, add a second nav below the existing sidebar for mobile:

```typescript
// Mobile bottom nav (md:hidden) — top 5 items: Dashboard, Pipeline, Approvals, Alerts, The Office
<nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-800 bg-zinc-950 py-2 md:hidden">
  {mobileNavItems.map(item => (
    <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 p-2">
      <item.icon className="h-5 w-5" />
      <span className="text-[10px]">{item.label}</span>
    </Link>
  ))}
</nav>
```

Also hide the desktop sidebar on mobile: add `hidden md:flex` to the sidebar wrapper div.

### 13.2 Responsive Tables

For Pipeline and Approvals (highest-traffic mobile pages):

```typescript
// Show card list on mobile, table on desktop
<div className="md:hidden space-y-3">{items.map(i => <MobileCard key={i.id} item={i} />)}</div>
<div className="hidden md:block"><Table>...</Table></div>
```

### 13.3 The Office — Mobile Grid

Change CSS grid in `office-floor.tsx`:
```typescript
<div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
```

---

## Service Role Client Helper

**File:** `src/lib/supabase/service.ts`

```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

Use only in Route Handlers and server actions needing to bypass RLS.

---

## DB Migrations Summary

| File | Contents |
|------|----------|
| `20260304000012_v5_alerts.sql` | `alert_rules`, `alert_events`, RLS, 5 default rules |
| `20260304000013_v5_approvals_v2.sql` | ALTER approvals: add `decided_by`, `decision_reason`, `decided_at` |
| `20260304000014_v5_calibration.sql` | `calibration_gates`, RLS, 8 agent gate seeds |
| `20260304000015_v5_weekly_reports.sql` | `weekly_reports`, RLS |
| `20260304000016_v5_client_notes.sql` | `client_notes`, RLS |
| `20260304000017_v5_settings.sql` | `notification_preferences`, `pipeline_config`, seeds |
| `20260304000018_v5_search.sql` | FTS vectors, indexes, triggers on leads/clients/proposals |

Apply in order: 12 → 13 → 14 → 15 → 16 → 17 → 18

---

## Updated Sidebar Navigation

Add to `src/components/sidebar.tsx` navItems array:

```typescript
{ href: "/alerts", label: "Alerts", icon: Bell },       // after approvals
{ href: "/reports", label: "Reports", icon: BarChart3 }, // after costs
```

Add `Bell, BarChart3` to the lucide-react import.

Full nav order (19 items): Dashboard · The Office · Pipeline · Clients · Proposals · Invoices · **Alerts** · Approvals · Chat · Costs · **Reports** · Knowledge · Agents · Sessions · Memory · Logs · Audit Log · Gateway · Settings

---

## Key Architectural Decisions

1. **HERMES → Supabase via REST, not SDK** — Pure `fetch` calls. No install requirement, no SDK version conflicts. The `supabase-write` skill documents exact patterns for all event types.

2. **Approval decisions via polling, not WebSocket** — HERMES polls `/api/hermes/approval-decision?since=<timestamp>` every 60s during active sessions. Simpler than a persistent WebSocket and survives PC2 gateway restarts cleanly.

3. **Alert rule evaluation by HERMES during heartbeats** — Not database triggers or Supabase Edge Functions. HERMES evaluates rules each heartbeat and writes `alert_events` when rules fire. Keeps logic flexible.

4. **Calibration gates marked by HERMES only** — No "Mark Complete" button for Boss. HERMES marks gates via service role REST PATCH after reviewing artifacts. Prevents accidental completion.

5. **Weekly reports generated by HERMES, stored in DB** — Not a database cron. HERMES generates during Friday 18:00 heartbeat. UI is purely read-only.

6. **FTS via PostgreSQL tsvector** — No Algolia or Typesense. Supabase built-in FTS sufficient for current data volume. Update triggers keep vectors fresh.

7. **Mobile via responsive CSS only** — No separate routes. Tailwind responsive prefixes throughout. Sidebar becomes bottom nav at `< md`.

---

*Implementation priority: (1) HERMES→Supabase integration + supabase-write skill — closes the empty-state problem immediately. (2) In-app approvals — closes the operational loop. (3) Alerts — gives Boss live visibility. (4) Agent calibration tracker — active need. (5) Everything else.*
