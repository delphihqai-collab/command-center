-- Command Center — Phase 2: Commercial Tables
-- Tables: proposals, clients, client_health_history, invoices, approvals, heartbeats

-- =============================================================================
-- DOMAIN 2 (continued): PROPOSALS
-- =============================================================================

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  version int not null default 1,
  status text not null check (status in (
    'drafting', 'gate_atlas', 'gate_legal', 'gate_finance',
    'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired'
  )),
  value numeric(12,2),
  monthly_value numeric(12,2),
  payment_terms text default 'net_30',
  scope_summary text,
  gate_atlas_required boolean default false,
  gate_atlas_cleared boolean default false,
  gate_atlas_cleared_at timestamptz,
  gate_legal_cleared boolean default false,
  gate_legal_cleared_at timestamptz,
  gate_legal_notes text,
  gate_finance_cleared boolean default false,
  gate_finance_cleared_at timestamptz,
  gate_finance_notes text,
  boss_approved boolean default false,
  boss_approved_at timestamptz,
  sent_at timestamptz,
  follow_up_48h_sent boolean default false,
  follow_up_5d_sent boolean default false,
  follow_up_10d_sent boolean default false,
  outcome text check (outcome in ('accepted', 'rejected', 'ghosted')),
  outcome_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger proposals_updated_at
  before update on public.proposals
  for each row execute function public.handle_updated_at();

create index idx_proposals_lead_id on public.proposals(lead_id);
create index idx_proposals_status on public.proposals(status);

-- =============================================================================
-- DOMAIN 3: CLIENTS
-- =============================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  proposal_id uuid references public.proposals(id),
  company_name text not null,
  contact_name text,
  contact_email text,
  sector text,
  country text,
  contract_start date not null,
  contract_end date not null,
  monthly_value numeric(12,2) not null,
  health_status text not null default 'healthy' check (health_status in ('healthy', 'at_risk', 'critical')),
  onboarding_complete boolean default false,
  onboarding_completed_at timestamptz,
  renewal_flagged_90d boolean default false,
  renewal_flagged_30d boolean default false,
  assigned_am_id uuid references public.agents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

create index idx_clients_health on public.clients(health_status);
create index idx_clients_am on public.clients(assigned_am_id);

-- Client health history
create table public.client_health_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  health_status text not null check (health_status in ('healthy', 'at_risk', 'critical')),
  product_activity_signal text check (product_activity_signal in ('green', 'yellow', 'red')),
  invoice_status_signal text check (invoice_status_signal in ('green', 'yellow', 'red')),
  communication_signal text check (communication_signal in ('green', 'yellow', 'red')),
  sentiment_signal text check (sentiment_signal in ('green', 'yellow', 'red')),
  note text,
  recorded_by_agent_id uuid references public.agents(id),
  created_at timestamptz not null default now()
);

create index idx_client_health_client_id on public.client_health_history(client_id);

-- =============================================================================
-- DOMAIN 4: FINANCE
-- =============================================================================

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  invoice_reference text,
  amount numeric(12,2) not null,
  due_date date not null,
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'overdue', 'paid', 'disputed')),
  overdue_days int,
  flagged boolean default false,
  flag_level text check (flag_level in ('MEDIUM', 'HIGH', 'CRITICAL')),
  flag_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.handle_updated_at();

create index idx_invoices_client_id on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_flagged on public.invoices(flagged) where flagged = true;

-- =============================================================================
-- DOMAIN 5: APPROVALS
-- =============================================================================

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  urgency text not null check (urgency in ('CRITICAL', 'IMPORTANT', 'INFORMATIONAL')),
  action_summary text not null,
  recipient text,
  context text,
  draft_content text,
  risks_if_approved text,
  risks_if_rejected text,
  alternatives text,
  risk_if_delayed text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  approved_by_user_id uuid,
  decision_at timestamptz,
  discord_message_id text,
  created_by_agent_id uuid references public.agents(id),
  related_entity_type text check (related_entity_type in ('lead', 'client', 'proposal')),
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger approvals_updated_at
  before update on public.approvals
  for each row execute function public.handle_updated_at();

create index idx_approvals_status on public.approvals(status);
create index idx_approvals_pending on public.approvals(status) where status = 'pending';

-- =============================================================================
-- DOMAIN 6: KNOWLEDGE BASE
-- =============================================================================

create table public.deal_learnings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  outcome text not null check (outcome in ('won', 'lost')),
  icp_match_quality text check (icp_match_quality in ('strong', 'moderate', 'weak')),
  icp_match_notes text,
  stage_lost_at text,
  deal_velocity_days int,
  velocity_by_stage jsonb,
  objections jsonb,
  champion_role text,
  champion_effectiveness text check (champion_effectiveness in ('strong', 'moderate', 'absent')),
  competitor_involved boolean default false,
  competitor_name text,
  competitor_win_reason text,
  loss_reason_primary text,
  loss_reason_secondary text,
  loss_type text check (loss_type in ('good_fit_loss', 'winnable_loss')),
  margin_achieved numeric(5,2),
  key_learning text not null,
  created_at timestamptz not null default now()
);

create index idx_deal_learnings_lead_id on public.deal_learnings(lead_id);
create index idx_deal_learnings_outcome on public.deal_learnings(outcome);

create table public.onboarding_patterns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  health_at_day30 text not null check (health_at_day30 in ('healthy', 'at_risk', 'critical')),
  time_to_value_days int,
  friction_points jsonb,
  escalations int default 0,
  day7_signals text,
  key_learning text not null,
  created_at timestamptz not null default now()
);

create index idx_onboarding_patterns_client_id on public.onboarding_patterns(client_id);

-- =============================================================================
-- DOMAIN 7: SYSTEM
-- =============================================================================

create table public.heartbeats (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  scheduled_at timestamptz not null,
  fired_at timestamptz not null,
  status text not null check (status in ('ok', 'late', 'failed')),
  summary text,
  created_at timestamptz not null default now()
);

create index idx_heartbeats_job_name on public.heartbeats(job_name);
