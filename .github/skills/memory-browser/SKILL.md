# Skill: Memory Browser

## When to Use
Working with the memory page, agent memory files, or the `/api/memory` route handler.

## Architecture

The memory browser reads agent workspace files from the local filesystem:

```
Client Component (memory-browser.tsx)
  → GET /api/memory?agent=hermes&path=/
  → Route Handler reads filesystem
  → Returns directory listing or file content
```

## Memory Paths

`src/lib/memory-paths.ts` maps agent slugs to memory directories:

```typescript
export const MEMORY_PATHS: Record<string, string> = {
  hermes: "/home/delphi/.openclaw/workspace/memory",
  sdr: "/home/delphi/.openclaw/workspace/teams/commercial/sdr/memory",
  "account-executive": "/home/delphi/.openclaw/workspace/teams/commercial/account-executive/memory",
  "account-manager": "/home/delphi/.openclaw/workspace/teams/commercial/account-manager/memory",
  finance: "/home/delphi/.openclaw/workspace/teams/commercial/finance/memory",
  legal: "/home/delphi/.openclaw/workspace/teams/commercial/legal/memory",
  "market-intelligence": "/home/delphi/.openclaw/workspace/teams/commercial/market-intelligence/memory",
  "knowledge-curator": "/home/delphi/.openclaw/workspace/teams/commercial/knowledge-curator/memory",
};
```

## API Route

`src/app/api/memory/route.ts` handles:

| Param | Purpose |
|-------|---------|
| `agent` | Agent slug — resolves to base directory via `MEMORY_PATHS` |
| `path` | Relative path within the memory directory |
| `search` | Optional search query to grep file contents |

### Security
- Auth required (Supabase session)
- Path traversal prevention (reject `..` in paths)
- Only serves files under known `MEMORY_PATHS` directories

## File Operations

The memory browser supports:
- Directory listing (shows files and subdirectories)
- File content reading (returns raw text)
- Search across files (grep-style)

## Agent Memory Structure

Each agent's `memory/` directory is managed by the agent itself. Typical contents:
- Markdown notes and logs
- Session summaries
- Task tracking files
- Knowledge base entries
