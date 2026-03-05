-- Pipeline leads: commercial pipeline tracking for the Hermes agent fleet
-- Stages: new_lead → sdr_qualification → qualified → discovery → proposal → negotiation → closed_won / closed_lost / disqualified

create table if not exists public.pipeline_leads (
  id             uuid primary key default gen_random_uuid(),
  company_name   text not null,
  contact_name   text not null,
  contact_email  text,
  contact_role   text,
  source         text not null default 'inbound',
  stage          text not null default 'new_lead'
    check (stage in (
      'new_lead', 'sdr_qualification', 'qualified', 'discovery',
      'proposal', 'negotiation', 'closed_won', 'closed_lost', 'disqualified'
    )),
  assigned_agent_id uuid references public.agents(id),
  deal_value_eur numeric(12,2),
  confidence     integer check (confidence between 0 and 100),
  sdr_brief      text,
  discovery_notes text,
  proposal_url   text,
  lost_reason    text,
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  closed_at      timestamptz
);

-- Indexes
create index if not exists idx_pipeline_leads_stage on public.pipeline_leads(stage);
create index if not exists idx_pipeline_leads_assigned_agent on public.pipeline_leads(assigned_agent_id);
create index if not exists idx_pipeline_leads_created_at on public.pipeline_leads(created_at desc);

-- updated_at trigger
create trigger pipeline_leads_updated_at
  before update on public.pipeline_leads
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.pipeline_leads enable row level security;

create policy "Authenticated users can read pipeline leads"
  on public.pipeline_leads for select
  to authenticated
  using (true);

create policy "Authenticated users can insert pipeline leads"
  on public.pipeline_leads for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update pipeline leads"
  on public.pipeline_leads for update
  to authenticated
  using (true);

-- Service role bypasses RLS, so agent API calls with service role key work automatically
