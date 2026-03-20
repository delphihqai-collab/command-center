-- Product-Led Pipeline: Atlas build tracking + engagement scoring
-- Adds columns to pipeline_leads for Atlas delivery tracking and lead temperature

-- Atlas delivery tracking
alter table public.pipeline_leads
  add column if not exists atlas_brief_sent_at timestamptz,
  add column if not exists atlas_website_url text,
  add column if not exists atlas_chatbot_url text,
  add column if not exists atlas_delivered_at timestamptz,
  add column if not exists product_type text default 'both',
  add column if not exists lead_temperature text default 'cold',
  add column if not exists engagement_score integer default 0;

-- Validate product_type
alter table public.pipeline_leads
  drop constraint if exists pipeline_leads_product_type_check;
alter table public.pipeline_leads
  add constraint pipeline_leads_product_type_check
  check (product_type in ('website', 'chatbot', 'both'));

-- Validate lead_temperature
alter table public.pipeline_leads
  drop constraint if exists pipeline_leads_lead_temperature_check;
alter table public.pipeline_leads
  add constraint pipeline_leads_lead_temperature_check
  check (lead_temperature in ('cold', 'warm', 'hot', 'on_fire'));

-- Index for filtering by temperature
create index if not exists idx_pipeline_leads_lead_temperature
  on public.pipeline_leads (lead_temperature);

-- Index for filtering by product type
create index if not exists idx_pipeline_leads_product_type
  on public.pipeline_leads (product_type);
