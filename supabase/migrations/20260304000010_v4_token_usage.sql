-- V4: Agent token usage tracking
create table if not exists public.agent_token_usage (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,6) not null default 0,
  session_key text,
  task_description text,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_token_usage_agent_id on public.agent_token_usage(agent_id);
create index if not exists idx_token_usage_recorded_at on public.agent_token_usage(recorded_at desc);
create index if not exists idx_token_usage_agent_recorded
  on public.agent_token_usage(agent_id, recorded_at desc);

alter table public.agent_token_usage enable row level security;

create policy "authenticated users can read token usage"
  on public.agent_token_usage for select to authenticated using (true);
create policy "authenticated users can insert token usage"
  on public.agent_token_usage for insert to authenticated with check (true);
