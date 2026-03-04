-- V4: Add approval stages workflow columns
alter table public.approvals
  add column if not exists stage text not null default 'submitted',
  add column if not exists stage_history jsonb not null default '[]',
  add column if not exists stage_advanced_at timestamptz,
  add column if not exists stage_advanced_by text;

create table if not exists public.valid_approval_transitions (
  id uuid primary key default gen_random_uuid(),
  from_stage text not null,
  to_stage text not null,
  constraint valid_approval_transitions_unique unique (from_stage, to_stage),
  created_at timestamptz not null default now()
);

insert into public.valid_approval_transitions (from_stage, to_stage) values
  ('draft', 'submitted'),
  ('submitted', 'opened'),
  ('submitted', 'closed'),
  ('opened', 'reviewed'),
  ('reviewed', 'negotiation'),
  ('reviewed', 'closed'),
  ('negotiation', 'closed')
on conflict do nothing;

create index if not exists idx_approvals_stage
  on public.approvals(stage);

alter table public.valid_approval_transitions enable row level security;
create policy "authenticated users can read valid_approval_transitions"
  on public.valid_approval_transitions for select to authenticated using (true);
