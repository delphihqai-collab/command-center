-- Mission Control — Seed: 6 generic orchestration agents
-- Run after migrations: psql or via Supabase SQL editor

DELETE FROM public.agents;

INSERT INTO public.agents (slug, name, type, status, model, workspace_path, notes) VALUES
  ('orchestrator', 'Orchestrator', 'director', 'active', 'claude-sonnet-4-6', '/home/user/agents/orchestrator', 'Primary orchestration agent. Manages task distribution and standups.'),
  ('coder', 'Coder', 'worker', 'active', 'claude-sonnet-4-6', '/home/user/agents/coder', 'Code generation and modification agent.'),
  ('reviewer', 'Reviewer', 'worker', 'active', 'claude-sonnet-4-6', '/home/user/agents/reviewer', 'Code review and quality assurance agent.'),
  ('researcher', 'Researcher', 'specialist', 'active', 'claude-sonnet-4-6', '/home/user/agents/researcher', 'Research and analysis agent.'),
  ('devops', 'DevOps', 'specialist', 'active', 'claude-haiku-4-5-20251001', '/home/user/agents/devops', 'Infrastructure and deployment agent.'),
  ('monitor', 'Monitor', 'observer', 'active', 'claude-haiku-4-5-20251001', '/home/user/agents/monitor', 'System monitoring and alerting agent.');
