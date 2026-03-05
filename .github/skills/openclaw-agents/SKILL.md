# Skill: OpenClaw Agent Management

## When to Use
Working with the OpenClaw agent fleet, reading/writing workspace template files (SOUL.md, IDENTITY.md, etc.), managing agent bindings, or integrating agent data into Mission Control.

## Agent Fleet

| Slug | Type | Model | Workspace Base |
|------|------|-------|---------------|
| hermes | director | claude-sonnet-4-6 | `~/.openclaw/workspace/` |
| sdr | worker | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/sdr/` |
| account-executive | worker | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/account-executive/` |
| account-manager | worker | claude-sonnet-4-6 | `~/.openclaw/workspace/teams/commercial/account-manager/` |
| finance | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/finance/` |
| legal | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/legal/` |
| market-intelligence | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/market-intelligence/` |
| knowledge-curator | specialist | claude-haiku-4-5-20251001 | `~/.openclaw/workspace/teams/commercial/knowledge-curator/` |

## Workspace Template Files

Each agent workspace contains these files:

| File | Purpose | Editable from UI? |
|------|---------|-------------------|
| SOUL.md | Personality + mission + principles | Yes (Soul Editor) |
| IDENTITY.md | Role, model, capabilities | Via agent settings |
| AGENTS.md | Sub-agent roster + routing rules | Director only |
| TOOLS.md | Available tools | Read-only |
| USER.md | Owner context (Delphi) | Shared across all |
| BOOTSTRAP.md | First-run initialization | Read-only |
| HEARTBEAT.md | Periodic check-in instructions | Read-only |
| BOOT.md | Session startup instructions | Read-only |
| memory/ | Agent memory directory | Via Memory Browser |

## CLI Commands

```bash
# List all agents with JSON output
openclaw agents list --json

# Add a new agent
openclaw agents add <name>

# Bind agent to Discord channel
openclaw agents bind <agent> discord:<channel-id>

# Set agent model
openclaw agents set-identity <agent> <model>
```

## Memory Paths

`src/lib/memory-paths.ts` maps agent slugs to filesystem memory directories:

```typescript
export const MEMORY_PATHS: Record<string, string> = {
  hermes: "/home/delphi/.openclaw/workspace/memory",
  sdr: "/home/delphi/.openclaw/workspace/teams/commercial/sdr/memory",
  // ... etc
};
```

The memory API route (`/api/memory`) uses these paths to serve directory listings and file contents.

## Integration Pattern

Agent data lives in two places:
1. **Supabase `agents` table** — status, type, model, display name, created_at
2. **OpenClaw workspace filesystem** — SOUL.md, IDENTITY.md, memory files

When updating agent config, both may need to be synced.
