---
name: fleet-status
description: Check the live status of the OpenClaw agent fleet, sessions, cron jobs, and gateway health. Use this before starting any work to understand the current state.
user-invocable: true
---

# Fleet Status Check

Check the live state of the Hermes agent fleet and report a concise summary.

## Current Fleet State

### Agents
!`openclaw agents list 2>/dev/null`

### Gateway Health
!`openclaw health 2>/dev/null`

### Active Sessions
!`openclaw sessions --all-agents --json 2>/dev/null | head -80`

### Cron Job Status
!`openclaw cron status 2>/dev/null`

### Services
!`systemctl --user is-active openclaw-gateway 2>/dev/null && echo "OpenClaw: running" || echo "OpenClaw: stopped"`
!`systemctl --user is-active command-center 2>/dev/null && echo "Command Center: running" || echo "Command Center: stopped"`

## Instructions

Analyze the output above and report:
1. **Gateway:** running/stopped, version
2. **Agents:** count, which are active/idle
3. **Sessions:** active count, Hermes last activity
4. **Cron:** healthy/erroring job counts, any failures
5. **Services:** both services status
6. **Issues:** any problems that need attention

Keep the report concise — 10-15 lines max. Flag anything unusual.
