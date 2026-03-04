-- V5: Weekly Commercial Reports
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  pipeline_value_total numeric(12,2),
  new_leads_count integer,
  proposals_sent_count integer,
  deals_closed_count integer,
  revenue_this_week numeric(12,2),
  agent_cost_total numeric(10,6),
  cost_per_lead numeric(10,6),
  report_data jsonb,
  generated_at timestamptz not null default now()
);

alter table public.weekly_reports enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'weekly_reports' and policyname = 'Authenticated read weekly_reports') then
    create policy "Authenticated read weekly_reports" on public.weekly_reports for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'weekly_reports' and policyname = 'Service role write weekly_reports') then
    create policy "Service role write weekly_reports" on public.weekly_reports for all to service_role using (true);
  end if;
end $$;

create unique index if not exists idx_weekly_reports_week on public.weekly_reports(week_start);
