-- Drop unused tables that have no application code referencing them.
-- Cron is managed entirely by OpenClaw CLI (openclaw cron list --json).
-- Chat, workflows, standups, notifications, github_issues are reserved
-- but unimplemented — they can be recreated when needed.

-- Drop children first (FK dependencies)
DROP TABLE IF EXISTS public.pipeline_runs;
DROP TABLE IF EXISTS public.chat_messages;

-- Drop remaining unused tables
DROP TABLE IF EXISTS public.scheduled_tasks;
DROP TABLE IF EXISTS public.task_subscriptions;
DROP TABLE IF EXISTS public.workflows;
DROP TABLE IF EXISTS public.standup_reports;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.chat_conversations;
DROP TABLE IF EXISTS public.github_issues;
