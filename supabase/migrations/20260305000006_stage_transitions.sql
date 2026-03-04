-- MIGRATION: 20260305000006_stage_transitions.sql
-- Valid stage transitions table + trigger for pipeline integrity

create table if not exists public.valid_stage_transitions (
  id uuid primary key default gen_random_uuid(),
  from_stage text not null,
  to_stage text not null,
  unique(from_stage, to_stage),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.valid_stage_transitions enable row level security;
create policy "Authenticated users can read transitions"
  on public.valid_stage_transitions for select
  to authenticated using (true);

insert into public.valid_stage_transitions (from_stage, to_stage) values
  ('prospecting', 'qualification'),
  ('qualification', 'initial_contact'),
  ('qualification', 'closed_lost'),
  ('initial_contact', 'demo'),
  ('demo', 'needs_analysis'),
  ('demo', 'closed_lost'),
  ('needs_analysis', 'proposal_sent'),
  ('proposal_sent', 'negotiation'),
  ('proposal_sent', 'closed_won'),
  ('proposal_sent', 'closed_lost'),
  ('negotiation', 'closed_won'),
  ('negotiation', 'closed_lost')
on conflict do nothing;

-- Trigger function to validate stage transitions
create or replace function public.validate_stage_transition()
returns trigger as $$
begin
  if new.stage <> old.stage then
    if not exists (
      select 1 from public.valid_stage_transitions
      where from_stage = old.stage and to_stage = new.stage
    ) then
      raise exception 'Invalid stage transition: % -> %', old.stage, new.stage;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Drop if exists to allow re-running
drop trigger if exists leads_validate_stage_transition on public.leads;
create trigger leads_validate_stage_transition
  before update on public.leads
  for each row execute function public.validate_stage_transition();
