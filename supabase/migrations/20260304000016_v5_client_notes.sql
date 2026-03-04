-- V5: Client Notes
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) not null,
  content text not null,
  author text not null default 'HERMES',
  created_at timestamptz not null default now()
);

alter table public.client_notes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'client_notes' and policyname = 'Authenticated read client_notes') then
    create policy "Authenticated read client_notes" on public.client_notes for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'client_notes' and policyname = 'Service role write client_notes') then
    create policy "Service role write client_notes" on public.client_notes for all to service_role using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'client_notes' and policyname = 'Authenticated insert client_notes') then
    create policy "Authenticated insert client_notes" on public.client_notes for insert to authenticated with check (true);
  end if;
end $$;

create index if not exists idx_client_notes_client on public.client_notes(client_id, created_at desc);
