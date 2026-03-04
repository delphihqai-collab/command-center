-- MIGRATION: 20260305000005_soft_delete_consistency.sql
-- Add archived_at to proposals and invoices for soft-delete consistency

alter table public.proposals add column if not exists archived_at timestamptz default null;
alter table public.invoices add column if not exists archived_at timestamptz default null;

-- Indexes for active-only queries
create index if not exists idx_proposals_archived on public.proposals(archived_at) where archived_at is null;
create index if not exists idx_invoices_archived on public.invoices(archived_at) where archived_at is null;
