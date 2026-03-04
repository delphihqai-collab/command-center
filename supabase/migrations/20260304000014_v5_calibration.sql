-- V5: Agent Calibration Tracker
create table if not exists public.calibration_gates (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) not null,
  gate_name text not null,
  gate_description text,
  required_count integer not null default 1,
  completed_count integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.calibration_gates enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'calibration_gates' and policyname = 'Authenticated read calibration_gates') then
    create policy "Authenticated read calibration_gates" on public.calibration_gates for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'calibration_gates' and policyname = 'Service role write calibration_gates') then
    create policy "Service role write calibration_gates" on public.calibration_gates for all to service_role using (true);
  end if;
end $$;

-- Seed calibration gates per agent
insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First 5 handoff briefs reviewed by HERMES', 'SDR produces 5 handoff briefs meeting qualification standards reviewed by HERMES', 5 from public.agents where slug = 'sdr';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, '3 discovery logs reviewed', 'AE produces 3 discovery call logs reviewed and approved by HERMES', 3 from public.agents where slug = 'ae';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, '3 proposal drafts reviewed', 'AE produces 3 proposal drafts reviewed and approved by HERMES', 3 from public.agents where slug = 'ae';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First 30-day onboarding reviewed', 'AM runs one complete 30-day onboarding cycle reviewed by HERMES', 1 from public.agents where slug = 'am';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Finance task completed and reviewed by HERMES', 1 from public.agents where slug = 'finance';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Legal task completed and reviewed by HERMES', 1 from public.agents where slug = 'legal';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Market Intelligence task completed and reviewed by HERMES', 1 from public.agents where slug = 'market-intelligence';

insert into public.calibration_gates (agent_id, gate_name, gate_description, required_count)
select id, 'First real task completed and reviewed', 'First Knowledge Curator task completed and reviewed by HERMES', 1 from public.agents where slug = 'knowledge-curator';

create index if not exists idx_calibration_gates_agent on public.calibration_gates(agent_id);
