-- V5: Settings — notification preferences + pipeline config
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null unique,
  alert_channel text not null check (alert_channel in ('discord', 'in_app', 'both')) default 'both',
  approval_channel text not null check (approval_channel in ('discord', 'in_app', 'both')) default 'both',
  report_channel text not null check (report_channel in ('discord', 'in_app', 'both')) default 'in_app',
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS
do $$ begin
  alter table public.notification_preferences enable row level security;
  alter table public.pipeline_config enable row level security;
exception when others then null;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'notification_preferences' and policyname = 'Authenticated manage notification_preferences') then
    create policy "Authenticated manage notification_preferences" on public.notification_preferences for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'pipeline_config' and policyname = 'Authenticated read pipeline_config') then
    create policy "Authenticated read pipeline_config" on public.pipeline_config for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'pipeline_config' and policyname = 'Authenticated write pipeline_config') then
    create policy "Authenticated write pipeline_config" on public.pipeline_config for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Seed pipeline config
insert into public.pipeline_config (key, value) values
  ('stall_threshold_days', '5'),
  ('stages', '["prospecting","qualification","initial_contact","demo_meeting","needs_analysis","proposal_sent","negotiation","closed_won","closed_lost"]'),
  ('sectors', '["healthcare","legal","finance","retail","manufacturing","logistics","real_estate","other"]'),
  ('agent_logs_retain_days', '90'),
  ('audit_log_retain_days', '365')
on conflict (key) do nothing;
