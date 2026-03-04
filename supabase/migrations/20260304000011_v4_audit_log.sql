-- V4: Audit log hardening (create if not exists, add missing columns, indexes)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  change_reason text,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Add user_email if missing (V3 may have omitted)
alter table public.audit_log add column if not exists user_email text;
alter table public.audit_log add column if not exists change_reason text;
alter table public.audit_log add column if not exists ip_address text;

create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_user_email on public.audit_log(user_email);
create index if not exists idx_audit_log_action on public.audit_log(action);
create index if not exists idx_audit_log_entity on public.audit_log(entity_type, entity_id);

alter table public.audit_log enable row level security;

-- Immutable: select and insert only, no update or delete
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'audit_log' and policyname = 'authenticated users can read audit_log'
  ) then
    create policy "authenticated users can read audit_log"
      on public.audit_log for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'audit_log' and policyname = 'authenticated users can insert audit_log'
  ) then
    create policy "authenticated users can insert audit_log"
      on public.audit_log for insert to authenticated with check (true);
  end if;
end $$;
