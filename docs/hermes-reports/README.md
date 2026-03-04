# HERMES Reports

This directory contains implementation session reports for the Command Center project. Each report documents what was built, what changed, and what needs validation next.

## Report Format

### Naming Convention
- `hermes-report-v1.md` (first report)
- `hermes-report-v2.md` (second report)
- etc. — increment the version number sequentially

### Required Sections

Every report must include these sections:

#### 1. Version & Metadata
```markdown
# HERMES Report v1

**Date:** 2026-03-04
**Session Duration:** 2 hours
**Author:** Claude Code (or GitHub Copilot)
```

#### 2. What Was Implemented
A high-level summary of the work completed in this session. Include:
- Features added
- Bugs fixed
- Improvements made
- Links to relevant commits

**Example:**
```markdown
## What Was Implemented

Added a real-time pipeline dashboard widget that displays:
- Lead count by stage
- Win rate trends (last 30 days)
- Revenue forecast (next 60 days)

Commits: 08e61d7, da80ced, 16a69f5
```

#### 3. Files Changed
List all modified files with a brief description of what changed.

**Example:**
```markdown
## Files Changed

- `src/app/(app)/dashboard/page.tsx` — added pipeline widget component
- `src/components/PipelineChart.tsx` — new component for revenue forecast
- `src/lib/supabase/queries.ts` — added `getLeadsByStage()` query
- `CLAUDE.md` — updated build instructions
```

#### 4. Issues Found
Document any problems discovered during this session:
- Bugs or edge cases encountered
- Workarounds applied
- Known limitations in the implementation

**Example:**
```markdown
## Issues Found

- **Timezone handling:** Lead creation timestamps use UTC; need to verify against Porto timezone. Workaround: added comment noting this for QA.
- **RLS edge case:** Service role bypass in `getLeadsByStage()` may cause auth issues on certain queries. TODO: validate with full RLS test suite.
- **Performance:** Pipeline chart renders slowly with >500 leads. Known limitation — needs query optimization in v2.
```

#### 5. What to Validate Next
Checklist of testing and validation steps. This guides QA and the next development session.

**Example:**
```markdown
## What to Validate Next

- [ ] Pipeline widget loads within 2 seconds on localhost
- [ ] Win rate calculation matches HERMES's pipeline records
- [ ] Revenue forecast matches previous 30-day actuals
- [ ] Timezone rendering works correctly for Porto time
- [ ] RLS does not leak data across users
- [ ] Chart responds correctly to lead stage updates (realtime)

**Blockers to watch:**
- If RLS validation fails, may need to revisit service role usage
- Performance validation pending on production database size
```

## Example Report

```markdown
# HERMES Report v1

**Date:** 2026-03-04
**Session Duration:** 3 hours
**Author:** Claude Code

## What Was Implemented

Completed initial implementation of Command Center dashboard with real-time pipeline visibility. Added:
- Dashboard overview page with agent status cards
- Pipeline summary widget (leads by stage)
- Win rate and sales velocity charts
- Foundation for client health monitoring

Commits: 08e61d7, da80ced, 16a69f5

## Files Changed

- `src/app/(app)/dashboard/page.tsx` — main dashboard layout and data fetching
- `src/components/AgentStatus.tsx` — new agent status card component
- `src/components/PipelineWidget.tsx` — pipeline summary and charts
- `src/lib/supabase/queries.ts` — added dashboard queries
- `src/lib/database.types.ts` — regenerated from schema
- `CLAUDE.md` — added HERMES Reports section
- `.github/copilot-instructions.md` — added HERMES Reports instruction

## Issues Found

- **Data load time:** Initial page load takes ~2.5 seconds due to multiple parallel queries. Acceptable for now; consider caching in v2.
- **Realtime subscription:** Chart updates may miss rapid lead changes if Supabase realtime has latency. Workaround: added refresh button.
- **RLS edge case:** Service role query in `getPipelineSummary()` bypasses RLS. Need to verify this doesn't leak data across auth contexts.

## What to Validate Next

- [ ] Dashboard loads correctly in Safari and Firefox (tested in Chrome only)
- [ ] Agent status cards update when agent logs change
- [ ] Pipeline widget handles edge case of empty lead stage
- [ ] Timezone rendering matches Porto time (verify against system clock)
- [ ] RLS validation — confirm no data leakage between users
- [ ] Performance test with 1000+ leads in pipeline
- [ ] Export/CSV functionality (planned for v2)

**Blockers to watch:**
- RLS validation must pass before production deployment
- Performance optimization needed if chart render time exceeds 3 seconds
```

## How to Use This Directory

1. After completing an implementation session, create a new report file.
2. Name it `hermes-report-vX.md` where X is the next sequential number.
3. Fill out all five required sections.
4. Commit the report with message: `docs: hermes report v<X> — <one-line summary>`
5. Push to main.

## Purpose

These reports serve four functions:

1. **Leadership visibility** — Delphi leadership can review what was built and why
2. **Knowledge continuity** — The next developer starts with full context
3. **QA checklist** — Validation steps are explicit and testable
4. **Audit trail** — Historical record of all changes to Command Center

---

_HERMES Reports are mandatory for all implementation sessions. No report = incomplete session._
