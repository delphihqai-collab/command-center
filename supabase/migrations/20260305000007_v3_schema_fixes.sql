-- V3 P0: Schema fixes
-- 1. Add approval_notes for decision audit trail
-- 2. Add reason to lead_stage_history for stage change context
-- 3. Fix indexes with WHERE clauses for performance

-- Add missing columns
alter table public.approvals add column if not exists approval_notes text;
alter table public.lead_stage_history add column if not exists reason text;

-- Fix idx_leads_last_activity with WHERE clause
drop index if exists idx_leads_last_activity;
create index idx_leads_last_activity on public.leads(last_activity_at desc) where archived_at is null;

-- Add targeted indexes for common queries
create index if not exists idx_approvals_pending_urgency on public.approvals(status, urgency) where status = 'pending';
create index if not exists idx_invoices_due_date on public.invoices(due_date) where status != 'paid';
