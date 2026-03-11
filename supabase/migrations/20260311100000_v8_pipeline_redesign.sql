-- V8 Pipeline Redesign Migration
-- Updates pipeline stages, adds enrichment columns, creates review queue + daily targets

-- 1. Add type and config columns to war_rooms
ALTER TABLE war_rooms ADD COLUMN IF NOT EXISTS type text DEFAULT 'operation';
ALTER TABLE war_rooms ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}';

-- 2. Add enrichment columns to pipeline_leads
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS icp_score integer;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS annual_revenue_eur numeric;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS trigger_event text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS enrichment_data jsonb DEFAULT '{}';
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS outreach_step integer DEFAULT 0;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS outreach_total_steps integer DEFAULT 8;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS meeting_date timestamptz;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS meeting_brief_url text;

-- 3. Migrate pipeline stages: old -> new
UPDATE pipeline_leads SET stage = 'discovery' WHERE stage = 'new_lead';
UPDATE pipeline_leads SET stage = 'outreach' WHERE stage = 'sdr_qualification';
UPDATE pipeline_leads SET stage = 'outreach' WHERE stage = 'qualified';
-- 'discovery' stays as 'discovery'
UPDATE pipeline_leads SET stage = 'proposal_sent' WHERE stage = 'proposal';
UPDATE pipeline_leads SET stage = 'engaged' WHERE stage = 'negotiation';
UPDATE pipeline_leads SET stage = 'won' WHERE stage = 'closed_won';
UPDATE pipeline_leads SET stage = 'lost' WHERE stage = 'closed_lost';
-- 'disqualified' stays as 'disqualified'

-- 4. Create review_queue table
CREATE TABLE IF NOT EXISTS review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('lead_review', 'reply_review')),
  lead_id uuid REFERENCES pipeline_leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id),
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  decision_notes text,
  created_at timestamptz DEFAULT now(),
  decided_at timestamptz
);

-- 5. Create daily_targets table
CREATE TABLE IF NOT EXISTS daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_date date NOT NULL DEFAULT CURRENT_DATE,
  leads_target integer DEFAULT 50,
  leads_actual integer DEFAULT 0,
  emails_target integer DEFAULT 100,
  emails_actual integer DEFAULT 0,
  linkedin_target integer DEFAULT 20,
  linkedin_actual integer DEFAULT 0,
  replies_actual integer DEFAULT 0,
  meetings_actual integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(target_date)
);

-- 6. RLS
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage review_queue" ON review_queue;
CREATE POLICY "Authenticated users can manage review_queue"
  ON review_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage daily_targets" ON daily_targets;
CREATE POLICY "Authenticated users can manage daily_targets"
  ON daily_targets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Trigger for daily_targets updated_at
CREATE TRIGGER set_daily_targets_updated_at
  BEFORE UPDATE ON daily_targets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 8. Seed the core pipeline war room (singleton)
INSERT INTO war_rooms (name, status, priority, objective, type, config)
VALUES (
  'Pipeline Command',
  'active',
  'standard',
  'Daily lead generation and qualification pipeline',
  'core_pipeline',
  '{"daily_leads_target": 50, "daily_emails_target": 100, "daily_linkedin_target": 20}'::jsonb
);

-- 9. Insert today's targets
INSERT INTO daily_targets (target_date, leads_target, emails_target, linkedin_target)
VALUES (CURRENT_DATE, 50, 100, 20)
ON CONFLICT (target_date) DO NOTHING;
