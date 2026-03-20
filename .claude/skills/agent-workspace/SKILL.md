---
name: agent-workspace
description: Read or edit an OpenClaw agent's workspace files (SOUL.md, IDENTITY.md, AGENTS.md, TOOLS.md, etc.). Use when you need to understand or modify agent configuration.
user-invocable: true
---

# Agent Workspace Manager

Read or edit workspace files for any agent in the fleet.

## Arguments

$ARGUMENTS

## Agent Workspace Paths

| Agent | Workspace |
|-------|-----------|
| hermes | `~/.openclaw/workspace/` |
| sdr | `~/.openclaw/workspace/teams/commercial/sdr/` |
| account-executive | `~/.openclaw/workspace/teams/commercial/account-executive/` |
| account-manager | `~/.openclaw/workspace/teams/commercial/account-manager/` |
| finance | `~/.openclaw/workspace/teams/commercial/finance/` |
| legal | `~/.openclaw/workspace/teams/commercial/legal/` |
| market-intelligence | `~/.openclaw/workspace/teams/commercial/market-intelligence/` |
| knowledge-curator | `~/.openclaw/workspace/teams/commercial/knowledge-curator/` |

## Workspace Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality, mission, principles |
| `IDENTITY.md` | Name, role, model, capabilities |
| `AGENTS.md` | Sub-agent roster, playbooks, runbooks, rules |
| `TOOLS.md` | Available tools, channels, integrations |
| `USER.md` | Owner context, communication preferences |
| `HEARTBEAT.md` | Periodic check-in instructions |
| `BOOT.md` | Session startup instructions |
| `BOOTSTRAP.md` | First-run initialization |
| `MEMORY.md` | Long-term preferences & registries |

## Instructions

1. Determine which agent and file the user wants to view/edit
2. Read the file from the workspace path
3. If editing: make the changes and write the file back
4. If viewing: present the content with a summary

## Important
- Hermes playbooks are in `~/.openclaw/workspace/playbooks/`
- Hermes runbooks are in `~/.openclaw/workspace/runbooks/`
- Templates are in `~/.openclaw/workspace/templates/commercial/`
- Memory files are in `<workspace>/memory/`
- Changes take effect on the agent's next session (no restart needed)
