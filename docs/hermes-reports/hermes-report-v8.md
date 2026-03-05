# HERMES Report v8

## Version & Metadata
- **Version:** 8
- **Date:** 2026-03-05
- **Scope:** Copilot instructions overhaul, .github structure creation, agent data fixes, memory paths fix

## What Was Implemented

### 1. CLAUDE.md — Full Rewrite
Replaced the outdated generic agent fleet documentation with comprehensive OpenClaw context:
- Real Hermes commercial fleet (8 agents with types, models, workspace paths)
- OpenClaw key concepts (Gateway, Workspace, Channels, Sessions, Subagents, Cron)
- Filesystem layout (`~/.openclaw/` structure)
- Workspace template file reference (SOUL.md, IDENTITY.md, AGENTS.md, etc.)
- OpenClaw CLI reference (agents, cron, config, status commands)
- Cron system documentation (job format, schedule types, session targets)
- Dual data source architecture table (what reads from Supabase vs OpenClaw)
- Security rules for OpenClaw integration (`execFile` not `exec`, path traversal prevention)

### 2. .github/copilot-instructions.md — Full Rewrite
Updated with identical OpenClaw context for GitHub Copilot:
- Project identity with Hermes/OpenClaw context
- Agent fleet table with all 8 agents
- OpenClaw integration rules
- Dual data sources documentation
- Running commands for both Mission Control and OpenClaw

### 3. .github Structure — Created from Scratch
Modeled after the ViralToby project's mature .github structure:

**Agent:**
- `agents/reviewer.agent.md` — Read-only code reviewer checking for Supabase client mismatches, missing error handling, OpenClaw injection risks, hardcoded paths, gateway exposure, missing auth, generated file edits, any types

**Instructions (5 files):**
- `instructions/api-routes.instructions.md` — Auth pattern, OpenClaw CLI calls, gateway API, filesystem security
- `instructions/server-actions.instructions.md` — Template, rules, naming conventions
- `instructions/react-components.instructions.md` — Server vs Client, data fetching, parallel queries, styling
- `instructions/openclaw-integration.instructions.md` — Data source rules, workspace paths, CLI via Route Handlers, gateway API, security
- `instructions/migration-sql.instructions.md` — Idempotent SQL rules, naming, applying, triggers

**Skills (5 directories):**
- `skills/supabase-crud/SKILL.md` — Client selection, query patterns, key tables, mutations
- `skills/openclaw-agents/SKILL.md` — Fleet reference, workspace templates, CLI, memory paths, integration pattern
- `skills/openclaw-cron/SKILL.md` — Job format, schedule types, session targets, CLI, current jobs, integration
- `skills/gateway-integration/SKILL.md` — API endpoints, access pattern, config structure, sessions dual source
- `skills/memory-browser/SKILL.md` — Architecture, memory paths, API route, security, file operations

**Prompts (5 files):**
- `prompts/add-page.prompt.md` — Steps + template for new pages
- `prompts/add-migration.prompt.md` — Migration creation workflow
- `prompts/deploy.prompt.md` — Build, deploy, verify checklist
- `prompts/debug-production.prompt.md` — Diagnosis steps + common issues table
- `prompts/pre-commit-qa.prompt.md` — Full QA checklist

### 4. memory-paths.ts — Fixed
Replaced 6 old generic agent paths (`/home/user/agents/orchestrator/memory` etc.) with 8 real OpenClaw paths:
- hermes → `~/.openclaw/workspace/memory`
- sdr, account-executive, account-manager, finance, legal, market-intelligence, knowledge-curator → `~/.openclaw/workspace/teams/commercial/<slug>/memory`

### 5. Agent Data Fixes (from earlier in session)
- Updated all 8 agents in Supabase: status=active, correct types, correct models, real workspace paths
- Populated agent_souls table with SOUL.md content for all 8 agents
- Updated seed.sql with real Hermes fleet

## Files Changed

### New Files
- `.github/agents/reviewer.agent.md`
- `.github/instructions/api-routes.instructions.md`
- `.github/instructions/server-actions.instructions.md`
- `.github/instructions/react-components.instructions.md`
- `.github/instructions/openclaw-integration.instructions.md`
- `.github/instructions/migration-sql.instructions.md`
- `.github/skills/supabase-crud/SKILL.md`
- `.github/skills/openclaw-agents/SKILL.md`
- `.github/skills/openclaw-cron/SKILL.md`
- `.github/skills/gateway-integration/SKILL.md`
- `.github/skills/memory-browser/SKILL.md`
- `.github/prompts/add-page.prompt.md`
- `.github/prompts/add-migration.prompt.md`
- `.github/prompts/deploy.prompt.md`
- `.github/prompts/debug-production.prompt.md`
- `.github/prompts/pre-commit-qa.prompt.md`

### Modified Files
- `CLAUDE.md` — Full rewrite with OpenClaw documentation
- `.github/copilot-instructions.md` — Full rewrite with OpenClaw context
- `src/lib/memory-paths.ts` — Replaced old agent paths with real OpenClaw paths
- `supabase/seed.sql` — Updated to Hermes fleet (done earlier in session)

## Issues Found

1. **Cron page still reads from Supabase** — The `src/app/(app)/cron/page.tsx` still queries the empty `scheduled_tasks` table instead of OpenClaw cron. Needs rewrite to use `openclaw cron list --json` via Route Handler.
2. **Webhook create button still disabled** — `src/app/(app)/webhooks/_components/webhook-actions.tsx` has `disabled` prop on the "New Webhook" button.
3. **Specialist agents have placeholder SOULs** — Finance, Legal, Market Intelligence, Knowledge Curator have ~60 char placeholder SOUL.md content. Need real SOULs written.
4. **.claude/skills/ still has old README** — The `.claude/skills/README.md` references skills "to create" that are now in `.github/skills/`.

## What to Validate Next

1. Open the Memory page — verify all 8 agents appear in dropdown with correct names
2. Select each agent in Memory browser — verify files load from correct OpenClaw workspace paths
3. Verify GitHub Copilot picks up the new `.github/instructions/*.instructions.md` files via `applyTo` patterns
4. Verify the reviewer agent can be invoked: `@reviewer` in Copilot Chat
5. Fix cron page to read from OpenClaw (next session)
6. Fix webhook create button (next session)
7. Write real SOULs for the 4 specialist agents (next session)
