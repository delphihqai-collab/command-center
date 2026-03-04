-- V5: Alerts & Notifications
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  entity_type text not null check (entity_type in ('lead', 'proposal', 'client', 'invoice', 'agent')),
  condition_field text not null,
  condition_operator text not null check (condition_operator in ('gt', 'lt', 'eq', 'days_since', 'is_null')),
  condition_value text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'info')) default 'medium',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.alert_rules(id),
  entity_type text not null,
  entity_id uuid not null,
  message text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'info')),
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.alert_rules enable row level security;
alter table public.alert_events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'alert_rules' and policyname = 'Authenticated read alert_rules') then
    create policy "Authenticated read alert_rules" on public.alert_rules for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'alert_rules' and policyname = 'Service role write alert_rules') then
    create policy "Service role write alert_rules" on public.alert_rules for all to service_role using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'alert_events' and policyname = 'Authenticated read alert_events') then
    create policy "Authenticated read alert_events" on public.alert_events for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'alert_events' and policyname = 'Service role write alert_events') then
    create policy "Service role write alert_events" on public.alert_events for all to service_role using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'alert_events' and policyname = 'Authenticated update alert_events') then
    create policy "Authenticated update alert_events" on public.alert_events for update to authenticated using (true);
  end if;
end $$;

insert into public.alert_rules (name, description, entity_type, condition_field, condition_operator, condition_value, severity) values
  ('Lead Stalled', 'Lead has had no stage movement in over 5 days', 'lead', 'updated_at', 'days_since', '5', 'high'),
  ('Proposal Unanswered', 'Proposal sent with no client response in over 48 hours', 'proposal', 'sent_at', 'days_since', '2', 'high'),
  ('Invoice Overdue', 'Invoice unpaid more than 30 days past due date', 'invoice', 'due_date', 'days_since', '30', 'critical'),
  ('Agent Offline', 'Agent has not sent a heartbeat in over 24 hours', 'agent', 'last_heartbeat_at', 'days_since', '1', 'critical'),
  ('Client Health Low', 'Client health score has dropped below 50', 'client', 'health_score', 'lt', '50', 'high');

create index if not exists idx_alert_events_resolved on public.alert_events(resolved, created_at desc);
create index if not exists idx_alert_events_severity on public.alert_events(severity) where resolved = false;
