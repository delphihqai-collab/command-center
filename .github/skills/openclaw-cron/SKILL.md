# Skill: OpenClaw Cron Management

## When to Use
Working with the cron page, scheduling agent tasks, reading/modifying OpenClaw cron jobs, or integrating cron data into Mission Control.

## Cron System Overview

OpenClaw cron jobs are stored in `~/.openclaw/cron/jobs.json`. They are **not** in Supabase.

Each job has:
```json
{
  "id": "unique-id",
  "agentId": "hermes",
  "prompt": "Check pipeline status and report",
  "schedule": { "type": "every", "value": "6h" },
  "sessionTarget": "main",
  "enabled": true
}
```

## Schedule Types

| Type | Value Format | Example |
|------|-------------|---------|
| `at` | ISO datetime | `"2026-03-15T09:00:00Z"` |
| `every` | Duration | `"6h"`, `"30m"`, `"1d"` |
| `cron` | Cron expression | `"0 9 * * 1-5"` |

## Session Targets

- `main` — runs in the agent's active/default session
- `isolated` — spawns a new parallel session (no interference with main)

## CLI Commands

```bash
# List all jobs (JSON output)
openclaw cron list --json

# Add a job (interactive)
openclaw cron add

# Trigger a job immediately
openclaw cron run <job-id>

# View execution history
openclaw cron runs [job-id]

# Edit a job
openclaw cron edit <job-id>

# Remove a job
openclaw cron remove <job-id>
```

## Current Jobs (16 active)

- **Hermes (5):** Morning briefing, pipeline check, evening summary, weekly report, system health
- **Sub-agents (11):** Each has 1-2 heartbeat jobs for periodic check-ins

## Integration with Mission Control

The cron page should:
1. Read jobs via `execFile("openclaw", ["cron", "list", "--json"])` in a Route Handler
2. Display job list with agent name, schedule, last run, status
3. Enable/disable via `openclaw cron edit`
4. Trigger via `openclaw cron run`
5. View history via `openclaw cron runs`

Never read from the Supabase `scheduled_tasks` table for OpenClaw cron jobs.
