# HERMES Report v6

## Version & Metadata
- **Version:** 6
- **Date:** 2026-03-05
- **Scope:** V7 Mission Control Transformation — complete replacement of Delphi commercial backoffice with generic AI agent orchestration dashboard

## What Was Implemented

### Database Migration (Phase 0)
- Applied `20260304000022_v7_mission_control.sql` — atomic migration that:
  - Dropped 16 commercial tables (leads, clients, proposals, invoices, approvals, deal_learnings, etc.)
  - Altered 4 kept tables (agents, agent_reports, agent_logs, alert_rules) with new constraints
  - Created 17 new tables: projects, tasks, task_comments, task_subscriptions, quality_reviews, webhooks, webhook_deliveries, scheduled_tasks, standup_reports, workflows, pipeline_runs, notifications, agent_souls, agent_comms, integrations, github_issues, system_config
  - Full RLS policies for all new tables
  - Seeded alert_rules, default project, and system_config
- Regenerated `src/lib/database.types.ts` from live schema

### Commercial Code Removal (Phase 1)
- Deleted all commercial page directories: pipeline, clients, proposals, invoices, approvals, knowledge, reports
- Deleted commercial components: pipeline-funnel-chart, calibration-tracker
- Deleted commercial utilities: lead-scoring.ts, old schemas.ts
- Deleted commercial API routes: search (old), hermes directory

### Core Rewrites (Phases 2-5)
- **types.ts** — Complete rewrite with 20+ Mission Control type exports
- **schemas.ts** — New Zod schemas for tasks, webhooks, workflows
- **sidebar.tsx** — 20 nav items replacing commercial navigation, "MC" branding
- **dashboard/page.tsx** — 5 new KPIs (active tasks, in review, active agents, open alerts, MTD costs), recent tasks list, tasks-by-agent breakdown
- **status-badge.tsx** — All commercial statuses removed, MC statuses added (task statuses, priorities, workflow states, webhook states)
- **command-palette.tsx** — Search now targets tasks + agents instead of leads/clients/proposals

### Task Board — Kanban (Phase 6)
- Full drag-and-drop kanban with 6 columns: inbox, backlog, todo, in_progress, review, done
- Components: task-kanban.tsx, task-kanban-column.tsx, task-card.tsx, create-task-dialog.tsx
- Task detail page with comments (task-comment-form.tsx) and quality reviews (task-review-form.tsx)
- Server actions: moveTask, createTask, updateTask, archiveTask, addComment, submitReview

### New Pages (Phase 9) — 13 new routes
- `/comms` — Inter-agent messaging feed with realtime refresh
- `/webhooks` — Webhook list + CRUD actions
- `/workflows` — Workflow templates list
- `/workflows/[id]` — Workflow detail with step visualization
- `/pipelines` — Pipeline/workflow execution history
- `/pipelines/[id]` — Run detail with step status
- `/cron` — Scheduled task management with enable/disable/trigger
- `/standup` — Standup report list
- `/standup/[id]` — Standup detail with structured content rendering
- `/notifications` — Notification center with mark-as-read
- `/integrations` — Third-party integration cards with enable/disable
- `/agents/[slug]/soul` — SOUL editor (markdown textarea + save)

### API Routes (Phase 10) — 12 new endpoints
- `GET/POST /api/tasks` — Task list + create
- `GET/PATCH/DELETE /api/tasks/[id]` — Task detail/update/archive
- `GET/POST /api/tasks/[id]/comments` — Task comments
- `GET/PUT /api/agents/[id]/soul` — Agent soul CRUD
- `POST /api/agents/[id]/heartbeat` — Agent heartbeat (updates last_seen)
- `GET/POST /api/agents/comms` — Agent communications
- `GET/POST /api/webhooks` — Webhook CRUD
- `GET /api/webhooks/[id]/deliveries` — Delivery history
- `POST /api/webhooks/[id]/test` — Test webhook delivery
- `GET /api/status` — System health endpoint
- `GET/PATCH /api/notifications` — Notification management
- `GET/POST /api/integrations` — Integration CRUD
- `GET /api/search` — Full-text search (tasks + agents)

### Updated Kept Pages (Phase 11)
- **Agent detail** — Added tasks, comms, soul link, last_seen, capabilities sections
- **Settings** — Removed Pipeline tab, added Scheduler tab with cron/stale/retry config
- **Alerts** — No changes needed (already handles generic entity_types)

### Configuration Updates (Phases 12-15)
- **seed.sql** — 6 generic agents: orchestrator, coder, reviewer, researcher, devops, monitor
- **memory-paths.ts** — Updated to generic agent paths
- **layout.tsx** — Metadata: "Mission Control" / "AI Agent Orchestration Dashboard"
- **CLAUDE.md** — Full rewrite for Mission Control context
- **.github/copilot-instructions.md** — Updated branding and references
- Added `@/components/ui/textarea` (was missing from shadcn/ui set)

## Files Changed

### New Files (~60)
- `supabase/migrations/20260304000022_v7_mission_control.sql`
- `src/lib/database.types.ts` (regenerated)
- `src/app/(app)/tasks/page.tsx`, `actions.ts`, `[id]/page.tsx`
- `src/app/(app)/tasks/_components/` (6 files: kanban, column, card, dialog, comment-form, review-form)
- `src/app/(app)/comms/page.tsx`
- `src/app/(app)/webhooks/page.tsx`, `actions.ts`, `_components/webhook-actions.tsx`
- `src/app/(app)/workflows/page.tsx`, `actions.ts`, `[id]/page.tsx`
- `src/app/(app)/pipelines/page.tsx`, `[id]/page.tsx`
- `src/app/(app)/cron/page.tsx`, `actions.ts`, `_components/cron-actions.tsx`
- `src/app/(app)/standup/page.tsx`, `[id]/page.tsx`
- `src/app/(app)/notifications/page.tsx`, `actions.ts`, `_components/notification-actions.tsx`
- `src/app/(app)/integrations/page.tsx`, `actions.ts`, `_components/integration-actions.tsx`
- `src/app/(app)/agents/[slug]/soul/page.tsx`, `actions.ts`, `_components/soul-editor.tsx`
- `src/app/api/tasks/route.ts`, `[id]/route.ts`, `[id]/comments/route.ts`
- `src/app/api/agents/[id]/soul/route.ts`, `heartbeat/route.ts`, `comms/route.ts`
- `src/app/api/webhooks/route.ts`, `[id]/test/route.ts`, `[id]/deliveries/route.ts`
- `src/app/api/status/route.ts`, `notifications/route.ts`, `integrations/route.ts`
- `src/components/ui/textarea.tsx`

### Modified Files (~15)
- `src/lib/types.ts` — complete rewrite
- `src/lib/schemas.ts` — complete rewrite
- `src/lib/memory-paths.ts` — updated agent paths
- `src/components/sidebar.tsx` — 20 nav items, MC branding
- `src/components/status-badge.tsx` — MC status colors
- `src/components/command-palette.tsx` — tasks+agents search
- `src/app/(app)/dashboard/page.tsx` — MC KPIs
- `src/app/(app)/agents/[slug]/page.tsx` — tasks, comms, soul
- `src/app/(app)/settings/page.tsx` — scheduler tab
- `src/app/(app)/settings/actions.ts` — system_config only
- `src/app/(app)/settings/_components/settings-tabs.tsx` — scheduler, retention, models
- `src/app/api/search/route.ts` — tasks+agents search
- `src/app/layout.tsx` — Mission Control metadata
- `CLAUDE.md` — full rewrite
- `.github/copilot-instructions.md` — updated branding
- `supabase/seed.sql` — 6 generic agents

### Deleted Files (~35)
- Entire directories: pipeline, clients, proposals, invoices, approvals, knowledge, reports
- Components: pipeline-funnel-chart.tsx, calibration-tracker.tsx
- Utilities: lead-scoring.ts
- API routes: hermes/ directory

## Issues Found

1. **Textarea component missing** — shadcn/ui textarea was not in the initial component set. Created manually since `npx shadcn add` was not readily available.
2. **Migration constraint ordering** — The v7 migration needed to update existing agent type values before applying new CHECK constraints, and delete alert_rules/alert_events before changing their constraints. Fixed by reordering operations in the migration file.
3. **Type generation** — `npx supabase gen types` with the linked project URL works for type generation. The connection string special characters don't affect this command.

## What to Validate Next

1. **Login and navigate** — Verify auth flow and all 20 sidebar items render
2. **Task kanban** — Create a task, drag between columns, verify status updates
3. **Task detail** — Add comments and quality reviews
4. **Agent detail** — Check tasks/comms/soul sections display
5. **Dashboard KPIs** — Verify counts match database state
6. **Command palette** — Test Cmd+K search for tasks and agents
7. **Settings** — Verify Scheduler tab saves config to system_config
8. **Webhooks** — Create a webhook, test delivery
9. **API endpoints** — Test `/api/status`, `/api/tasks`, `/api/agents/comms`
10. **Realtime** — Verify comms and notifications pages update in realtime
