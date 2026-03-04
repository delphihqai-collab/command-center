-- Command Center — Phase 1: Database Foundation
-- Tables: agents, agent_logs, agent_reports, leads, lead_stage_history

-- =============================================================================
-- UTILITY: updated_at trigger function
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- DOMAIN 1: AGENTS
-- =============================================================================

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null check (type in ('director', 'sales', 'finance', 'legal', 'intelligence', 'knowledge')),
  status text not null check (status in ('active', 'idle', 'built_not_calibrated', 'offline')),
  model text not null,
  workspace_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agents_updated_at
  before update on public.agents
  for each row execute function public.handle_updated_at();

-- Agent reports
create table public.agent_reports (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id),
  report_type text not null check (report_type in (
    'heartbeat', 'qualification', 'discovery', 'proposal_gate', 'health_score',
    'invoice_review', 'legal_review', 'intel_scan', 'deal_index',
    'onboarding_summary', 'synthesis'
  )),
  content jsonb not null,
  flagged boolean not null default false,
  flag_level text check (flag_level in ('CRITICAL', 'HIGH', 'MEDIUM')),
  related_entity_type text check (related_entity_type in ('lead', 'client', 'proposal', 'invoice')),
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create index idx_agent_reports_agent_id on public.agent_reports(agent_id);
create index idx_agent_reports_flagged on public.agent_reports(flagged) where flagged = true;
create index idx_agent_reports_related on public.agent_reports(related_entity_type, related_entity_id);

-- Agent logs (append-only)
create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id),
  action text not null,
  detail text,
  related_entity_type text check (related_entity_type in ('lead', 'client', 'proposal', 'invoice')),
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create index idx_agent_logs_agent_id on public.agent_logs(agent_id);
create index idx_agent_logs_related on public.agent_logs(related_entity_type, related_entity_id);

-- =============================================================================
-- DOMAIN 2: PIPELINE
-- =============================================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_role text,
  source text,
  sector text check (sector in ('dental', 'health', 'other')),
  country text default 'PT',
  stage text not null check (stage in (
    'prospecting', 'qualification', 'initial_contact', 'demo',
    'needs_analysis', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'
  )),
  qualified boolean,
  disqualified_reason text,
  sdr_brief jsonb,
  meddic jsonb,
  assigned_agent_id uuid references public.agents(id),
  last_activity_at timestamptz,
  stall_flagged boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

create index idx_leads_stage on public.leads(stage);
create index idx_leads_sector on public.leads(sector);
create index idx_leads_assigned on public.leads(assigned_agent_id);
create index idx_leads_stall on public.leads(stall_flagged) where stall_flagged = true;

-- Lead stage history (immutable audit trail)
create table public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  from_stage text,
  to_stage text not null,
  changed_by_agent_id uuid references public.agents(id),
  note text,
  created_at timestamptz not null default now()
);

create index idx_lead_stage_history_lead_id on public.lead_stage_history(lead_id);
