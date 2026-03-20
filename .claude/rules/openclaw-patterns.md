---
description: Rules for working with OpenClaw in Mission Control — CLI patterns, workspace access, and integration guidelines
globs: ["src/**/*.ts", "src/**/*.tsx"]
---

# OpenClaw Integration Patterns

## CLI Commands in Route Handlers
- Always use `execFile("openclaw", [...args])` — never `exec()` (prevents injection)
- Always add auth check before CLI calls
- Common patterns:
  - Agent turn: `execFile("openclaw", ["agent", "--agent", agentId, "--message", prompt, "--json"])`
  - Cron list: `execFile("openclaw", ["cron", "list", "--json"])`
  - Sessions: `execFile("openclaw", ["sessions", "--all-agents", "--json"])`
  - Agent list: `execFile("openclaw", ["agents", "list", "--json"])`

## Workspace File Access
- Use `MEMORY_PATHS` from `src/lib/memory-paths.ts` for agent memory directories
- Agent workspace base paths:
  - Hermes: `~/.openclaw/workspace/`
  - Sub-agents: `~/.openclaw/workspace/teams/commercial/<slug>/`
- Always validate paths with `normalize()` + prefix check before filesystem access

## Gateway API
- Base URL: `http://127.0.0.1:18789`
- The gateway serves a Vite+Lit Control UI SPA — HTTP GET returns HTML, not JSON
- For programmatic access, use WebSocket protocol or the OpenClaw CLI
- Never expose gateway port to external networks

## Cron Run History
- JSONL files in `~/.openclaw/cron/runs/<job-id>.jsonl`
- Each line is a JSON object with token usage, cost, timing, status
- Used by the Costs page to calculate per-agent spending

## Model Cost Constants
- Defined in `src/lib/model-costs.ts`
- claude-sonnet-4-6: input $3/MTok, output $15/MTok
- claude-haiku-4-5-20251001: input $0.25/MTok, output $1.25/MTok

## Service Names
- Command Center: `command-center.service` (user unit, port 9069)
- OpenClaw Gateway: `openclaw-gateway.service` (user unit, port 18789)
- NOT `openclaw.service` — the correct name is `openclaw-gateway.service`
