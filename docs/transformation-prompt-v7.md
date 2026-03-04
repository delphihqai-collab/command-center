# Mission Control Transformation Prompt — V7

> **Purpose:** This document is a complete, self-contained prompt for an AI agent with full codebase access. It specifies every step needed to transform Command Center (Delphi commercial backoffice) into Mission Control (generic AI agent orchestration dashboard).

---

## Context & Goal

You are refactoring **Command Center** — currently a Delphi-specific commercial backoffice (pipeline, proposals, invoices, clients, approvals) — into **Mission Control** — a generic AI agent orchestration dashboard modeled after [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control).

**Stack stays the same:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (PostgreSQL + Auth + RLS) · Recharts · Lucide icons · date-fns · Sonner · @dnd-kit

**What changes:** All Delphi commercial domain logic is removed and replaced with generic agent orchestration features: task board (kanban), webhooks, workflows, agent SOUL system, inter-agent comms, quality reviews, standup reports, notifications, GitHub sync, integrations, scheduler/cron.

---

## Direct Comparison: What Exists → What It Becomes

### Pages to DELETE (commercial)

| Current Route | Current Purpose | Replacement |
|---------------|----------------|-------------|
| `/pipeline` | Lead kanban + list (9 stages) | **DELETE** → replaced by `/tasks` |
| `/pipeline/[id]` | Lead detail (MEDDIC, stage history) | **DELETE** |
| `/clients` | Client list + health filters | **DELETE** |
| `/clients/[id]` | Client detail + health chart + notes | **DELETE** |
| `/proposals` | Proposal list | **DELETE** |
| `/proposals/[id]` | Proposal detail + gate trackers | **DELETE** |
| `/invoices` | Invoice list | **DELETE** |
| `/invoices/[id]` | Invoice detail | **DELETE** |
| `/approvals` | Approval queue (pending decisions) | **DELETE** |
| `/knowledge` | Deal learnings list | **DELETE** |
| `/knowledge/new` | Create deal learning | **DELETE** |
| `/knowledge/[id]/edit` | Edit deal learning | **DELETE** |
| `/reports` | Weekly commercial reports | **DELETE** → replaced by `/standup` |

### Pages to KEEP (already aligned)

| Route | Purpose | Changes Needed |
|-------|---------|---------------|
| `/dashboard` | Overview KPIs + activity | **REWRITE** KPIs (remove commercial, add task/agent metrics) |
| `/agents` | Agent fleet list | Minor: update type labels |
| `/agents/[slug]` | Agent detail + calibration | **MODIFY**: remove calibration, add SOUL/comms/tasks sections |
| `/office` | Pixel-art agent grid | No changes |
| `/chat` | Chat conversations | No changes |
| `/chat/[conversationId]` | Chat thread | No changes |
| `/costs` | Token/cost dashboard | No changes |
| `/sessions` | Agent session monitoring | No changes |
| `/memory` | Memory file browser | No changes |
| `/logs` | Log viewer (journalctl) | No changes |
| `/audit-log` | Immutable audit trail | No changes |
| `/gateway` | Gateway config | No changes |
| `/alerts` | Alert rules + events | Minor: update entity_type labels |
| `/settings` | App settings | **MODIFY**: remove Pipeline tab, add Scheduler tab |

### Pages to CREATE (new MC features)

| New Route | Purpose | Key Components |
|-----------|---------|---------------|
| `/tasks` | Kanban task board (6 columns) | Drag-drop via @dnd-kit, priority badges, assignments |
| `/tasks/[id]` | Task detail + comments + reviews | Threaded comments, quality review form |
| `/agents/[slug]/soul` | Agent SOUL editor | Markdown textarea + save |
| `/comms` | Inter-agent messaging feed | Realtime subscription |
| `/webhooks` | Webhook CRUD + delivery history | Create/edit dialog, expandable delivery log |
| `/workflows` | Workflow templates list | Step visualization |
| `/workflows/[id]` | Workflow detail | Step editor (JSON) |
| `/pipelines` | Pipeline/workflow runs | Status timeline |
| `/pipelines/[id]` | Run detail | Step-by-step status |
| `/cron` | Scheduled task management | Enable/disable toggles, manual trigger |
| `/standup` | Auto-generated standup reports | Formatted report cards |
| `/notifications` | Notification center | Mark-as-read, Realtime |
| `/integrations` | Third-party integrations | Enable/disable, config cards |

---

## Phase 0: Database Migration

**Create file:** `supabase/migrations/20260304000022_v7_mission_control.sql`

This is the most critical phase. One atomic migration that:
- Drops all 16 commercial tables
- Alters 4 kept tables
- Creates 17 new tables
- Sets up RLS
- Seeds new alert rules and a default project

```sql
-- ============================================================================
-- MISSION CONTROL v7 MIGRATION
-- Transforms Command Center from Delphi commercial backoffice
-- into generic AI agent orchestration dashboard
-- ============================================================================

-- ============================================================================
-- PHASE A: Drop commercial tables and their dependencies
-- ============================================================================

-- Drop RLS policies on commercial tables first
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can read lead_stage_history" ON public.lead_stage_history;
DROP POLICY IF EXISTS "Authenticated users can read proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can read client_health_history" ON public.client_health_history;
DROP POLICY IF EXISTS "Authenticated users can read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can read approvals" ON public.approvals;
DROP POLICY IF EXISTS "Authenticated users can update approvals" ON public.approvals;
DROP POLICY IF EXISTS "Authenticated users can read deal_learnings" ON public.deal_learnings;
DROP POLICY IF EXISTS "Authenticated users can read onboarding_patterns" ON public.onboarding_patterns;
DROP POLICY IF EXISTS "Authenticated users can read client_notes" ON public.client_notes;
DROP POLICY IF EXISTS "Service role can write client_notes" ON public.client_notes;
DROP POLICY IF EXISTS "Authenticated users can insert client_notes" ON public.client_notes;
DROP POLICY IF EXISTS "Authenticated users can read calibration_gates" ON public.calibration_gates;
DROP POLICY IF EXISTS "Service role can write calibration_gates" ON public.calibration_gates;
DROP POLICY IF EXISTS "Authenticated users can read weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Service role can write weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Authenticated users can read notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Authenticated users can manage notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Authenticated users can read pipeline_config" ON public.pipeline_config;
DROP POLICY IF EXISTS "Authenticated users can manage pipeline_config" ON public.pipeline_config;
DROP POLICY IF EXISTS "Authenticated users can read valid_stage_transitions" ON public.valid_stage_transitions;
DROP POLICY IF EXISTS "Authenticated users can read valid_approval_transitions" ON public.valid_approval_transitions;

-- Drop trigger functions for commercial tables
DROP FUNCTION IF EXISTS public.validate_stage_transition() CASCADE;
DROP FUNCTION IF EXISTS public.update_leads_search_vector() CASCADE;
DROP FUNCTION IF EXISTS public.update_clients_search_vector() CASCADE;
DROP FUNCTION IF EXISTS public.update_proposals_search_vector() CASCADE;

-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS public.onboarding_patterns CASCADE;
DROP TABLE IF EXISTS public.deal_learnings CASCADE;
DROP TABLE IF EXISTS public.client_notes CASCADE;
DROP TABLE IF EXISTS public.client_health_history CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.lead_stage_history CASCADE;
DROP TABLE IF EXISTS public.proposals CASCADE;
DROP TABLE IF EXISTS public.valid_stage_transitions CASCADE;
DROP TABLE IF EXISTS public.valid_approval_transitions CASCADE;
DROP TABLE IF EXISTS public.approvals CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.weekly_reports CASCADE;
DROP TABLE IF EXISTS public.calibration_gates CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.pipeline_config CASCADE;

-- ============================================================================
-- PHASE B: Alter kept tables for Mission Control
-- ============================================================================

-- agents: add last_seen + capabilities, relax type constraint for generic use
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_type_check;
ALTER TABLE public.agents ADD CONSTRAINT agents_type_check
  CHECK (type IN ('director', 'orchestrator', 'worker', 'specialist', 'observer'));
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS last_seen timestamptz;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS capabilities jsonb DEFAULT '[]'::jsonb;

-- agent_reports: relax report_type to generic types
ALTER TABLE public.agent_reports DROP CONSTRAINT IF EXISTS agent_reports_report_type_check;
ALTER TABLE public.agent_reports ADD CONSTRAINT agent_reports_report_type_check
  CHECK (report_type IN (
    'heartbeat', 'status_update', 'task_completion', 'error_report',
    'performance_summary', 'standup', 'cost_report', 'synthesis', 'custom'
  ));
ALTER TABLE public.agent_reports DROP CONSTRAINT IF EXISTS agent_reports_related_entity_type_check;
ALTER TABLE public.agent_reports ADD CONSTRAINT agent_reports_related_entity_type_check
  CHECK (related_entity_type IN ('task', 'agent', 'webhook', 'workflow', 'session'));

-- agent_logs: relax related_entity_type
ALTER TABLE public.agent_logs DROP CONSTRAINT IF EXISTS agent_logs_related_entity_type_check;
ALTER TABLE public.agent_logs ADD CONSTRAINT agent_logs_related_entity_type_check
  CHECK (related_entity_type IN ('task', 'agent', 'webhook', 'workflow', 'session', 'notification'));

-- alert_rules: update entity_type constraint
ALTER TABLE public.alert_rules DROP CONSTRAINT IF EXISTS alert_rules_entity_type_check;
ALTER TABLE public.alert_rules ADD CONSTRAINT alert_rules_entity_type_check
  CHECK (entity_type IN ('task', 'agent', 'webhook', 'scheduler', 'workflow', 'system'));

-- Clear old seed alert_rules that referenced commercial entities
DELETE FROM public.alert_events;
DELETE FROM public.alert_rules;

-- ============================================================================
-- PHASE C: Create Mission Control tables
-- ============================================================================

-- PROJECTS (multi-project task organization)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  ticket_prefix text NOT NULL DEFAULT 'MC',
  ticket_counter int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- TASKS (Kanban — centerpiece feature)
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'inbox' CHECK (status IN (
    'inbox', 'backlog', 'todo', 'in_progress', 'review', 'done'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'urgent'
  )),
  assigned_to uuid REFERENCES public.agents(id),
  created_by text,
  project_id uuid REFERENCES public.projects(id),
  ticket_ref text,
  due_date timestamptz,
  labels text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tasks full-text search trigger
CREATE OR REPLACE FUNCTION public.update_tasks_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_search_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_tasks_search_vector();

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_created ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_search ON public.tasks USING gin(search_vector);
CREATE INDEX idx_tasks_active ON public.tasks(status, updated_at) WHERE archived_at IS NULL;

-- TASK COMMENTS (threaded)
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'system',
  content text NOT NULL,
  parent_id uuid REFERENCES public.task_comments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_parent ON public.task_comments(parent_id);

-- TASK SUBSCRIPTIONS (agent-task link)
CREATE TABLE public.task_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, agent_id)
);

-- QUALITY REVIEWS (gate for task completion)
CREATE TABLE public.quality_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_changes')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quality_reviews_task ON public.quality_reviews(task_id);
CREATE INDEX idx_quality_reviews_status ON public.quality_reviews(status);

-- WEBHOOKS (outbound event delivery)
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  consecutive_failures int NOT NULL DEFAULT 0,
  last_failure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- WEBHOOK DELIVERIES (delivery history)
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status_code int,
  response text,
  duration_ms int,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created ON public.webhook_deliveries(created_at DESC);

-- SCHEDULED TASKS (cron/background jobs)
CREATE TABLE public.scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  schedule text NOT NULL,
  handler text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_run timestamptz,
  next_run timestamptz,
  last_status text CHECK (last_status IN ('success', 'failed', 'running')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- STANDUP REPORTS (auto-generated)
CREATE TABLE public.standup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content jsonb NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  generated_by uuid REFERENCES public.agents(id),
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_standup_reports_period ON public.standup_reports(period_start DESC);

-- WORKFLOWS (templates)
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- PIPELINE RUNS (workflow execution instances)
CREATE TABLE public.pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  trigger_type text DEFAULT 'manual',
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_pipeline_runs_workflow ON public.pipeline_runs(workflow_id);
CREATE INDEX idx_pipeline_runs_status ON public.pipeline_runs(status);

-- NOTIFICATIONS (in-app)
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL DEFAULT 'all',
  type text NOT NULL CHECK (type IN (
    'alert', 'task_assigned', 'task_completed', 'review_requested',
    'webhook_failure', 'agent_offline', 'system', 'custom'
  )),
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_read ON public.notifications(read, created_at DESC);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient);

-- AGENT SOULS (personality/capabilities markdown)
CREATE TABLE public.agent_souls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) UNIQUE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AGENT COMMS (inter-agent messaging)
CREATE TABLE public.agent_comms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id uuid NOT NULL REFERENCES public.agents(id),
  to_agent_id uuid REFERENCES public.agents(id),
  channel text DEFAULT 'general',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_comms_from ON public.agent_comms(from_agent_id);
CREATE INDEX idx_agent_comms_to ON public.agent_comms(to_agent_id);
CREATE INDEX idx_agent_comms_channel ON public.agent_comms(channel);
CREATE INDEX idx_agent_comms_created ON public.agent_comms(created_at DESC);

-- INTEGRATIONS (third-party connections)
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('github', 'slack', 'discord', 'custom_api', 'webhook_source')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- GITHUB ISSUES SYNC
CREATE TABLE public.github_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES public.integrations(id),
  repo text NOT NULL,
  issue_number int NOT NULL,
  title text NOT NULL,
  body text,
  state text NOT NULL DEFAULT 'open',
  labels text[] DEFAULT '{}',
  assignee text,
  task_id uuid REFERENCES public.tasks(id),
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(repo, issue_number)
);

CREATE INDEX idx_github_issues_repo ON public.github_issues(repo);
CREATE INDEX idx_github_issues_state ON public.github_issues(state);

-- SYSTEM CONFIG (replaces pipeline_config)
CREATE TABLE public.system_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- PHASE D: RLS for all new tables
-- ============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standup_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_comms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Read policies: authenticated users can read everything
CREATE POLICY "auth_read" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.task_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.quality_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.webhooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.webhook_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.scheduled_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.standup_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.pipeline_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.agent_souls FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.agent_comms FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.integrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.github_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON public.system_config FOR SELECT TO authenticated USING (true);

-- Write policies for authenticated users
CREATE POLICY "auth_write" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.task_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.task_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.quality_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.webhooks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.workflows FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.scheduled_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.agent_souls FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write" ON public.system_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role write for agent-generated data
CREATE POLICY "service_write" ON public.agent_comms FOR ALL TO service_role USING (true);
CREATE POLICY "auth_read_comms" ON public.agent_comms FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_write" ON public.standup_reports FOR ALL TO service_role USING (true);
CREATE POLICY "service_write" ON public.pipeline_runs FOR ALL TO service_role USING (true);
CREATE POLICY "service_write" ON public.webhook_deliveries FOR ALL TO service_role USING (true);
CREATE POLICY "service_write" ON public.github_issues FOR ALL TO service_role USING (true);
CREATE POLICY "service_write" ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================================
-- PHASE E: Seed new data
-- ============================================================================

-- Seed alert rules for Mission Control
INSERT INTO public.alert_rules (name, description, entity_type, condition_field, condition_operator, condition_value, severity) VALUES
  ('Agent Offline', 'Agent has not been seen in 24 hours', 'agent', 'last_seen', 'days_since', '1', 'critical'),
  ('Task Stalled', 'Task stuck in_progress for more than 48 hours', 'task', 'updated_at', 'days_since', '2', 'high'),
  ('Webhook Failing', 'Webhook has 3+ consecutive failures', 'webhook', 'consecutive_failures', 'gt', '3', 'high'),
  ('Scheduler Missed', 'Scheduled task missed its run window', 'scheduler', 'next_run', 'days_since', '0', 'medium');

-- Seed a default project
INSERT INTO public.projects (name, slug, ticket_prefix) VALUES
  ('Default', 'default', 'MC');

-- Seed system config
INSERT INTO public.system_config (key, value) VALUES
  ('agent_logs_retain_days', '"90"'),
  ('audit_log_retain_days', '"365"'),
  ('webhook_max_retries', '"5"'),
  ('standup_schedule', '"0 9 * * 1-5"'),
  ('task_stale_threshold_hours', '"48"');
```

**After applying migration, regenerate types:**
```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

---

## Phase 1: Delete Commercial Code

Delete these files and directories entirely:

### Directories (recursive delete)
```
src/app/(app)/pipeline/           # Leads kanban, table, detail, 12+ files
src/app/(app)/clients/            # Client list, detail, health, notes, 6+ files
src/app/(app)/proposals/          # Proposal list, detail, 2+ files
src/app/(app)/invoices/           # Invoice list, detail, 2+ files
src/app/(app)/approvals/          # Approval queue, actions, 4+ files
src/app/(app)/knowledge/          # Deal learnings CRUD, 5+ files
src/app/(app)/reports/            # Weekly commercial reports, 2+ files
```

### Individual files
```
src/app/(app)/dashboard/_components/pipeline-funnel-chart.tsx
src/app/(app)/agents/[slug]/_components/calibration-tracker.tsx
src/app/api/search/route.ts          # Will be recreated with new search targets
src/app/api/hermes/                   # Entire directory (approval-decision endpoint)
src/lib/lead-scoring.ts
src/lib/schemas.ts                    # Will be recreated with new schemas
```

---

## Phase 2: Rewrite `src/lib/types.ts`

Replace the entire file with Mission Control types:

```typescript
import type { Database } from "./database.types";

// ── Kept from Command Center ──────────────────────────────────────────
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentReport = Database["public"]["Tables"]["agent_reports"]["Row"];
export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type ChatConversation = Database["public"]["Tables"]["chat_conversations"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type AgentTokenUsage = Database["public"]["Tables"]["agent_token_usage"]["Row"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type AlertRule = Database["public"]["Tables"]["alert_rules"]["Row"];
export type AlertEvent = Database["public"]["Tables"]["alert_events"]["Row"];
export type Heartbeat = Database["public"]["Tables"]["heartbeats"]["Row"];

// ── New Mission Control types ─────────────────────────────────────────
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"];
export type TaskSubscription = Database["public"]["Tables"]["task_subscriptions"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type QualityReview = Database["public"]["Tables"]["quality_reviews"]["Row"];
export type Webhook = Database["public"]["Tables"]["webhooks"]["Row"];
export type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];
export type ScheduledTask = Database["public"]["Tables"]["scheduled_tasks"]["Row"];
export type StandupReport = Database["public"]["Tables"]["standup_reports"]["Row"];
export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type PipelineRun = Database["public"]["Tables"]["pipeline_runs"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AgentSoul = Database["public"]["Tables"]["agent_souls"]["Row"];
export type AgentComm = Database["public"]["Tables"]["agent_comms"]["Row"];
export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type GithubIssue = Database["public"]["Tables"]["github_issues"]["Row"];
export type SystemConfig = Database["public"]["Tables"]["system_config"]["Row"];

// ── Shared utilities ──────────────────────────────────────────────────
export type ServerActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export const TASK_STATUSES = [
  "inbox", "backlog", "todo", "in_progress", "review", "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
```

---

## Phase 3: Rewrite `src/lib/schemas.ts`

Create new file with Mission Control Zod schemas:

```typescript
import { z } from "zod/v4";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["inbox", "backlog", "todo", "in_progress", "review", "done"]).default("inbox"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigned_to: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  labels: z.array(z.string()).default([]),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().min(8, "Secret must be at least 8 characters"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  enabled: z.boolean().default(true),
});
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  steps: z.array(z.object({
    name: z.string(),
    type: z.enum(["agent_action", "condition", "wait", "webhook"]),
    config: z.record(z.string(), z.unknown()),
  })),
});
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
```

---

## Phase 4: Rewrite Sidebar Navigation

**File:** `src/components/sidebar.tsx`

Replace the `navItems` array with:

```typescript
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/office", label: "The Office", icon: Building2 },
  { href: "/agents", label: "Agent Squad", icon: Bot },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/comms", label: "Agent Comms", icon: Radio },
  { href: "/standup", label: "Standup", icon: Megaphone },
  { href: "/costs", label: "Costs", icon: DollarSign },
  { href: "/sessions", label: "Sessions", icon: Monitor },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/cron", label: "Scheduler", icon: Clock },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/gateway", label: "Gateway", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: KanbanSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/office", label: "Office", icon: Building2 },
];
```

Also update the branding: change `"D"` avatar to `"MC"` and `"Command Center"` to `"Mission Control"`.

Add new Lucide imports: `KanbanSquare, Radio, Megaphone, Webhook, GitBranch, Clock, BellRing, Plug`.

---

## Phase 5: Rewrite Dashboard

**File:** `src/app/(app)/dashboard/page.tsx`

Replace the 5 commercial KPI cards with Mission Control metrics:

| Old KPI | New KPI |
|---------|---------|
| Leads This Week | Active Tasks (status not inbox/done) |
| Proposals Sent | In Review (status = review) |
| Active Clients | Active Agents (status = active) |
| Monthly Revenue | Open Alerts (resolved = false) |
| Critical Alerts | MTD Token Cost (sum cost_usd this month) |

Replace the `PipelineFunnel` section with a `RecentTasks` section showing latest 10 tasks with status badges.

Replace the `FlagsAndApprovals` section with a `TasksByAgent` section showing task count per agent.

**Keep:** Agent Status Grid (queries `agents` + `heartbeats`) and Recent Activity Feed (queries `agent_logs`).

**Delete:** `src/app/(app)/dashboard/_components/pipeline-funnel-chart.tsx`

---

## Phase 6: Build Task Board (Kanban) — CENTERPIECE

This is the most important new feature. **Reuse the existing @dnd-kit pattern** from the pipeline kanban.

### Reference files to study:
- `src/app/(app)/pipeline/_components/pipeline-kanban.tsx` — DndContext + SortableContext pattern
- `src/app/(app)/pipeline/_components/kanban-column.tsx` — Droppable column component
- `src/app/(app)/pipeline/_components/kanban-card.tsx` — Draggable card component

### Files to create:

**`src/app/(app)/tasks/page.tsx`** — Server Component
```
- Fetch all non-archived tasks with agent join
- Fetch all projects
- Group tasks by TASK_STATUSES
- Render <TaskKanban> client component
- Include <RealtimeRefresh table="tasks" />
```

**`src/app/(app)/tasks/actions.ts`** — Server Actions
```typescript
moveTask(taskId: string, newStatus: TaskStatus)
createTask(data: CreateTaskInput)
updateTask(taskId: string, data: Partial<Task>)
archiveTask(taskId: string)
addComment(taskId: string, content: string)
submitReview(taskId: string, status: string, notes?: string)
```

**`src/app/(app)/tasks/_components/task-kanban.tsx`** — Client Component
```
- "use client"
- DndContext from @dnd-kit/core
- 6 columns: inbox, backlog, todo, in_progress, review, done
- handleDragEnd calls moveTask server action via startTransition
- Column headers with count badges
- Color-coded: inbox (zinc), backlog (zinc), todo (indigo), in_progress (amber), review (purple), done (emerald)
```

**`src/app/(app)/tasks/_components/task-kanban-column.tsx`** — Droppable column
```
- useDroppable from @dnd-kit/core
- Accepts TaskCard children
- Shows column title + count
- Drop indicator styling
```

**`src/app/(app)/tasks/_components/task-card.tsx`** — Draggable card
```
- useDraggable from @dnd-kit/core
- Shows: title, priority badge (StatusBadge), assigned agent name, due date, labels
- Click opens task-detail-sheet
```

**`src/app/(app)/tasks/_components/task-detail-sheet.tsx`** — Sheet overlay
```
- Uses Sheet from shadcn/ui
- Full task detail: title, description, status, priority, assignment
- Comments thread (threaded via parent_id)
- Quality review section (when status = review)
- Edit capability
```

**`src/app/(app)/tasks/_components/create-task-dialog.tsx`** — Create dialog
```
- Uses Dialog from shadcn/ui
- Form: title, description, priority (select), project (select), assigned_to (select from agents), labels, due_date
- Validates with createTaskSchema
- Calls createTask server action
```

**`src/app/(app)/tasks/[id]/page.tsx`** — Full-page task detail
```
- Server Component
- Fetch task + comments + reviews + assigned agent
- Render full detail with comment form and review form
```

---

## Phase 7: Update StatusBadge

**File:** `src/components/status-badge.tsx`

Remove commercial status mappings and add MC-specific ones:

```typescript
// REMOVE: closed_won, closed_lost, at_risk, drafting, negotiation, proposal_sent,
// sent, gate_atlas, gate_legal, gate_finance, prospecting, qualification,
// initial_contact, demo, needs_analysis, won, lost, ghosted, disputed,
// pending (commercial), paid, overdue

// ADD:
// Task statuses
inbox: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
backlog: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
todo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/20",
review: "bg-purple-500/15 text-purple-400 border-purple-500/20",
done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",

// Task priorities
low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
high: "bg-red-500/15 text-red-400 border-red-500/20",
urgent: "bg-red-500/15 text-red-400 border-red-500/20",

// Workflow/pipeline statuses
running: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
cancelled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",

// Quality review
needs_changes: "bg-amber-500/15 text-amber-400 border-amber-500/20",

// Webhook
enabled: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
disabled: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
```

---

## Phase 8: Rewrite Command Palette Search

**File:** `src/components/command-palette.tsx`

Replace search targets: tasks + agents (instead of leads + clients + proposals).

**Recreate:** `src/app/api/search/route.ts`

```typescript
// Search tasks via search_vector, agents via name ilike
const [tasksRes, agentsRes] = await Promise.all([
  supabase.from("tasks").select("id, title, status, priority")
    .textSearch("search_vector", q.split(" ").join(" & ")).limit(5),
  supabase.from("agents").select("id, slug, name, status")
    .ilike("name", `%${q}%`).limit(5),
]);
return NextResponse.json({
  results: { tasks: tasksRes.data ?? [], agents: agentsRes.data ?? [] }
});
```

Update CommandPalette to render:
- Tasks with `KanbanSquare` icon → navigate to `/tasks/{id}`
- Agents with `Bot` icon → navigate to `/agents/{slug}`

---

## Phase 9: Build Remaining New Pages

Each page follows the established pattern: Server Component page.tsx + optional actions.ts + optional _components/ directory.

### 9a. Agent SOUL Editor
```
src/app/(app)/agents/[slug]/soul/page.tsx       — Server: fetch agent + soul
src/app/(app)/agents/[slug]/soul/actions.ts     — Server action: updateSoul
src/app/(app)/agents/[slug]/soul/_components/soul-editor.tsx — Client: markdown textarea + save
```

### 9b. Agent Comms
```
src/app/(app)/comms/page.tsx                     — Server: fetch recent agent_comms
src/app/(app)/comms/_components/comms-feed.tsx   — Client: Realtime subscription on agent_comms
```

### 9c. Webhooks
```
src/app/(app)/webhooks/page.tsx                  — Server: list webhooks + delivery stats
src/app/(app)/webhooks/actions.ts                — CRUD server actions
src/app/(app)/webhooks/_components/webhook-form.tsx     — Client: create/edit dialog
src/app/(app)/webhooks/_components/delivery-history.tsx — Client: expandable delivery log
```

### 9d. Workflows
```
src/app/(app)/workflows/page.tsx                 — Server: list workflow templates
src/app/(app)/workflows/[id]/page.tsx            — Server: workflow detail + step visualization
src/app/(app)/workflows/actions.ts               — CRUD server actions
```

### 9e. Pipeline Runs
```
src/app/(app)/pipelines/page.tsx                 — Server: recent pipeline runs
src/app/(app)/pipelines/[id]/page.tsx            — Server: run detail + step status
```

### 9f. Scheduler (Cron)
```
src/app/(app)/cron/page.tsx                      — Server: list scheduled tasks
src/app/(app)/cron/actions.ts                    — Toggle enable, manual trigger
src/app/(app)/cron/_components/cron-table.tsx    — Client: toggle switches + trigger buttons
```

### 9g. Standup Reports
```
src/app/(app)/standup/page.tsx                   — Server: list standup reports
src/app/(app)/standup/[id]/page.tsx              — Server: standup detail (render JSON as formatted report)
```

### 9h. Notifications
```
src/app/(app)/notifications/page.tsx             — Server: list notifications
src/app/(app)/notifications/actions.ts           — markAsRead, markAllRead
src/app/(app)/notifications/_components/notification-list.tsx — Client: Realtime + mark-as-read
```

### 9i. Integrations
```
src/app/(app)/integrations/page.tsx              — Server: list integrations
src/app/(app)/integrations/actions.ts            — Enable/disable, trigger sync
src/app/(app)/integrations/_components/integration-card.tsx — Client: config card
```

---

## Phase 10: Build New API Routes

### Task APIs
```
src/app/api/tasks/route.ts                    — GET (list + filter) / POST (create)
src/app/api/tasks/[id]/route.ts               — GET / PATCH / DELETE
src/app/api/tasks/[id]/comments/route.ts      — GET / POST
```

### Agent APIs
```
src/app/api/agents/[id]/soul/route.ts         — GET / PUT
src/app/api/agents/[id]/heartbeat/route.ts    — POST (updates last_seen)
src/app/api/agents/[id]/wake/route.ts         — POST
src/app/api/agents/comms/route.ts             — GET / POST
```

### Webhook APIs
```
src/app/api/webhooks/route.ts                 — CRUD
src/app/api/webhooks/[id]/test/route.ts       — POST (test delivery)
src/app/api/webhooks/[id]/deliveries/route.ts — GET (delivery history)
```

### System APIs
```
src/app/api/status/route.ts                   — GET (system health)
src/app/api/notifications/route.ts            — GET / PATCH
src/app/api/spawn/route.ts                    — POST (spawn agent session)
src/app/api/events/route.ts                   — GET (SSE stream, optional enhancement)
```

### Integration APIs
```
src/app/api/integrations/route.ts             — CRUD
src/app/api/github/sync/route.ts              — POST (trigger sync)
```

All API routes follow the established auth pattern:
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

---

## Phase 11: Update Remaining Kept Pages

### Agent Detail (`src/app/(app)/agents/[slug]/page.tsx`)
- Remove `CalibrationTracker` import and rendering
- Add "Edit SOUL" link button → `/agents/${slug}/soul`
- Add "Assigned Tasks" section: query `tasks` where `assigned_to = agent.id`
- Add "Recent Comms" section: query `agent_comms` where `from_agent_id` or `to_agent_id` = agent.id
- Show `last_seen` timestamp
- Show `capabilities` as tag pills

### Settings (`src/app/(app)/settings/page.tsx`)
- Remove "Pipeline" tab (referenced `pipeline_config` table, now deleted)
- Add "Scheduler" tab (shows scheduled task config from `system_config`)
- Update "System" tab to show "Mission Control" branding

### Alerts (`src/app/(app)/alerts/page.tsx`)
- No structural changes needed — already generic
- The entity_type values will now be `task`, `agent`, `webhook`, `scheduler` instead of `lead`, `proposal`, etc.
- Ensure the display handles new entity types gracefully

### Pages requiring NO changes:
- `/costs` — queries `agent_token_usage` + `agents` (kept)
- `/audit-log` — queries `audit_log` (kept)
- `/logs` — queries journalctl (system-level)
- `/sessions` — queries `agents` + `heartbeats` (kept)
- `/memory` — reads filesystem (no DB dependency)
- `/office` — pixel art (no DB dependency)
- `/chat` + `/chat/[conversationId]` — queries `chat_conversations` + `chat_messages` (kept)
- `/gateway` — reads filesystem config (no commercial DB dependency)

---

## Phase 12: Update Seed Data

**File:** `supabase/seed.sql`

Replace the 8 Delphi-specific agents with generic orchestration agents:

```sql
DELETE FROM public.agents;

INSERT INTO public.agents (slug, name, type, status, model, workspace_path, notes) VALUES
  ('orchestrator', 'Orchestrator', 'director', 'active', 'claude-sonnet-4-6', '/home/user/agents/orchestrator', 'Primary orchestration agent. Manages task distribution and standups.'),
  ('coder', 'Coder', 'worker', 'active', 'claude-sonnet-4-6', '/home/user/agents/coder', 'Code generation and modification agent.'),
  ('reviewer', 'Reviewer', 'worker', 'active', 'claude-sonnet-4-6', '/home/user/agents/reviewer', 'Code review and quality assurance agent.'),
  ('researcher', 'Researcher', 'specialist', 'active', 'claude-sonnet-4-6', '/home/user/agents/researcher', 'Research and analysis agent.'),
  ('devops', 'DevOps', 'specialist', 'active', 'claude-haiku-4-5-20251001', '/home/user/agents/devops', 'Infrastructure and deployment agent.'),
  ('monitor', 'Monitor', 'observer', 'active', 'claude-haiku-4-5-20251001', '/home/user/agents/monitor', 'System monitoring and alerting agent.');
```

---

## Phase 13: Update `src/lib/memory-paths.ts`

Replace Delphi-specific paths with generic agent paths:

```typescript
export const MEMORY_PATHS: Record<string, string> = {
  orchestrator: "/home/user/agents/orchestrator/memory",
  coder: "/home/user/agents/coder/memory",
  reviewer: "/home/user/agents/reviewer/memory",
  researcher: "/home/user/agents/researcher/memory",
  devops: "/home/user/agents/devops/memory",
  monitor: "/home/user/agents/monitor/memory",
};
```

---

## Phase 14: Update `src/lib/model-costs.ts`

No changes needed — already generic (Claude model pricing).

---

## Phase 15: Update Root Layout & Metadata

**File:** `src/app/layout.tsx`

Change metadata:
```typescript
export const metadata: Metadata = {
  title: "Mission Control",
  description: "AI Agent Orchestration Dashboard",
};
```

---

## Phase 16: Update CLAUDE.md

Replace all references:
- "Command Center" → "Mission Control"
- "Delphi" → remove or generalize
- Update architecture section with new routes
- Update database schema section (17 new tables, remove 16 commercial)
- Update agent fleet table with generic agents
- Remove financial data rules
- Remove HERMES-specific report instructions
- Update nav item count (20 items)

---

## Implementation Order & Dependencies

Execute phases in this order. Phases 1-5 are **atomic** (build will break between them):

```
Phase 0  → Database migration (MUST be first)
Phase 1  → Delete commercial code
Phase 2  → Rewrite types.ts (fixes import errors from Phase 1)
Phase 3  → Rewrite schemas.ts
Phase 4  → Rewrite sidebar (fixes nav to deleted routes)
Phase 5  → Rewrite dashboard (fixes last commercial imports)
─── BUILD CHECKPOINT: `npm run build` should pass ───
Phase 6  → Build task board (kanban)
Phase 7  → Update StatusBadge
Phase 8  → Rewrite search/command palette
─── BUILD CHECKPOINT ───
Phase 9  → Build remaining new pages
Phase 10 → Build new API routes
─── BUILD CHECKPOINT ───
Phase 11 → Update kept pages (agent detail, settings, alerts)
Phase 12 → Update seed data
Phase 13 → Update memory paths
Phase 14 → Update root layout metadata
Phase 15 → Update CLAUDE.md
Phase 16 → Final build + HERMES report
─── FINAL BUILD + DEPLOY ───
```

---

## File Count Summary

| Action | Count |
|--------|-------|
| Files to DELETE | ~35 |
| Files to MODIFY | ~15 |
| Files to CREATE | ~60 |
| Migration files | 1 new |
| **Total changes** | **~110 files** |

---

## Build Verification

After each checkpoint, run:
```bash
npm run build
```

The build **must pass** before proceeding to the next phase group. If it fails:
1. Check for dangling imports referencing deleted types/components
2. Check for missing type exports in types.ts
3. Check for broken links in sidebar navigation

---

## Definition of Done

- [ ] All 16 commercial tables dropped from Supabase
- [ ] 17 new Mission Control tables created with RLS
- [ ] database.types.ts regenerated
- [ ] Zero commercial pages remain (no pipeline, clients, proposals, invoices, approvals, knowledge, reports)
- [ ] Task board kanban works with drag-drop (6 columns)
- [ ] 20 sidebar nav items all render pages
- [ ] Dashboard shows task/agent/alert/cost KPIs (no commercial metrics)
- [ ] Command palette searches tasks + agents
- [ ] All new pages render without errors
- [ ] All new API routes return valid responses
- [ ] `npm run build` passes with zero errors
- [ ] Settings page has no Pipeline tab
- [ ] Root metadata says "Mission Control"
- [ ] HERMES report committed
