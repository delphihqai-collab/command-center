-- V5: Approvals V2 — add decision tracking columns
alter table public.approvals
  add column if not exists decided_by text,
  add column if not exists decision_reason text,
  add column if not exists decided_at timestamptz;

create index if not exists idx_approvals_pending on public.approvals(status, created_at desc)
  where status = 'submitted';
