-- Team Analysis: topology rules, war rooms, and agent pools
-- Migration: 20260311000001_team_analysis.sql

-- ── Direct communication topology ─────────────────────────────────────
-- Defines which agents can communicate directly (peer-to-peer) without routing through Hermes.
CREATE TABLE IF NOT EXISTS team_topology (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel_type text NOT NULL DEFAULT 'operational' CHECK (channel_type IN ('operational', 'strategic', 'escalation')),
  enabled boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_agent_id, to_agent_id, channel_type)
);

CREATE INDEX idx_topology_from ON team_topology (from_agent_id) WHERE enabled = true;
CREATE INDEX idx_topology_to ON team_topology (to_agent_id) WHERE enabled = true;

ALTER TABLE team_topology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage topology" ON team_topology
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER set_team_topology_updated_at
  BEFORE UPDATE ON team_topology
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── War rooms — multi-agent deal collaboration ────────────────────────
CREATE TABLE IF NOT EXISTS war_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lead_id uuid REFERENCES pipeline_leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  priority text NOT NULL DEFAULT 'high' CHECK (priority IN ('critical', 'high', 'standard')),
  objective text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_war_rooms_status ON war_rooms (status);
CREATE INDEX idx_war_rooms_lead ON war_rooms (lead_id) WHERE lead_id IS NOT NULL;

ALTER TABLE war_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage war rooms" ON war_rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_war_rooms_updated_at
  BEFORE UPDATE ON war_rooms
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── War room participants ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS war_room_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_room_id uuid NOT NULL REFERENCES war_rooms(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('lead', 'participant', 'observer')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (war_room_id, agent_id)
);

CREATE INDEX idx_war_room_agents_room ON war_room_agents (war_room_id);
CREATE INDEX idx_war_room_agents_agent ON war_room_agents (agent_id);

ALTER TABLE war_room_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage war room agents" ON war_room_agents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── War room activity ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS war_room_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_room_id uuid NOT NULL REFERENCES war_rooms(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_war_room_activity_room ON war_room_activity (war_room_id, created_at DESC);

ALTER TABLE war_room_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage war room activity" ON war_room_activity
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Agent pools — elastic scaling config ──────────────────────────────
CREATE TABLE IF NOT EXISTS agent_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  base_agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  min_instances int NOT NULL DEFAULT 1,
  max_instances int NOT NULL DEFAULT 5,
  current_instances int NOT NULL DEFAULT 1,
  scaling_strategy text NOT NULL DEFAULT 'manual' CHECK (scaling_strategy IN ('manual', 'load_based', 'pipeline_volume')),
  scaling_config jsonb DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage agent pools" ON agent_pools
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_agent_pools_updated_at
  BEFORE UPDATE ON agent_pools
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Fleet optimization experiments ────────────────────────────────────
CREATE TABLE IF NOT EXISTS fleet_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hypothesis text NOT NULL,
  category text NOT NULL CHECK (category IN ('outreach', 'qualification', 'negotiation', 'retention', 'process', 'topology')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  config jsonb DEFAULT '{}',
  results jsonb DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fleet_experiments_status ON fleet_experiments (status);

ALTER TABLE fleet_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage fleet experiments" ON fleet_experiments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_fleet_experiments_updated_at
  BEFORE UPDATE ON fleet_experiments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Seed default topology: direct specialist access ───────────────────
-- Allow workers to directly access specialists for operational queries
DO $$
DECLARE
  v_ae uuid;
  v_sdr uuid;
  v_am uuid;
  v_finance uuid;
  v_legal uuid;
  v_mi uuid;
  v_kc uuid;
  v_hermes uuid;
BEGIN
  SELECT id INTO v_hermes FROM agents WHERE slug = 'hermes';
  SELECT id INTO v_sdr FROM agents WHERE slug = 'sdr';
  SELECT id INTO v_ae FROM agents WHERE slug = 'account-executive';
  SELECT id INTO v_am FROM agents WHERE slug = 'account-manager';
  SELECT id INTO v_finance FROM agents WHERE slug = 'finance';
  SELECT id INTO v_legal FROM agents WHERE slug = 'legal';
  SELECT id INTO v_mi FROM agents WHERE slug = 'market-intelligence';
  SELECT id INTO v_kc FROM agents WHERE slug = 'knowledge-curator';

  -- SDR → Market Intelligence (prospect research)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_sdr, v_mi, 'operational', 'SDR queries MI for prospect/market research')
  ON CONFLICT DO NOTHING;

  -- SDR → Knowledge Curator (playbook access)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_sdr, v_kc, 'operational', 'SDR accesses outreach playbooks from KC')
  ON CONFLICT DO NOTHING;

  -- AE → Legal (contract review)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_ae, v_legal, 'operational', 'AE requests contract review from Legal')
  ON CONFLICT DO NOTHING;

  -- AE → Finance (deal pricing)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_ae, v_finance, 'operational', 'AE queries Finance for deal pricing/terms')
  ON CONFLICT DO NOTHING;

  -- AE → Market Intelligence (competitive positioning)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_ae, v_mi, 'operational', 'AE queries MI for competitive positioning')
  ON CONFLICT DO NOTHING;

  -- AM → Finance (billing/renewal)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_am, v_finance, 'operational', 'AM queries Finance on billing/renewals')
  ON CONFLICT DO NOTHING;

  -- AM → Legal (contract amendments)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_am, v_legal, 'operational', 'AM requests Legal review on amendments')
  ON CONFLICT DO NOTHING;

  -- AM → Knowledge Curator (retention playbooks)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_am, v_kc, 'operational', 'AM accesses retention playbooks from KC')
  ON CONFLICT DO NOTHING;

  -- Knowledge Curator → all workers (feedback loop)
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_kc, v_sdr, 'operational', 'KC pushes updated playbooks to SDR')
  ON CONFLICT DO NOTHING;
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_kc, v_ae, 'operational', 'KC pushes updated playbooks to AE')
  ON CONFLICT DO NOTHING;
  INSERT INTO team_topology (from_agent_id, to_agent_id, channel_type, description)
  VALUES (v_kc, v_am, 'operational', 'KC pushes updated playbooks to AM')
  ON CONFLICT DO NOTHING;

  -- Seed agent pools
  INSERT INTO agent_pools (capability, display_name, description, base_agent_id, min_instances, max_instances, scaling_strategy)
  VALUES
    ('sdr', 'SDR Pool', 'Elastic SDR instances for high-volume prospecting', v_sdr, 1, 10, 'pipeline_volume'),
    ('account-executive', 'AE Pool', 'AE instances scale with qualified lead volume', v_ae, 1, 5, 'pipeline_volume'),
    ('market-intelligence', 'MI Pool', 'MI instances for parallel research tasks', v_mi, 1, 3, 'load_based')
  ON CONFLICT DO NOTHING;
END;
$$;
