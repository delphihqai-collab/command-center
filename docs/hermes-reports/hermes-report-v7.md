# HERMES Report v7

**Date:** 2026-03-05
**Scope:** Sidebar tab removal — align with builderz-labs/mission-control reference

---

## What Was Implemented

Removed 5 sidebar tabs and 6 page route directories + 1 API route that don't exist in the reference open-source builderz-labs/mission-control project's navigation. Reorganized sidebar into grouped sections (Core, Observe, Automate, Admin) to match the reference's NavRail structure.

### Tabs Removed
- **Chat** — `/chat` (per-agent conversation panel)
- **Agent Comms** — `/comms` (inter-agent messaging feed)
- **Standup** — `/standup` (auto-generated standup reports)
- **Workflows** — `/workflows` (workflow templates)
- **Notifications** — `/notifications` (in-app notification center)

### Routes Also Removed
- `/pipelines` — linked from workflows, no equivalent in reference

### Sidebar Regrouped
- **Core (no header):** Overview, Agents, Tasks, Sessions, Office
- **OBSERVE:** Logs, Tokens, Memory
- **AUTOMATE:** Cron, Webhooks, Alerts
- **ADMIN:** Audit, Gateways, Integrations, Settings

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/sidebar.tsx` | Removed 5 nav items, reorganized into 4 groups |
| `src/app/(app)/office/_components/agent-sheet.tsx` | Changed chat link to agent detail link |
| `CLAUDE.md` | Removed deleted routes from architecture tree |
| `src/app/(app)/chat/` | Deleted (4 files) |
| `src/app/(app)/comms/` | Deleted (1 file) |
| `src/app/(app)/standup/` | Deleted (2 files) |
| `src/app/(app)/workflows/` | Deleted (3 files) |
| `src/app/(app)/pipelines/` | Deleted (2 files) |
| `src/app/(app)/notifications/` | Deleted (3 files) |
| `src/app/api/notifications/` | Deleted (1 file) |

---

## Issues Found

- The Office agent-sheet had a "Open Chat" button linking to `/chat?agent=<slug>`. Updated to link to `/agents/<slug>` instead.

---

## What to Validate Next

1. Navigate all 15 sidebar items — confirm no dead links
2. Check Office agent sheet panel — "View Agent" button should open agent detail
3. Verify mobile bottom nav works (5 priority items)
4. Confirm removed routes return 404 properly (`/chat`, `/comms`, `/standup`, `/workflows`, `/pipelines`, `/notifications`)
