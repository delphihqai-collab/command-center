-- Mission Control — Seed: Hermes commercial agent fleet
-- Run after migrations: psql or via Supabase SQL editor

DELETE FROM public.agents;

INSERT INTO public.agents (slug, name, type, status, model, workspace_path, notes) VALUES
  ('hermes', 'HERMES', 'director', 'active', 'claude-sonnet-4-6', '/home/delphi/.openclaw/workspace', 'Hermes — Commercial Director. Primary orchestration agent. Manages all sub-agents.'),
  ('sdr', 'SDR', 'worker', 'active', 'claude-sonnet-4-6', '/home/delphi/.openclaw/workspace/teams/commercial/sdr', 'Sales Development Representative. Prospecting, lead qualification, outreach.'),
  ('account-executive', 'Account Executive', 'worker', 'active', 'claude-sonnet-4-6', '/home/delphi/.openclaw/workspace/teams/commercial/account-executive', 'Account Executive. Deal management, demos, proposals, closing.'),
  ('account-manager', 'Account Manager', 'worker', 'active', 'claude-sonnet-4-6', '/home/delphi/.openclaw/workspace/teams/commercial/account-manager', 'Account Manager. Client retention, renewals, upsells, health monitoring.'),
  ('finance', 'Finance Agent', 'specialist', 'active', 'claude-haiku-4-5-20251001', '/home/delphi/.openclaw/workspace/teams/commercial/finance', 'Finance Agent. Invoicing, cash flow, expense tracking, billing.'),
  ('legal', 'Legal & Compliance', 'specialist', 'active', 'claude-sonnet-4-6', '/home/delphi/.openclaw/workspace/teams/commercial/legal', 'Legal & Compliance. Contract review, regulatory compliance, risk assessment.'),
  ('market-intelligence', 'Market Intelligence', 'specialist', 'active', 'claude-haiku-4-5-20251001', '/home/delphi/.openclaw/workspace/teams/commercial/market-intelligence', 'Market Intelligence. Competitor tracking, market trends, pricing analysis.'),
  ('knowledge-curator', 'Knowledge Curator', 'specialist', 'active', 'claude-sonnet-4-6', '/home/delphi/.openclaw/workspace/teams/commercial/knowledge-curator', 'Knowledge Curator. Documentation, playbook management, knowledge indexing.');
