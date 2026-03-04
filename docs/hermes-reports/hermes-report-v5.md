# HERMES Report v5

## 1. Version & Metadata
- **Version:** 5
- **Date:** 2026-03-04
- **Scope:** V5 Implementation — "Make the data real"

## 2. What Was Implemented

### Core Infrastructure
- **7 DB migrations applied** — alert_rules, alert_events, calibration_gates, weekly_reports, client_notes, notification_preferences, pipeline_config tables + RLS + seed data
- **database.types.ts updated** — 7 new table types, approvals extended with decided_at/decided_by/decision_reason
- **types.ts updated** — 7 new type aliases (AlertRule, AlertEvent, CalibrationGate, WeeklyReport, ClientNote, NotificationPreference, PipelineConfig)
- **Service client** — `src/lib/supabase/service.ts` for bypassing RLS in Route Handlers

### New Routes & Pages
- **`/alerts`** — Alert events page with severity grouping (critical/high/medium/info), resolve actions, Realtime refresh
- **`/reports`** — Weekly commercial reports with KPI cards, pipeline value chart, cost-per-lead trend chart
- **`/knowledge/new`** — New deal learning form with lead selector, outcome, loss reasons, competitor tracking
- **`/knowledge/[id]/edit`** — Edit existing deal learnings
- **`/api/search`** — Full-text search API across leads/clients/proposals using tsvector
- **`/api/hermes/approval-decision`** — HERMES polling endpoint for in-app approval decisions (Bearer token auth)

### Feature Upgrades
- **In-app Approvals** — Risk cards (risks_if_approved / risks_if_rejected), alternatives section, full draft content, decision tracking (decided_by, decision_reason)
- **Pipeline V2** — Kanban view with @dnd-kit drag-and-drop, table/kanban toggle (localStorage-persisted), lead scoring (0-100 with color badges), bulk actions bar (advance stage / archive), pipeline forecast sidebar panel with 30/60/90 day weighted buckets
- **Client Health Dashboard** — Health trend LineChart, renewal countdown (color-coded by urgency), computed risk flags (declining health, overdue invoices), client notes with inline add-note form
- **Agent Calibration** — Progress tracker component for `built_not_calibrated` agents, gate checklist with completion state
- **Settings Full Build** — 5-tab layout (Account, Notifications, Pipeline, Agents, Data Retention), notification channel preferences, pipeline stall threshold config, data retention settings
- **Knowledge Write Mode** — New/edit forms, server actions (createDealLearning, updateDealLearning), "New Entry" button on knowledge page

### UX Improvements
- **Command Palette** — cmd+K global search with debounced SWR fetch, grouped results
- **Theme Toggle** — Dark/light mode via next-themes ThemeProvider
- **Mobile Layout** — 5-item bottom nav (Dashboard, Pipeline, Approvals, Alerts, Office), office floor responsive grid (1→2→4 columns)
- **Realtime Refresh** — Added to dashboard (agent_logs), pipeline (leads), office (agents), costs (agent_token_usage), alerts (alert_events)
- **Sidebar** — 19 nav items (added Alerts, Reports), overflow-y-auto for scroll

### New Libs
- `src/lib/lead-scoring.ts` — Score calculator (sector +30, company +25, contact +15, qualified +20, active +10) with color helpers

## 3. Files Changed

### New Files
| File | Description |
|------|-------------|
| `src/lib/supabase/service.ts` | Service role Supabase client |
| `src/lib/lead-scoring.ts` | Lead score calculator + color helpers |
| `src/components/theme-toggle.tsx` | Dark/light mode toggle |
| `src/components/realtime-table.tsx` | Generic Realtime table wrapper |
| `src/components/command-palette.tsx` | cmd+K global search dialog |
| `src/components/ui/checkbox.tsx` | shadcn Checkbox primitive |
| `src/app/api/search/route.ts` | FTS search API route |
| `src/app/api/hermes/approval-decision/route.ts` | HERMES polling endpoint |
| `src/app/(app)/alerts/page.tsx` | Alerts page (server) |
| `src/app/(app)/alerts/_components/alerts-client.tsx` | Alerts client component |
| `src/app/(app)/alerts/actions.ts` | resolveAlert server action |
| `src/app/(app)/reports/page.tsx` | Weekly reports page |
| `src/app/(app)/reports/_components/reports-client.tsx` | Reports charts + KPIs |
| `src/app/(app)/agents/[slug]/_components/calibration-tracker.tsx` | Calibration progress tracker |
| `src/app/(app)/pipeline/_components/pipeline-kanban.tsx` | DnD kanban view |
| `src/app/(app)/pipeline/_components/kanban-column.tsx` | Kanban column component |
| `src/app/(app)/pipeline/_components/kanban-card.tsx` | Kanban card component |
| `src/app/(app)/pipeline/_components/bulk-actions-bar.tsx` | Bulk actions bar |
| `src/app/(app)/pipeline/_components/pipeline-forecast.tsx` | Forecast sidebar panel |
| `src/app/(app)/pipeline/_components/pipeline-client.tsx` | Pipeline client wrapper (toggle/bulk) |
| `src/app/(app)/pipeline/_components/pipeline-table-view.tsx` | Extracted table view with scores + checkboxes |
| `src/app/(app)/clients/[id]/actions.ts` | addClientNote server action |
| `src/app/(app)/clients/[id]/_components/health-trend-chart.tsx` | Health trend LineChart |
| `src/app/(app)/clients/[id]/_components/client-notes.tsx` | Client notes with add form |
| `src/app/(app)/knowledge/actions.ts` | createDealLearning, updateDealLearning |
| `src/app/(app)/knowledge/_components/deal-learning-form.tsx` | Deal learning form component |
| `src/app/(app)/knowledge/new/page.tsx` | New deal learning page |
| `src/app/(app)/knowledge/[id]/edit/page.tsx` | Edit deal learning page |
| `src/app/(app)/settings/actions.ts` | updateNotificationPreferences, updatePipelineConfig |
| `src/app/(app)/settings/_components/settings-tabs.tsx` | Notifications/Pipeline/Retention/Agents tabs |
| `supabase/migrations/20260304000012_v5_alerts.sql` | Alert rules + events |
| `supabase/migrations/20260304000013_v5_approvals_v2.sql` | Approvals V5 columns |
| `supabase/migrations/20260304000014_v5_calibration.sql` | Calibration gates |
| `supabase/migrations/20260304000015_v5_weekly_reports.sql` | Weekly reports |
| `supabase/migrations/20260304000016_v5_client_notes.sql` | Client notes |
| `supabase/migrations/20260304000017_v5_settings.sql` | Notification prefs + pipeline config |
| `supabase/migrations/20260304000018_v5_search.sql` | FTS tsvector search |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/database.types.ts` | Added 7 table types + approvals columns |
| `src/lib/types.ts` | 7 new type aliases |
| `src/components/sidebar.tsx` | 19 items, mobile bottom nav |
| `src/app/layout.tsx` | ThemeProvider, suppressHydrationWarning |
| `src/app/(app)/layout.tsx` | CommandPalette + ThemeToggle in header |
| `src/app/(app)/dashboard/page.tsx` | Critical Alerts KPI, 5 columns, RealtimeRefresh |
| `src/app/(app)/pipeline/page.tsx` | Rewritten to use PipelineClient |
| `src/app/(app)/pipeline/actions.ts` | Added bulkAdvanceStage, bulkArchiveLeads |
| `src/app/(app)/approvals/page.tsx` | Risk cards, alternatives, decision info |
| `src/app/(app)/approvals/actions.ts` | decided_at/decided_by/decision_reason |
| `src/app/(app)/agents/[slug]/page.tsx` | Calibration tracker integration |
| `src/app/(app)/clients/[id]/page.tsx` | Health trend, renewal, risk flags, notes |
| `src/app/(app)/office/page.tsx` | RealtimeRefresh for agents |
| `src/app/(app)/office/_components/office-floor.tsx` | Responsive grid (1→2→4 cols) |
| `src/app/(app)/costs/page.tsx` | RealtimeRefresh for agent_token_usage |
| `src/app/(app)/knowledge/page.tsx` | "New Entry" button, import updates |
| `src/app/(app)/settings/page.tsx` | Full tabbed rebuild (5 tabs) |

## 4. Issues Found
- **Supabase CLI auth** — Still broken for type generation; database.types.ts manually updated
- **@radix-ui/react-checkbox** and **@radix-ui/react-visually-hidden** were not pre-installed — fixed by adding them
- **SUPABASE_CONNECTION_STRING** env var doesn't exist in .env.local — migrations applied with hardcoded credentials via Node pg client
- **FTS column names** — Spec used wrong column names; migration corrected to actual schema columns

## 5. What to Validate Next
1. **Pipeline kanban** — Test drag-and-drop between stages, verify advanceLeadStage fires correctly
2. **Bulk actions** — Select multiple leads in table view, test bulk advance and bulk archive
3. **Lead scoring** — Verify scores render on both table and kanban views with correct color coding
4. **Alerts system** — Create test alert_events in Supabase, verify they appear with severity grouping and resolve works
5. **Client health** — Visit a client detail page, verify health trend chart, renewal countdown, risk flags, and notes section
6. **Settings tabs** — Test notification preference save, pipeline config save, data retention save
7. **Knowledge write mode** — Create a new deal learning, edit an existing one
8. **Command palette** — Press cmd+K, search for a lead/client, verify navigation
9. **Theme toggle** — Toggle between dark/light mode, verify it persists
10. **Mobile layout** — Test bottom nav on narrow viewport, verify office grid responsiveness
11. **Realtime** — Modify data in Supabase directly, verify pages auto-refresh (dashboard, pipeline, office, costs, alerts)
