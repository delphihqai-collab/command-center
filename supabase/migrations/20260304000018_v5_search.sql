-- V5: Full-text search vectors, indexes, triggers
-- Uses actual column names from schema: company_name, contact_name, sector, scope_summary

alter table public.leads add column if not exists search_vector tsvector;
alter table public.clients add column if not exists search_vector tsvector;
alter table public.proposals add column if not exists search_vector tsvector;

-- Populate existing rows
update public.leads set search_vector =
  to_tsvector('english', coalesce(company_name,'') || ' ' || coalesce(contact_name,'') || ' ' || coalesce(sector,''));
update public.clients set search_vector =
  to_tsvector('english', coalesce(company_name,'') || ' ' || coalesce(sector,''));
update public.proposals set search_vector =
  to_tsvector('english', coalesce(scope_summary,'') || ' ' || coalesce(status,''));

-- GIN indexes
create index if not exists idx_leads_fts on public.leads using gin(search_vector);
create index if not exists idx_clients_fts on public.clients using gin(search_vector);
create index if not exists idx_proposals_fts on public.proposals using gin(search_vector);

-- Auto-update triggers
create or replace function update_leads_search_vector() returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.company_name,'') || ' ' || coalesce(new.contact_name,'') || ' ' || coalesce(new.sector,''));
  return new;
end; $$;

drop trigger if exists leads_search_trigger on public.leads;
create trigger leads_search_trigger before insert or update on public.leads
  for each row execute function update_leads_search_vector();

create or replace function update_clients_search_vector() returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.company_name,'') || ' ' || coalesce(new.sector,''));
  return new;
end; $$;

drop trigger if exists clients_search_trigger on public.clients;
create trigger clients_search_trigger before insert or update on public.clients
  for each row execute function update_clients_search_vector();

create or replace function update_proposals_search_vector() returns trigger language plpgsql as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.scope_summary,'') || ' ' || coalesce(new.status,''));
  return new;
end; $$;

drop trigger if exists proposals_search_trigger on public.proposals;
create trigger proposals_search_trigger before insert or update on public.proposals
  for each row execute function update_proposals_search_vector();
