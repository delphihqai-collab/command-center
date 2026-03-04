-- MIGRATION: 20260305000004_scalability_indexes.sql
-- Performance indexes for common query patterns

-- Agent queries
create index if not exists idx_agents_status on public.agents(status) where status in ('active', 'idle');
create index if not exists idx_agents_type on public.agents(type);

-- Lead queries (critical for filtering)
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_last_activity on public.leads(last_activity_at desc) where last_activity_at is not null;
create index if not exists idx_leads_stall on public.leads(stage, last_activity_at) where stall_flagged = false;

-- Proposal queries
create index if not exists idx_proposals_created_at on public.proposals(created_at desc);
create index if not exists idx_proposals_status_multi on public.proposals(status, updated_at);

-- Client queries (health monitoring)
create index if not exists idx_clients_created_at on public.clients(created_at desc);
create index if not exists idx_clients_renewal on public.clients(renewal_flagged_30d, renewal_flagged_90d);

-- Invoice queries (overdue detection)
create index if not exists idx_invoices_due_date on public.invoices(due_date) where status != 'paid';
create index if not exists idx_invoices_flagged_level on public.invoices(flag_level) where flagged = true;

-- Approval queries (admin dashboard)
create index if not exists idx_approvals_created_at on public.approvals(created_at desc);
create index if not exists idx_approvals_pending_urgency on public.approvals(status, urgency) where status = 'pending';

-- Agent reports (flag dashboard)
create index if not exists idx_agent_reports_created_at on public.agent_reports(created_at desc);
create index if not exists idx_agent_reports_flagged_level on public.agent_reports(flagged, flag_level) where flagged = true;

-- Lead stage history (pipeline analytics)
create index if not exists idx_lead_stage_history_created_at on public.lead_stage_history(created_at desc);
