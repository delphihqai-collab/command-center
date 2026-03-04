-- Command Center — Seed: 8 agents (HERMES + 7 sub-agents)
-- Run after migrations: psql or via Supabase SQL editor

insert into public.agents (slug, name, type, status, model, workspace_path, notes) values
  ('hermes', 'HERMES', 'director', 'active', 'claude-sonnet', '/home/delphi/hermes', 'Commercial Director. Manages all sub-agents. Posts daily standups at 09:00, 12:00, 18:00.'),
  ('sdr', 'SDR', 'sales', 'built_not_calibrated', 'claude-sonnet', '/home/delphi/hermes/agents/sdr', 'Lead qualification — qualifies every inbound lead against ICP and BANT framework.'),
  ('account-executive', 'Account Executive', 'sales', 'built_not_calibrated', 'claude-sonnet', '/home/delphi/hermes/agents/account-executive', 'Discovery, proposal drafting, close — runs MEDDIC on every prospect.'),
  ('account-manager', 'Account Manager', 'sales', 'built_not_calibrated', 'claude-sonnet', '/home/delphi/hermes/agents/account-manager', 'Post-signature client health, onboarding, renewal, churn prevention.'),
  ('finance', 'Finance Agent', 'finance', 'built_not_calibrated', 'claude-haiku', '/home/delphi/hermes/agents/finance', 'Proposal pricing validation, margin protection, invoice tracking.'),
  ('legal', 'Legal & Compliance', 'legal', 'built_not_calibrated', 'claude-sonnet', '/home/delphi/hermes/agents/legal', 'Contract review, GDPR compliance gate, SLA validation.'),
  ('market-intelligence', 'Market Intelligence', 'intelligence', 'built_not_calibrated', 'claude-haiku', '/home/delphi/hermes/agents/market-intelligence', 'Competitor monitoring, sector signals, ICP intelligence.'),
  ('knowledge-curator', 'Knowledge Curator', 'knowledge', 'built_not_calibrated', 'claude-sonnet', '/home/delphi/hermes/agents/knowledge-curator', 'Deal indexing, onboarding pattern indexing, cross-agent synthesis.');
