# OpenClaw Masterclass — Extracted Prompts & Patterns

Source: https://masterclass-prompts.netlify.app/ (by Mani Kanasani / Agents in a Box)

## Token Optimization Config

### Layer 1: Disable Thinking (for routine tasks)
```json
{ "thinking": { "type": "disabled" } }
```
Mid-session: `/reasoning off`

### Layer 2: Cap Context Window
```json
{ "contextTokens": 50000 }
```

### Layer 3: Model Routing — Haiku Default
```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "anthropic/claude-haiku-4-5" },
      "models": {
        "anthropic/claude-sonnet-4-5": { "alias": "sonnet" },
        "anthropic/claude-haiku-4-5": { "alias": "haiku" }
      }
    }
  }
}
```

System prompt routing rule:
```
MODEL SELECTION RULE: Default: Always use Haiku. Switch to Sonnet ONLY when:
- Architecture decisions
- Production code review
- Security analysis
- Complex debugging / reasoning
- Strategic multi-project decisions
When in doubt: Try Haiku first.
```

### Layer 5: Lean Session Initialization
```
SESSION INITIALIZATION RULE: On every session start:
1. Load ONLY: SOUL.md, USER.md, IDENTITY.md, memory/YYYY-MM-DD.md
2. DO NOT auto-load: MEMORY.md, session history, prior messages
3. Use memory_search() on demand, don't load whole files
4. Update memory/YYYY-MM-DD.md at end of session
```

## Cognitive Memory — Agent System Prompt

Four categories: Technical (API quirks), Preference (user style), Project (architecture), Process (workflows).

Key rules for memory submissions:
1. Be specific, not vague: "delete_data requires BOTH app_id AND data_id" not "API has quirks"
2. One memory per discovery (separately approvable)
3. Never store credentials (store WHERE, not WHAT)
4. Submit after every build (1-3 learnings)
5. Submit immediately on user correction
6. Memories require owner approval before persisting

Post-build memory extraction checklist:
- Did I hit errors that took >1 attempt to fix?
- Did I discover something undocumented about the codebase?
- Did the owner correct my approach?
- Did I find a pattern that saves time on similar tasks?

## Self-Evolution — Three Triggers

### Trigger 1: Pattern Failure (3+ occurrences → extract rule)
When same error type occurs 3+ times:
1. Identify root cause (not symptom)
2. Write fix as clear rule
3. Log as self_evolution event
4. Submit to memory for persistence

### Trigger 2: User Correction (immediate)
When owner corrects behavior:
1. Apply correction immediately
2. Log the correction
3. Submit to memory

### Trigger 3: Periodic Review (safety brake)
After every 5 self-modifications, PAUSE and ask for review.

### Boundaries
- CAN modify: memory entries, workflow preferences, documentation
- CANNOT modify: .env files, DB schemas, deployment configs, credentials, other agents' rules

### Stale Documentation Detection
Flag docs that: haven't been updated in 30+ days, reference non-existent files, contain TODOs, contradict actual codebase.

## 8-Phase Autonomous Pipeline

```
CONTEXT → PLAN → TASK BOARD → BUILD → VALIDATE → HEAL → REPORT → CLOSE
```

### Phase Details
1. **CONTEXT** — Load project files, check for dispatched work, set status online. Never code before understanding what exists.
2. **PLAN** — Break into numbered subtasks, define validation gate per subtask, identify dependencies.
3. **TASK BOARD** — Create task on board, assign agents + owner, create subtasks.
4. **BUILD** — Execute plan, log every milestone (min 3), heartbeat every 5 min, ask if blocked.
5. **VALIDATE** — Run all checks (build, typecheck, test endpoints). All pass → Report. Any fail → Heal.
6. **HEAL** — Read error, diagnose, fix, re-run. Max 5 attempts. After 5: escalate, stop.
7. **REPORT** — Generate report with summary, subtask results, files changed, metrics.
8. **CLOSE** — Emit run_end, set status ready, never deploy without approval.

### Production Standards
- Queue-first execution for all build dispatches
- No silent runs >10 min — heartbeat mandatory
- Every app ships with README + demo path + 3 screenshots
- Ship complete or mark incomplete — never claim done with missing features

## Multi-Agent Dispatch Protocol

Two-agent system: Orchestrator dispatches → Executor builds.

**Queue-first rule:** Builds via queue, conversation via comms. Never trigger builds via agent_comms.

### Dispatch Brief Format
```
## Task
<What to build — one sentence>

## Requirements
<Detailed spec>

## Environment
- Working directory: <path>
- Env vars needed: <list>

## Deliverables
1. Working app
2. README.md
3. Logs
4. Report
```

### Rework Dispatch (when something breaks)
```
## Task
<What to fix — one sentence>

## Current State (Broken)
<What's failing, error messages>

## Requirements
<What the fixed version should do>

## Environment
- Working directory: <path>
- Error log: <paste or reference>

## Deliverables
1. Fixed feature, passing validation
2. Updated README
3. Logs showing fix
4. Report with before/after
```

## Automations — 5 Starter Cron Jobs

### 1. Morning Digest (7am daily)
```
Review overnight: alerts, pending tasks, unanswered questions.
Prepare: today's calendar, priority tasks, key meetings.
Deliver: formatted brief to #daily-standup.
```

### 2. Midday Prep (noon weekdays)
```
Check: afternoon meetings, pull context for each.
Review: morning task progress, flag blockers.
Prepare: talking points for upcoming calls.
```

### 3. Evening Report (6pm weekdays)
```
Summarize: what was completed today.
Flag: incomplete tasks, blockers, decisions needed.
Plan: tomorrow's priorities.
```

### 4. Competitor Intel (Monday 9am)
```
Scan: competitor websites, social media, news.
Identify: pricing changes, new features, positioning shifts.
Report: weekly intelligence brief.
```

### 5. Meeting Sync (every 4h)
```
Pull: latest meeting transcripts.
Extract: action items, decisions, follow-ups.
Update: task board and pipeline accordingly.
```

## Security — Key Vulnerabilities

4 CVEs documented:
- CVE-2026-0765: Critical RCE via crafted prompt
- CVE-2026-0766: Critical arbitrary file read
- CVE-2025-9074: Moderate SSRF via web_fetch
- CVE-2026-25253: Critical code execution via MCP tool

ClawHavoc supply chain attack: 1,184+ malicious skills uploaded to ClawHub.

### 6 Critical Hardening Steps
1. Set secret key + disable registration
2. Disable PIP install + restrict workspace tools
3. Bind to localhost only
4. Docker-aware firewalls
5. HTTPS via Caddy/reverse proxy
6. Keep software updated

### Audit Command
```bash
openclaw security audit
```

## Skills Factory — Naming & Structure

Skill naming: `^[a-z][a-z0-9-]{2,49}$`

5 foundational skill templates from the masterclass:
1. ClawBuddy Core (REST API integration)
2. Office Animation (custom UI)
3. Resend Email (SMTP)
4. Intelligence Sync (REST data pipeline)
5. Morning Digest Boot Check (custom health check)

## The Blueprint — Session End Protocol (/done)

```
VALIDATE → SYNC → REPORT → LEARN → OFFLINE
```

1. **VALIDATE** — Check for loose ends (tasks in "doing", unsaved files, uncommitted changes)
2. **SYNC** — Update STATUS.md (accomplished, in-progress, next, blockers)
3. **REPORT** — Generate session report
4. **LEARN** — Extract patterns/gotchas/decisions, submit to memory
5. **OFFLINE** — Set status offline

## Config Gotcha

"OpenClaw has a habit of breaking when you ask it to make config changes to openclaw.json. It hallucinates field names, over-configures, and introduces syntax errors. The fix? Don't ask it to figure it out. Paste the directions as a prompt."

Always run `openclaw doctor` after config changes to validate.
