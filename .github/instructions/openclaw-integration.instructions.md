---
applyTo: "src/app/api/**,src/app/(app)/cron/**,src/app/(app)/memory/**,src/app/(app)/sessions/**,src/app/(app)/gateway/**"
---

# OpenClaw Integration Instructions

## Data Source Rules

Mission Control has dual data sources. Know which pages read from which:

| Feature | Source | Access Pattern |
|---------|--------|---------------|
| Agents, Tasks, Dashboard | Supabase | Query builder |
| Sessions | OpenClaw CLI | `execFile("openclaw", ["sessions", "--all-agents", "--json"])` |
| Memory | Filesystem | Route Handler reads `~/.openclaw/workspace/` |
| Cron | OpenClaw CLI | `execFile("openclaw", ["cron", "list", "--json"])` via Route Handler |
| Gateway Config | Gateway SPA | Port 18789 serves dashboard SPA, no REST API |

## Agent Workspace Paths

Never hardcode paths in components. Use `MEMORY_PATHS` from `src/lib/memory-paths.ts`:

```typescript
import { MEMORY_PATHS } from "@/lib/memory-paths";
const memoryDir = MEMORY_PATHS["hermes"]; // resolves to real filesystem path
```

## OpenClaw CLI via Route Handlers

```typescript
import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);

// List cron jobs
const { stdout } = await execFileAsync("openclaw", ["cron", "list", "--json"]);
const jobs = JSON.parse(stdout);

// Trigger a cron job
await execFileAsync("openclaw", ["cron", "run", jobId]);

// List agents
const { stdout: agentOut } = await execFileAsync("openclaw", ["agents", "list", "--json"]);
```

## Gateway WebSocket

Gateway runs on `ws://127.0.0.1:18789`. REST endpoints:
- `GET /config` — gateway configuration
- `GET /sessions` — active sessions
- `GET /status` — health check

Always access via Next.js API routes — never from client-side JavaScript.

## Filesystem Security

When reading files from agent workspaces:
- Resolve the real path and ensure it starts with the expected base directory
- Reject paths containing `..`
- Only read from known `MEMORY_PATHS` base directories
