-- Command Center — Phase 1/2: Row-Level Security
-- RLS enabled from day one. Only authenticated users can access data.

-- Enable RLS on all tables
alter table public.agents enable row level security;
alter table public.agent_reports enable row level security;
alter table public.agent_logs enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.proposals enable row level security;
alter table public.clients enable row level security;
alter table public.client_health_history enable row level security;
alter table public.invoices enable row level security;
alter table public.approvals enable row level security;
alter table public.deal_learnings enable row level security;
alter table public.onboarding_patterns enable row level security;
alter table public.heartbeats enable row level security;

-- =============================================================================
-- POLICIES: Authenticated users (backoffice) — full read access
-- =============================================================================
-- For V1, all authenticated users are authorised users and can read everything.
-- Write access is restricted: agents write via service_role key, humans only
-- write to approvals (approve/reject).

-- Read policies for all tables (authenticated users)
create policy "Authenticated users can read agents"
  on public.agents for select to authenticated using (true);

create policy "Authenticated users can read agent_reports"
  on public.agent_reports for select to authenticated using (true);

create policy "Authenticated users can read agent_logs"
  on public.agent_logs for select to authenticated using (true);

create policy "Authenticated users can read leads"
  on public.leads for select to authenticated using (true);

create policy "Authenticated users can read lead_stage_history"
  on public.lead_stage_history for select to authenticated using (true);

create policy "Authenticated users can read proposals"
  on public.proposals for select to authenticated using (true);

create policy "Authenticated users can read clients"
  on public.clients for select to authenticated using (true);

create policy "Authenticated users can read client_health_history"
  on public.client_health_history for select to authenticated using (true);

create policy "Authenticated users can read invoices"
  on public.invoices for select to authenticated using (true);

create policy "Authenticated users can read approvals"
  on public.approvals for select to authenticated using (true);

create policy "Authenticated users can read deal_learnings"
  on public.deal_learnings for select to authenticated using (true);

create policy "Authenticated users can read onboarding_patterns"
  on public.onboarding_patterns for select to authenticated using (true);

create policy "Authenticated users can read heartbeats"
  on public.heartbeats for select to authenticated using (true);

-- =============================================================================
-- POLICIES: Approvals — authenticated users can update (approve/reject)
-- =============================================================================
create policy "Authenticated users can update approvals"
  on public.approvals for update to authenticated
  using (true)
  with check (true);

-- =============================================================================
-- NOTE: Agent writes use service_role key which bypasses RLS.
-- No additional write policies needed for agents.
-- =============================================================================
