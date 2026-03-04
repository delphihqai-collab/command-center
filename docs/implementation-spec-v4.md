# [ARCHIVED — See implementation-spec-v5.md]

# [ARCHIVED — See implementation-spec-v5.md]

# Command Center — Implementation Spec V4
**Version:** 4.0  
**Status:** ACTIVE  
**Supersedes:** implementation-spec-v3.md  
**Date:** 2026-03-04  
**Prepared by:** HERMES

> V4 delivers the Office view (pixel-art agent fleet), Chat panel (all 8 agents), Token/Cost tracking, Gateway Config panel, Sessions panel, Memory Browser, Log Viewer — plus fixes all V3 audit gaps. This is the engineering bible for the next implementation sprint.

---

## 0. V3 Fixes (Implement First)

### 0.1 Approval Workflow — 4 → 6 Stages
**File:** `src/app/(app)/approvals/page.tsx` and server actions  
**Fix:** Extend stages from [Draft, Submitted, Negotiation, Closed] to [Draft, Submitted, Opened, Reviewed, Negotiation, Closed]  
**DB migration needed:** Add CHECK constraint update on approvals.status column

### 0.2 Lead Detail Sheet — Add Stage Advance Action
**File:** `src/app/(app)/pipeline/[id]/page.tsx`  
**Fix:** Wire up the stage advance server action. Sheet is currently read-only.  
**Server action:** `advanceLeadStage(leadId, newStage)` → updates leads.stage + inserts lead_stage_history row + revalidates /pipeline

### 0.3 Audit Log Page — Create UI
**File:** Create `src/app/(app)/audit-log/page.tsx`  
**Data:** Query `audit_log` table (exists from V3 migrations)  
**UI:** Table with columns: timestamp, agent, action, entity_type, entity_id, changes. Filters: agent dropdown, action type, date range.

### 0.4 Realtime — Upgrade from Polling
**Files:** `src/app/(app)/approvals/page.tsx`, `src/app/(app)/dashboard/page.tsx`  
**Fix:** Replace 60s setInterval polling with Supabase Realtime channel subscriptions  
**Pattern:**
```typescript
"use client";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

const supabase = createClient();
useEffect(() => {
  const channel = supabase
    .channel("approvals-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, 
      () => router.refresh()
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

---

## 1. Agent Fleet Architecture

Command Center manages a fleet of 8 agents. Every feature that touches agents must support all 8 — never build for HERMES only.

| Agent | Role | Emoji | Model | Status |
|---|---|---|---|---|
| HERMES | Commercial Director | 🪶 | claude-sonnet-4-6 | active |
| SDR | Sales Development | 📞 | claude-sonnet-4-6 | idle |
| Account Executive | Deal Closing | 🤝 | claude-sonnet-4-6 | idle |
| Account Manager | Client Management | 👥 | claude-sonnet-4-6 | idle |
| Finance Agent | Invoicing & Margins | 💰 | claude-haiku-4-5 | built_not_calibrated |
| Legal & Compliance | Contracts & GDPR | ⚖️ | claude-sonnet-4-6 | built_not_calibrated |
| Market Intelligence | Competitor Intel | 🔭 | claude-haiku-4-5 | built_not_calibrated |
| Knowledge Curator | Knowledge Base | 📚 | claude-sonnet-4-6 | built_not_calibrated |

**Hierarchy:** HERMES reports to Boss (authorised users). All sub-agents report to HERMES only — never to Boss directly. The dashboard surfaces all agent activity but Boss communicates only with HERMES.

**Rule for developers:** If you are building a feature and you find yourself hardcoding "HERMES" as the only agent — stop. Every agent-facing feature (chat, cost tracking, sessions, memory, logs) must query `agents` table and work for all 8.

---

## 2. The Office View

The flagship visual feature. A pixel-art style top-down office where all 8 agents are visible as characters at their desks. Rank determines desk quality and office position.

### 2.1 Layout

```
┌────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌─────────────────────┐ │
│  │  HERMES — Corner Office  │  │  AE — Premium Desk  │ │
│  │  🪶 Executive desk       │  │  🤝                 │ │
│  │  🌿 Window  🌿 Plant     │  │  Ergonomic chair    │ │
│  └──────────────────────────┘  └─────────────────────┘ │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ AM           │ │ SDR      │ │ Finance  │ │ Legal  │ │
│  │ 👥           │ │ 📞       │ │ 💰       │ │ ⚖️     │ │
│  │ Good desk    │ │ Standard │ │ Station  │ │ Formal │ │
│  └──────────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────────────────────┐  ┌─────────────────────┐ │
│  │ Market Intelligence      │  │ Knowledge Curator   │ │
│  │ 🔭 Research station      │  │ 📚 Library corner   │ │
│  └──────────────────────────┘  └─────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 2.2 Component Structure

```
src/app/(app)/office/
├── page.tsx                    ← Server Component, fetches all agents with status
└── _components/
    ├── OfficeFloor.tsx         ← "use client" — CSS Grid layout container
    ├── AgentDesk.tsx           ← Individual desk with sprite, status dot, click handler
    ├── StatusDot.tsx           ← Animated pulsing dot (active/idle/muted/dark)
    └── AgentSheet.tsx          ← Side panel on click: status, heartbeat, logs, chat button
```

### 2.3 AgentDesk Props
```typescript
interface AgentDeskProps {
  agent: {
    id: string;
    slug: string;
    name: string;
    emoji: string;
    status: "active" | "idle" | "built_not_calibrated" | "offline";
    last_heartbeat_at: string | null;
  };
  rank: "director" | "senior" | "standard" | "support" | "research";
}
```

### 2.4 Status Dot Animation (CSS)
```css
@keyframes pulse-green {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
}
/* active → emerald-500 + pulse-green */
/* idle → amber-500 + pulse-amber (slower) */
/* built_not_calibrated → zinc-500, no animation */
/* offline → zinc-700, no animation */
```

### 2.5 Desk Styling by Rank
```
director: col-span-2, min-h-48, bg-zinc-900, border-2 border-indigo-800, shadow-lg shadow-indigo-950/50, p-6
senior:   col-span-1, min-h-36, bg-zinc-900, border border-zinc-700, shadow-md, p-4
standard: col-span-1, min-h-32, bg-zinc-900, border border-zinc-800, p-4
support:  col-span-1, min-h-32, bg-zinc-900, border border-zinc-800, p-3
research: col-span-1, min-h-32, bg-zinc-900, border border-zinc-800, p-3
```

### 2.6 Click Interaction
Click any desk → Sheet opens from right → shows:
- Agent name + emoji + status badge
- Last heartbeat (relative time)
- Last 3 entries from agent_logs (if none: "No recent activity")
- "Open Chat" button → navigates to /chat?agent={slug}
- "View Logs" button → navigates to /logs?agent={slug}

### 2.7 Sidebar Entry
Add to sidebar nav after Dashboard:
`{ href: "/office", label: "The Office", icon: Building2 }`

---

## 3. Chat Panel

Direct chat interface with any of the 8 agents.

### 3.1 Architecture Note (CRITICAL — Claude Code must read this)
Sub-agents report to HERMES only and never communicate directly with Boss. The Chat panel is a convenience layer — it does NOT bypass this hierarchy. Messages sent to sub-agents are stored and displayed but responses are generated by HERMES acting on behalf of the sub-agent based on their workspace context. When chatting with HERMES directly, HERMES responds in full.

### 3.2 Database Schema
```sql
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint chat_conversations_agent_id_fkey foreign key (agent_id) references public.agents(id)
);

create index idx_chat_conversations_agent_id on public.chat_conversations(agent_id);
create index idx_chat_conversations_created_at on public.chat_conversations(created_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_conversation_id on public.chat_messages(conversation_id);

-- RLS
alter table public.chat_conversations enable row level security;
create policy "auth users read chat_conversations" on public.chat_conversations for select to authenticated using (true);
create policy "service role all chat_conversations" on public.chat_conversations for all to service_role using (true);

alter table public.chat_messages enable row level security;
create policy "auth users read chat_messages" on public.chat_messages for select to authenticated using (true);
create policy "service role all chat_messages" on public.chat_messages for all to service_role using (true);
```

### 3.3 File Structure
```
src/app/(app)/chat/
├── page.tsx                 ← Agent selector, conversation list
└── [conversationId]/
    ├── page.tsx             ← Message thread
    └── actions.ts           ← sendMessage(conversationId, content)
```

### 3.4 UI Spec
- Left panel (w-64): Agent list with avatar emoji + name, active conversation highlighted
- Right panel (flex-1): Message thread, oldest at top, user messages right-aligned (indigo bg), agent messages left-aligned (zinc-800 bg)
- Bottom: Textarea + Send button. Enter to send, Shift+Enter for newline.

---

## 4. Tokens & Cost Tracking

Critical business metric: Delphi's operational AI cost tracked per agent, per model, per day.

### 4.1 Database Schema
```sql
create table public.agent_token_usage (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,6) not null default 0,
  session_key text,
  task_description text,
  recorded_at timestamptz not null default now()
);

create index idx_agent_token_usage_agent_id on public.agent_token_usage(agent_id);
create index idx_agent_token_usage_recorded_at on public.agent_token_usage(recorded_at desc);
create index idx_agent_token_usage_model on public.agent_token_usage(model);

alter table public.agent_token_usage enable row level security;
create policy "auth users read token usage" on public.agent_token_usage for select to authenticated using (true);
create policy "service role all token usage" on public.agent_token_usage for all to service_role using (true);
```

### 4.2 Cost Constants
```typescript
// src/lib/model-costs.ts
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 0.000003, output: 0.000015 },
  "claude-haiku-4-5-20251001": { input: 0.00000025, output: 0.00000125 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MODEL_COSTS[model] ?? { input: 0, output: 0 };
  return rates.input * inputTokens + rates.output * outputTokens;
}
```

### 4.3 File Structure
```
src/app/(app)/costs/
└── page.tsx    ← Server Component: KPI cards + agent table + Recharts chart
```

### 4.4 UI Spec
- KPI row: Total Today | Total This Week | Total This Month | All Time (4 cards)
- Agent breakdown table: Agent | Model | Input Tokens | Output Tokens | Cost USD | Last recorded
- Cost trend chart: Recharts LineChart, x-axis = date (last 30 days), y-axis = cost_usd, one line per agent, legend
- Model breakdown: Recharts PieChart showing cost split by model
- CSV export button: downloads agent_token_usage as CSV

### 4.5 Recharts Chart Component (Client Component)
```typescript
// src/app/(app)/costs/_components/CostChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CostChartProps {
  data: { date: string; [agentSlug: string]: number | string }[];
  agents: { slug: string; name: string }[];
}

const AGENT_COLOURS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];
```

---

## 5. Gateway Config Panel

Read/edit OpenClaw gateway config. Sensitive — strict security model.

### 5.1 Security Rules (Non-Negotiable)
1. Read-only by default — no edit affordance visible on load
2. "Enable Editing" button shows a Dialog warning: "You are about to modify the live HERMES gateway. Incorrect values can break all agent operations. This action is logged."
3. After confirm → edit mode enabled
4. Credential fields (API keys, tokens) NEVER shown in plain text — always `••••••••` with a Copy button that reads from server
5. All writes go to gateway API `http://localhost:18789` — never direct file manipulation
6. Every save creates an `audit_log` entry: action="gateway_config_updated", entity_type="gateway"
7. Only stable update channel allowed — warn with red border if beta is selected

### 5.2 File Structure
```
src/app/(app)/gateway/
└── page.tsx
```

### 5.3 Sections Displayed
- Model Configuration: current model, sub-agent model (editable)
- Scheduled Jobs: list of 4 cron jobs with name, schedule, next run (read-only)
- Update Settings: channel selector (stable/beta with warning), auto-update toggle
- Rate Limits: requests/min display (read-only)

---

## 6. Sessions Panel

Monitor active sub-agent sessions.

```
src/app/(app)/sessions/
└── page.tsx
```

Data source: Gateway API `GET http://localhost:18789/sessions` (if endpoint exists) + `agent_logs` table as fallback.

UI: Table — Agent | Session Key | Status | Started At | Last Activity | Actions (Monitor / Terminate)

---

## 7. Memory Browser

Browse memory files for all 8 agents from the UI.

```
src/app/(app)/memory/
└── page.tsx
```

File paths:
- HERMES: `/home/delphi/.openclaw/workspace/memory/`
- Sub-agents: `/home/delphi/.openclaw/workspace/teams/commercial/{slug}/memory/`

Implementation: Route Handler `GET /api/memory?agent={slug}&file={filename}` reads files from disk and returns content. Markdown rendered with `react-markdown` or `marked`.

UI: Agent selector → file list → file content viewer. Search box that greps across all files for the selected agent.

---

## 8. Log Viewer

```
src/app/(app)/logs/
└── page.tsx
```

Sources:
- `agent_logs` table (primary)
- OpenClaw log: `/home/delphi/.openclaw/logs/commands.log` via Route Handler

Filters: Agent dropdown, Level (info/warn/error/all), Time range (1h/6h/24h/7d), Search text

Live tail: Toggle that polls `agent_logs` every 5s for new entries (Realtime in V5).

---

## 9. Audit Log Page (V3 Gap)

```
src/app/(app)/audit-log/
└── page.tsx
```

Query: `supabase.from("audit_log").select("*, agents(name)").order("created_at", { ascending: false })`

Columns: Timestamp | Agent | Action | Entity Type | Entity ID | Changes (JSON diff, truncated)

Filters: Agent, Action type, Date range

---

## 10. Database Migrations

### Migration 20260304000006_v4_chat.sql
```sql
-- Chat conversations and messages
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists idx_chat_conversations_agent_id on public.chat_conversations(agent_id);
create index if not exists idx_chat_conversations_created_at on public.chat_conversations(created_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_conversation_id on public.chat_messages(conversation_id);

alter table public.chat_conversations enable row level security;
create policy "auth users read chat_conversations" on public.chat_conversations for select to authenticated using (true);
create policy "service role all chat_conversations" on public.chat_conversations for all to service_role using (true) with check (true);

alter table public.chat_messages enable row level security;
create policy "auth users read chat_messages" on public.chat_messages for select to authenticated using (true);
create policy "service role all chat_messages" on public.chat_messages for all to service_role using (true) with check (true);
```

### Migration 20260304000007_v4_cost_tracking.sql
```sql
create table if not exists public.agent_token_usage (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,6) not null default 0,
  session_key text,
  task_description text,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_agent_token_usage_agent_id on public.agent_token_usage(agent_id);
create index if not exists idx_agent_token_usage_recorded_at on public.agent_token_usage(recorded_at desc);
create index if not exists idx_agent_token_usage_model on public.agent_token_usage(model);

alter table public.agent_token_usage enable row level security;
create policy "auth users read token usage" on public.agent_token_usage for select to authenticated using (true);
create policy "service role all token usage" on public.agent_token_usage for all to service_role using (true) with check (true);
```

---

## 11. Updated Sidebar Navigation

```typescript
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/office", label: "The Office", icon: Building2 },       // NEW — prominent position
  { href: "/pipeline", label: "Pipeline", icon: Target },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/chat", label: "Chat", icon: MessageSquare },             // NEW
  { href: "/costs", label: "Costs", icon: DollarSign },             // NEW
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/sessions", label: "Sessions", icon: Monitor },          // NEW
  { href: "/memory", label: "Memory", icon: Brain },                // NEW
  { href: "/logs", label: "Logs", icon: ScrollText },               // NEW
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },  // NEW (V3 gap)
  { href: "/gateway", label: "Gateway", icon: Server },             // NEW
  { href: "/settings", label: "Settings", icon: Settings },
];
```

---

## 12. CLAUDE.md Updates Required

Add to CLAUDE.md:
1. Agent fleet section (all 8 agents, hierarchy, "never build for HERMES only" rule)
2. New pages list (office, chat, costs, sessions, memory, logs, audit-log, gateway)
3. New DB tables (chat_conversations, chat_messages, agent_token_usage)
4. Route Handler pattern for filesystem access (memory browser, log viewer)

---

## 13. Implementation Checklist

### Phase P0 — V3 Fixes (8h)
- [ ] Approval workflow: extend to 6 stages (2h)
- [ ] Lead sheet: wire stage advance action (1h)
- [ ] Audit log: create page UI (2h)
- [ ] Realtime: replace polling on approvals + activity feed (3h)

### Phase P1 — Flagship Features (16h)
- [ ] The Office: full CSS grid, all 8 desks, status dots, click Sheet (8h)
- [ ] Chat panel: DB migration, conversation list, message thread, send action (5h)
- [ ] Sidebar: add all new nav items with correct icons (0.5h)
- [ ] Add Office to sidebar in position 2 (0.5h)
- [ ] react-markdown or marked for memory viewer (1h)
- [ ] Create src/lib/model-costs.ts (0.5h)

### Phase P2 — Operations (12h)
- [ ] Tokens/Cost tracking: DB migration, KPI cards, table, Recharts charts, CSV export (5h)
- [ ] Gateway Config: read config via API, security model, edit mode (4h)
- [ ] Sessions Panel: gateway API integration, table UI (3h)

### Phase P3 — Tooling (10h)
- [ ] Memory Browser: Route Handler, agent selector, file viewer, search (4h)
- [ ] Log Viewer: agent_logs query, filters, live tail (3h)
- [ ] Regenerate database.types.ts after all migrations applied (0.5h)
- [ ] npm run build — must pass clean (0.5h)
- [ ] Restart service + verify HTTP 200 (0.5h)
- [ ] Generate hermes-report-v4.md (1h)

**Total: ~46 hours**

---

## 14. Definition of V4 Done

V4 is complete when ALL of the following pass:

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] All 17 pages render without error (HTTP 200 authenticated)
- [ ] The Office shows all 8 agents with correct status indicators
- [ ] Click on any agent desk opens the Sheet panel
- [ ] Chat sends a message and stores it in DB
- [ ] Cost tracking page shows KPI cards (empty state acceptable if no data yet)
- [ ] Gateway config page loads and masks credentials
- [ ] Audit log page renders with filters working
- [ ] Approval workflow shows all 6 stages
- [ ] Lead detail sheet has working stage advance button
- [ ] Realtime subscription fires on approval change (verify with two browser tabs)
- [ ] All new migrations applied to Supabase
- [ ] `database.types.ts` regenerated
- [ ] Service running HTTP 200 on port 9069
- [ ] hermes-report-v4.md committed

---

## 7. Sessions Panel

### Purpose

Monitor and control active sub-agent sessions for all 8 agents. Operational visibility into what's running right now.

### File Structure

```
src/app/(app)/sessions/
├── page.tsx
└── _components/
    ├── SessionsTable.tsx
    ├── SessionRow.tsx
    └── TerminateButton.tsx
```

### Data Source

```typescript
// Route handler: src/app/api/gateway/sessions/route.ts
// GET http://localhost:18789/sessions
// Auth required

interface GatewaySession {
  session_key: string
  agent_slug: string
  status: 'active' | 'idle' | 'terminated'
  started_at: string
  last_activity_at: string
  estimated_cost_usd: number
}
```

### SessionsTable.tsx

Columns: Agent | Session Key | Status | Started | Last Activity | Est. Cost | Actions

**All 8 agents must appear.** Agents with no active session show a row: agent name | — | "No active session" (zinc-600 text).

Build by: left-joining the `agents` table (from Supabase) against the gateway session list (matched by `agent_slug` = `agents.slug`).

Auto-refresh: `useEffect` + `setInterval(30000)`. Appropriate for this panel.

Actions:
- **Monitor** — opens a new browser tab with the gateway log stream URL for that session
- **Terminate** — shows confirmation dialog, then `DELETE http://localhost:18789/sessions/{key}`

---

## 8. Memory Browser

### Purpose

Browse memory files for all 8 agents without SSH.

### File Structure

```
src/app/(app)/memory/
├── page.tsx
└── _components/
    ├── MemoryBrowser.tsx
    ├── AgentMemorySelector.tsx
    ├── MemoryFileList.tsx
    ├── MemoryFileViewer.tsx
    └── MemorySearch.tsx
```

### Agent Memory Paths

```typescript
// src/lib/memory-paths.ts
export const MEMORY_PATHS: Record<string, string> = {
  'hermes':               '/home/delphi/.openclaw/workspace/memory',
  'ae':                   '/home/delphi/teams/commercial/ae/memory',
  'am':                   '/home/delphi/teams/commercial/am/memory',
  'sdr':                  '/home/delphi/teams/commercial/sdr/memory',
  'finance':              '/home/delphi/teams/commercial/finance/memory',
  'legal':                '/home/delphi/teams/commercial/legal/memory',
  'market-intelligence':  '/home/delphi/teams/commercial/market-intelligence/memory',
  'knowledge-curator':    '/home/delphi/teams/commercial/knowledge-curator/memory',
}
```

### Route Handler

```typescript
// src/app/api/memory/route.ts
// GET /api/memory?agent=hermes           -> returns: string[] of filenames
// GET /api/memory?agent=hermes&file=x.md -> returns: { content: string }
// Security:
// 1. Auth check — require Supabase session
// 2. Validate agent param is in MEMORY_PATHS keys
// 3. Resolve full path = MEMORY_PATHS[agent] + '/' + file
// 4. Verify resolved path starts with MEMORY_PATHS[agent] (prevent traversal)
// 5. Use fs.readdir or fs.readFile (server-side only, never expose to browser)
```

### MemoryFileViewer.tsx

Render `.md` files with `react-markdown`. If not installed: `npm install react-markdown`.

---

## 9. Log Viewer

### Purpose

Unified log stream: database `agent_logs` + system journal.

### File Structure

```
src/app/(app)/logs/
├── page.tsx
└── _components/
    ├── LogViewer.tsx
    ├── LogFilters.tsx
    ├── LogRow.tsx
    └── LiveTailToggle.tsx
```

### Data Sources

**Source 1: `agent_logs` table** (already exists)

```typescript
supabase
  .from('agent_logs')
  .select('*, agents(name, slug)')
  .eq('agent_id', selectedAgentId)    // optional
  .gte('created_at', fromTimestamp)   // optional
  .order('created_at', { ascending: false })
  .limit(200)
```

**Source 2: journalctl** (via route handler)

```typescript
// src/app/api/logs/journal/route.ts
// Runs: journalctl --user -u command-center -n 100 --no-pager --output=json
// Parse output, return as JSON array
// Auth required
```

### LogViewer.tsx Display

Columns: Timestamp | Agent | Action | Detail

Level coloring (infer from `action` field keywords):
- Contains 'error', 'fail' -> `text-red-400`
- Contains 'warn' -> `text-amber-400`
- Otherwise -> `text-zinc-300`

**Live Tail:** When enabled, subscribe to Supabase Realtime on `agent_logs`. New rows appear at top. Prune to max 500 rows.

**Agent filter:** Dropdown — all 8 agents + "All agents". Never HERMES-only.

---

## 10. Audit Log Page

Full UI for the `audit_log` table.

### File Structure

```
src/app/(app)/audit-log/
├── page.tsx
└── _components/
    ├── AuditLogTable.tsx
    ├── AuditLogFilters.tsx
    └── AuditLogRow.tsx
```

### page.tsx Query

```typescript
// URL params: agent, action, from, to, cursor
supabase
  .from('audit_log')
  .select('*')
  .eq('user_email', agentFilter ?? undefined)
  .eq('action', actionFilter ?? undefined)
  .gte('created_at', fromDate ?? undefined)
  .lte('created_at', toDate ?? undefined)
  .order('created_at', { ascending: false })
  .limit(51)  // PAGE_SIZE 50 + 1 for hasMore detection
```

### AuditLogTable.tsx Columns

- **Timestamp** — formatted. Hover shows relative time.
- **Agent/User** — `user_email` column
- **Action** — styled code badge (e.g., `lead_stage_changed`)
- **Entity Type** — `entity_type`
- **Entity ID** — truncated UUID with copy-on-click
- **Changes** — expandable accordion: old_values JSON | new_values JSON

### AuditLogFilters.tsx

Form with URL param submission (not client-side):
- Agent dropdown: all 8 agents + "All"
- Action type: text input
- Date from / Date to: date inputs

---

## 11. Database Migrations (V4 — Exact SQL)

### Migration 8: V4 Approval Stages

**File:** `supabase/migrations/20260304000008_v4_approval_stages.sql`

```sql
alter table public.approvals
  add column if not exists stage text not null default 'submitted',
  add column if not exists stage_history jsonb not null default '[]',
  add column if not exists stage_advanced_at timestamptz,
  add column if not exists stage_advanced_by text;

create table if not exists public.valid_approval_transitions (
  id uuid primary key default gen_random_uuid(),
  from_stage text not null,
  to_stage text not null,
  constraint valid_approval_transitions_unique unique (from_stage, to_stage),
  created_at timestamptz not null default now()
);

insert into public.valid_approval_transitions (from_stage, to_stage) values
  ('draft', 'submitted'),
  ('submitted', 'opened'),
  ('submitted', 'closed'),
  ('opened', 'reviewed'),
  ('reviewed', 'negotiation'),
  ('reviewed', 'closed'),
  ('negotiation', 'closed')
on conflict do nothing;

create index if not exists idx_approvals_stage
  on public.approvals(stage) where archived_at is null;

alter table public.valid_approval_transitions enable row level security;
create policy "authenticated users can read valid_approval_transitions"
  on public.valid_approval_transitions for select to authenticated using (true);
```

### Migration 9: Chat Tables

**File:** `supabase/migrations/20260304000009_v4_chat.sql`

```sql
create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  title text,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) not null,
  role text not null check (role in ('user', 'agent')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_chat_conversations_agent_id
  on public.chat_conversations(agent_id) where archived_at is null;
create index idx_chat_messages_conversation_id
  on public.chat_messages(conversation_id);
create index idx_chat_messages_created_at
  on public.chat_messages(created_at desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

create policy "authenticated users can manage chat_conversations"
  on public.chat_conversations for all to authenticated using (true) with check (true);
create policy "authenticated users can manage chat_messages"
  on public.chat_messages for all to authenticated using (true) with check (true);
```

### Migration 10: Token Usage

**File:** `supabase/migrations/20260304000010_v4_token_usage.sql`

```sql
create table public.agent_token_usage (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,6) not null default 0,
  session_key text,
  task_description text,
  recorded_at timestamptz not null default now()
);

create index idx_token_usage_agent_id on public.agent_token_usage(agent_id);
create index idx_token_usage_recorded_at on public.agent_token_usage(recorded_at desc);
create index idx_token_usage_agent_recorded
  on public.agent_token_usage(agent_id, recorded_at desc);

alter table public.agent_token_usage enable row level security;

create policy "authenticated users can read token usage"
  on public.agent_token_usage for select to authenticated using (true);
create policy "authenticated users can insert token usage"
  on public.agent_token_usage for insert to authenticated with check (true);
```

### Migration 11: Audit Log Hardening

**File:** `supabase/migrations/20260304000011_v4_audit_log.sql`

```sql
-- Create if not exists (V3 may have created it already)
create table if not exists public.audit_log (
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

-- Add user_email if missing (V3 may have omitted)
alter table public.audit_log add column if not exists user_email text;

create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_user_email on public.audit_log(user_email);
create index if not exists idx_audit_log_action on public.audit_log(action);
create index if not exists idx_audit_log_entity on public.audit_log(entity_type, entity_id);

alter table public.audit_log enable row level security;

-- Immutable: select and insert only, no update or delete
create policy "authenticated users can read audit_log"
  on public.audit_log for select to authenticated using (true);
create policy "authenticated users can insert audit_log"
  on public.audit_log for insert to authenticated with check (true);
```

### Post-Migration: Type Regeneration

After all migrations are applied:
```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

