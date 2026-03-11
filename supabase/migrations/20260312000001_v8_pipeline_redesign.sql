-- V8 Pipeline Redesign Migration
-- Transforms pipeline_leads into a commercial pipeline operations center
-- Adds outreach_sequences, outreach_templates, daily_targets, review_queue tables

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1A. Add new columns to pipeline_leads
-- ═══════════════════════════════════════════════════════════════════

-- Scoring
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS icp_score integer;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS intent_score integer;

-- Outreach tracking
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS outreach_status text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS sequence_step integer DEFAULT 0;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS sequence_started_at timestamptz;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS last_touch_at timestamptz;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS next_touch_at timestamptz;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS touch_count integer DEFAULT 0;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS channel text;

-- Engagement
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS email_opens integer DEFAULT 0;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS email_clicks integer DEFAULT 0;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS reply_sentiment text;

-- Meeting
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS meeting_scheduled_at timestamptz;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS meeting_notes text;

-- Review
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS review_decision text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Company enrichment
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS company_size text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS company_industry text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS company_revenue text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS company_location text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS company_tech_stack text[];
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS company_website text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Other
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS disqualify_reason text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS trigger_event text;
ALTER TABLE pipeline_leads ADD COLUMN IF NOT EXISTS re_engage_after timestamptz;

-- ═══════════════════════════════════════════════════════════════════
-- 1B. Migrate stage data (order matters)
-- ═══════════════════════════════════════════════════════════════════

-- Drop existing constraint first
ALTER TABLE pipeline_leads DROP CONSTRAINT IF EXISTS pipeline_leads_stage_check;

-- 1. sdr_qualification → enrichment
UPDATE pipeline_leads SET stage = 'enrichment' WHERE stage = 'sdr_qualification';

-- 2. qualified → human_review
UPDATE pipeline_leads SET stage = 'human_review' WHERE stage = 'qualified';

-- 3. discovery → outreach (must run BEFORE new_lead → discovery)
UPDATE pipeline_leads SET stage = 'outreach' WHERE stage = 'discovery';

-- 4. proposal → proposal_sent
UPDATE pipeline_leads SET stage = 'proposal_sent' WHERE stage = 'proposal';

-- 5. negotiation → proposal_sent (merge into proposal_sent)
UPDATE pipeline_leads SET stage = 'proposal_sent' WHERE stage = 'negotiation';

-- 6. closed_won → won
UPDATE pipeline_leads SET stage = 'won' WHERE stage = 'closed_won';

-- 7. closed_lost → lost
UPDATE pipeline_leads SET stage = 'lost' WHERE stage = 'closed_lost';

-- 8. new_lead → discovery (safe now, old discovery already moved)
UPDATE pipeline_leads SET stage = 'discovery' WHERE stage = 'new_lead';

-- ═══════════════════════════════════════════════════════════════════
-- 1C. Add new stage constraint
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE pipeline_leads ADD CONSTRAINT pipeline_leads_stage_check
  CHECK (stage IN (
    'discovery', 'enrichment', 'human_review', 'outreach', 'engaged',
    'meeting_booked', 'meeting_completed', 'proposal_sent',
    'won', 'lost', 'disqualified'
  ));

-- ═══════════════════════════════════════════════════════════════════
-- 1D. Add columns to war_rooms
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE war_rooms ADD COLUMN IF NOT EXISTS type text DEFAULT 'operation';
ALTER TABLE war_rooms ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}';

-- ═══════════════════════════════════════════════════════════════════
-- 1E. outreach_sequences
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS outreach_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES pipeline_leads(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  template_id uuid,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  reply_sentiment text,
  message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER outreach_sequences_updated_at
  BEFORE UPDATE ON outreach_sequences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE outreach_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage outreach_sequences"
  ON outreach_sequences FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_outreach_sequences_lead_id ON outreach_sequences(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_sequences_status ON outreach_sequences(status);

-- ═══════════════════════════════════════════════════════════════════
-- 1F. outreach_templates
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outreach',
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  times_used integer DEFAULT 0,
  avg_open_rate numeric(5,2),
  avg_reply_rate numeric(5,2),
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER outreach_templates_updated_at
  BEFORE UPDATE ON outreach_templates
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage outreach_templates"
  ON outreach_templates FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_outreach_templates_category ON outreach_templates(category);
CREATE INDEX IF NOT EXISTS idx_outreach_templates_active ON outreach_templates(active);

-- ═══════════════════════════════════════════════════════════════════
-- 1G. daily_targets
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  leads_target integer DEFAULT 0,
  leads_actual integer DEFAULT 0,
  outreach_target integer DEFAULT 0,
  outreach_actual integer DEFAULT 0,
  meetings_target integer DEFAULT 0,
  meetings_actual integer DEFAULT 0,
  revenue_target numeric(12,2) DEFAULT 0,
  revenue_actual numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER daily_targets_updated_at
  BEFORE UPDATE ON daily_targets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE daily_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage daily_targets"
  ON daily_targets FOR ALL USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════
-- 1H. review_queue
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES pipeline_leads(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES agents(id),
  review_type text NOT NULL DEFAULT 'stage_gate',
  status text NOT NULL DEFAULT 'pending',
  context text,
  decision text,
  decision_notes text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER review_queue_updated_at
  BEFORE UPDATE ON review_queue
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage review_queue"
  ON review_queue FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_review_queue_lead_id ON review_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);

-- Add FK from outreach_sequences to outreach_templates
ALTER TABLE outreach_sequences
  ADD CONSTRAINT outreach_sequences_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES outreach_templates(id) ON DELETE SET NULL;

COMMIT;
