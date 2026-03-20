---
name: cron-manage
description: View, create, edit, or debug OpenClaw cron jobs. Use when working with scheduled agent tasks.
user-invocable: true
---

# OpenClaw Cron Manager

Manage scheduled jobs for the agent fleet.

## Arguments

$ARGUMENTS

## Current Jobs
!`openclaw cron list 2>/dev/null`

## Instructions

Based on the user's request, perform the appropriate action:

### View jobs
```bash
openclaw cron list                    # All jobs
openclaw cron list --json             # JSON format
openclaw cron runs <job-id>           # Execution history for a job
openclaw cron status                  # Overall cron status
```

### Create a job
```bash
openclaw cron add                     # Interactive wizard
```

Or edit `~/.openclaw/cron/jobs.json` directly. Job structure:
```json
{
  "id": "unique-id",
  "agentId": "main",
  "prompt": "The instruction for the agent",
  "schedule": { "type": "cron", "value": "0 9 * * 1-5" },
  "sessionTarget": "main",
  "delivery": { "mode": "announce", "channel": "1477060385596248134" },
  "enabled": true,
  "lightweight": false
}
```

Schedule types:
- `cron`: standard cron expression (e.g., `"0 9 * * 1-5"` = weekdays 9am)
- `every`: interval (e.g., `"30m"`, `"2h"`, `"1d"`)
- `at`: one-time (e.g., `"2026-03-25T10:00:00"`)

Session targets:
- `main`: runs in the agent's active session
- `isolated`: creates a new parallel session

Delivery modes:
- `announce`: sends response to a Discord channel
- `webhook`: POSTs to a URL
- `none`: no delivery (silent)

### Edit a job
```bash
openclaw cron edit <job-id>           # Interactive edit
```

### Test a job
```bash
openclaw cron run <job-id>            # Trigger immediately
```

### Debug failing jobs
1. Check run history: `openclaw cron runs <job-id>`
2. Common error: "Discord recipient is required" → job needs a channel in delivery config
3. Check if agent has a Discord binding: `openclaw agents bindings`
4. Verify gateway is running: `systemctl --user is-active openclaw-gateway`

### Known Issues (current fleet)
- Sub-agent heartbeat cron jobs fail because they use `"channel": "last"` delivery but agents have no prior Discord session
- Fix: set explicit channel IDs in delivery config, or bind agents to Discord channels first
