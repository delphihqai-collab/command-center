# HERMES Report — V4

**Version:** 4  
**Date:** 2025-07-14  
**Scope:** V4 Full Implementation — The Office, Chat, Costs, Gateway, Sessions, Memory Browser, Log Viewer, Audit Log, V3 Fixes

---

## What Was Implemented

### P0 — V3 Fixes
- **Approval 6-stage workflow**: Added `stage`, `stage_history`, `stage_advanced_at`, `stage_advanced_by` columns to approvals. Created `valid_approval_transitions` table with 7 transition rows (submitted → in_review → escalated → approved/rejected/deferred → closed).
- **Lead stage advance**: Added `StageAdvanceButton` client component on lead detail page with Select dropdown and server action integration.
- **Realtime refresh**: Created generic `RealtimeRefresh` component using Supabase Realtime (`postgres_changes`). Replaced 60-second polling on approvals page.
- **Audit log page**: Server component with filterable table (agent, action, date range), expandable JSON changes, relative timestamps.

### P1 — Flagship Features
- **The Office**: Pixel-art agent grid with 4-column CSS layout. Rank-based desk styling (director gets col-span-2, indigo border; senior gets elevated shadow). Status dots with animated pulse. Click-to-open side sheet with agent details, recent logs, and navigation links.
- **Chat panel**: Three-page architecture — agent selector with conversation list, conversation thread with message bubbles (user right-aligned indigo, agent left-aligned zinc), `ChatInput` with Enter-to-send. `sendMessage` server action with auth check.
- **Sidebar**: Updated from 9 to 17 navigation items with grouped icons for all new pages.
- **Model costs**: `model-costs.ts` with cost constants for claude-sonnet-4-6 and claude-haiku-4-5, `calculateCost()` function.

### P2 — Operations
- **Cost tracking**: KPI cards (today/week/month/all-time), per-agent breakdown table, Recharts line chart with per-agent color series, CSV export button.
- **Gateway config**: Reads from localhost:18789 with graceful fallback UI. 4 info cards (Model Config, Scheduled Jobs, Update Settings, Rate Limits). Read-only by default with Dialog warning for edit mode. Credential masking via regex.
- **Sessions panel**: Server component with gateway API integration and agent_logs fallback. Client table with 30-second auto-refresh.

### P3 — Tooling
- **Memory browser**: Route handler (`/api/memory`) with auth check, path traversal prevention, and search across files. Client component with agent selector, file list, markdown rendering via react-markdown, and search.
- **Log viewer**: Route handler (`/api/logs/journal`) using `execFile` for journalctl. Client component with agent filter, time range selector (1h/6h/24h/7d), text search, live tail via Supabase Realtime, level coloring (error=red, warn=amber).
- **Memory paths**: `src/lib/memory-paths.ts` with paths for all 8 agents.

### Infrastructure
- 4 database migrations applied (approval stages, chat tables, token usage, audit log hardening)
- `database.types.ts` updated with all new tables (agent_token_usage, audit_log, chat_conversations, chat_messages, valid_approval_transitions) and new approval columns
- `types.ts` updated with 4 new type aliases
- `CLAUDE.md` updated with agent fleet section, expanded architecture, new DB schema, route handler pattern

---

## Files Changed

### New Files (27)
- `supabase/migrations/20260304000008_v4_approval_stages.sql`
- `supabase/migrations/20260304000009_v4_chat.sql`
- `supabase/migrations/20260304000010_v4_token_usage.sql`
- `supabase/migrations/20260304000011_v4_audit_log.sql`
- `src/components/realtime-refresh.tsx`
- `src/lib/memory-paths.ts`
- `src/lib/model-costs.ts`
- `src/app/(app)/audit-log/page.tsx`
- `src/app/(app)/office/page.tsx`
- `src/app/(app)/office/_components/office-floor.tsx`
- `src/app/(app)/office/_components/agent-desk.tsx`
- `src/app/(app)/office/_components/status-dot.tsx`
- `src/app/(app)/office/_components/agent-sheet.tsx`
- `src/app/(app)/chat/page.tsx`
- `src/app/(app)/chat/[conversationId]/page.tsx`
- `src/app/(app)/chat/[conversationId]/actions.ts`
- `src/app/(app)/chat/[conversationId]/_components/chat-input.tsx`
- `src/app/(app)/costs/page.tsx`
- `src/app/(app)/costs/_components/cost-chart.tsx`
- `src/app/(app)/costs/_components/cost-export-button.tsx`
- `src/app/(app)/gateway/page.tsx`
- `src/app/(app)/gateway/_components/gateway-editor.tsx`
- `src/app/(app)/sessions/page.tsx`
- `src/app/(app)/sessions/_components/sessions-table-client.tsx`
- `src/app/(app)/memory/page.tsx`
- `src/app/(app)/memory/_components/memory-browser.tsx`
- `src/app/(app)/logs/page.tsx`
- `src/app/(app)/logs/_components/log-viewer.tsx`
- `src/app/api/memory/route.ts`
- `src/app/api/logs/journal/route.ts`
- `docs/hermes-reports/hermes-report-v4.md`

### Modified Files (7)
- `src/components/sidebar.tsx` — 9 → 17 nav items
- `src/app/(app)/approvals/page.tsx` — AutoRefresh → RealtimeRefresh
- `src/app/(app)/pipeline/[id]/page.tsx` — Added StageAdvanceButton
- `src/app/(app)/pipeline/[id]/_components/stage-advance-button.tsx` — Fixed import path
- `src/lib/database.types.ts` — Added 5 new table types + 4 approval columns
- `src/lib/types.ts` — Added 4 new type aliases
- `CLAUDE.md` — Agent fleet, expanded architecture, new DB tables, route handler pattern
- `.github/copilot-instructions.md` — Mirrored CLAUDE.md updates

---

## Issues Found

1. **Supabase CLI auth broken**: Cannot run `supabase gen types` — had to manually update `database.types.ts`. Types are correct for the new schema but should be regenerated when CLI auth is fixed.
2. **Gateway API unavailable**: Gateway at localhost:18789 is not running on this machine. Gateway and Sessions pages show graceful fallback UI.
3. **Migration `archived_at` on approvals**: The approvals table does not have an `archived_at` column — migration 8 was fixed to remove the WHERE clause from the index.
4. **`middleware.ts` deprecation warning**: Next.js 16 shows "middleware file convention is deprecated, use proxy instead" — not blocking.

---

## What to Validate Next

1. **All 28 routes render**: Visit each route and confirm no runtime errors
2. **The Office**: Verify 8 agent desks render with correct rank styling and status dots
3. **Chat**: Create a conversation, send messages, verify persistence
4. **Memory Browser**: Select each agent, verify file listing (depends on memory directories existing on disk)
5. **Log Viewer**: Verify agent_logs load with filters, test live tail toggle
6. **Audit Log**: Test date range filters and expandable JSON changes
7. **Cost Tracking**: Verify KPI cards show correct aggregations from agent_token_usage
8. **Lead Stage Advance**: Navigate to a lead detail page, use the stage advance dropdown
9. **Approvals Realtime**: Open approvals page in two tabs, change an approval and verify real-time update
10. **CSV Export**: Click export button on costs page and verify CSV download
