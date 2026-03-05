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

-- agents: drop old constraint first, update types, then add new constraint
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_type_check;
UPDATE public.agents SET type = 'orchestrator' WHERE type NOT IN ('director', 'orchestrator', 'worker', 'specialist', 'observer');
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

-- alert_rules: clear old data, then update entity_type constraint
DELETE FROM public.alert_events;
DELETE FROM public.alert_rules;

ALTER TABLE public.alert_rules DROP CONSTRAINT IF EXISTS alert_rules_entity_type_check;
ALTER TABLE public.alert_rules ADD CONSTRAINT alert_rules_entity_type_check
  CHECK (entity_type IN ('task', 'agent', 'webhook', 'scheduler', 'workflow', 'system'));

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
