# OpenClaw Deep Reference — For Claude Code

This file is loaded by the `/openclaw-docs` skill to provide deep OpenClaw knowledge without needing to fetch docs every time.

## Configuration Reference (openclaw.json)

JSON5 format, hot-reloads on change. All fields optional — safe defaults when omitted.

### Key Config Sections

**Agents:**
```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      contextTokens: 200000,
      heartbeat: { every: "1h", lightContext: true },
      subagents: { model: "anthropic/claude-haiku-4-5-20251001", maxConcurrent: 8 }
    },
    list: [
      { id: "researcher", model: { primary: "anthropic/claude-haiku-4-5-20251001" } },
      { id: "coder", subagents: { allowAgents: ["researcher"] } }
    ]
  }
}
```

**Cron:**
```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 }
  }
}
```

**Session Management:**
```json5
{
  sessions: {
    dmScope: "main",              // or per-peer, per-channel-peer, per-account-channel-peer
    dailyReset: "04:00",          // local gateway time
    maintenance: { maxAge: "30d", maxEntries: 500, mode: "enforce" }
  }
}
```

**Thinking:**
```json5
{
  thinking: { type: "disabled" }  // or "enabled" with budget
}
```

**Context:**
```json5
{
  contextTokens: 50000  // cap context window for cost savings
}
```

**Tools:**
```json5
{
  tools: {
    profiles: { allow: ["read", "exec", "write", "edit", "apply_patch", "process"] },
    subagents: { tools: { allow: ["read", "exec", "process", "write", "edit"] } }
  }
}
```

## Cron Job JSON Schema

```json
{
  "id": "unique-id",
  "name": "Human-readable name",
  "agentId": "main",
  "schedule": {
    "kind": "cron",        // or "at", "every"
    "expr": "0 9 * * 1-5", // cron: 5-field expression
    "tz": "Europe/Lisbon"  // IANA timezone
  },
  "sessionTarget": "main",    // or "isolated", "current", custom session key
  "payload": {
    "kind": "agentTurn",       // or "systemEvent"
    "message": "The prompt",
    "lightContext": true,       // reduce bootstrap for cost
    "model": "anthropic/claude-haiku-4-5-20251001",  // optional override
    "thinking": { "type": "disabled" }                // optional override
  },
  "delivery": {
    "mode": "announce",        // or "webhook", "none"
    "channel": "discord",
    "to": "channel:1477060385596248134"
  },
  "enabled": true,
  "deleteAfterRun": false      // true for one-shot jobs
}
```

**Schedule types:**
- `at`: One-shot ISO 8601 timestamp
- `every`: Interval in ms (or string like "30m", "2h")
- `cron`: 5-field or 6-field cron expression with optional timezone

**Session targets:**
- `main`: Enqueues as system event, runs during next heartbeat
- `isolated`: Dedicated agent turn in `cron:<jobId>` session
- `current`: Binds to session where job was created
- Custom key: Persistent named session maintaining context across runs

**Retry policy:**
- One-shot: 3 retries with exponential backoff, permanent errors disable
- Recurring: Exponential backoff (30s → 1m → 5m → 15m → 60m), stays enabled

## Multi-Agent Architecture

Each agent has:
- Dedicated workspace (SOUL.md, AGENTS.md, TOOLS.md, etc.)
- Isolated `agentDir` for auth/config at `~/.openclaw/agents/<agentId>/`
- Separate session storage at `~/.openclaw/agents/<agentId>/sessions/`

**Routing hierarchy** (deterministic, specificity-based):
1. Direct message/group matching (most specific wins)
2. Thread inheritance
3. Discord role-based routing
4. Guild/team matching
5. Account-level matching
6. Fallback to default agent

**Subagent constraints:**
- Only receive AGENTS.md + TOOLS.md (no SOUL, IDENTITY, USER, MEMORY)
- Don't get session tools by default
- Concurrency default: 8 simultaneous, 5 active children per session
- Auto-archived after 60 minutes
- Nesting: main (depth 0) → orchestrator (depth 1) → worker (depth 2, max)

## Memory System

**Two layers:**
- `memory/YYYY-MM-DD.md` — daily append-only logs, read at session start
- `MEMORY.md` — curated long-term memory, takes precedence

**Memory tools available to agents:**
- `memory_search` — semantic recall over indexed snippets (vector + BM25 hybrid)
- `memory_get` — targeted file/line range reads

**Auto-flush:** Before compaction, system triggers silent turn to save durable memories.

**Vector search:** Supports OpenAI, Gemini, Voyage, Mistral, Ollama embeddings. Hybrid BM25 + vector with MMR diversity re-ranking and temporal decay.

## Heartbeat System

Periodic agent turns in main session. Default: 30min (1h with OAuth).

```json5
{
  heartbeat: {
    every: "1h",
    target: "last",           // send to most recent contact
    lightContext: true,        // only load HEARTBEAT.md
    isolatedSession: true      // dramatically reduces token costs
  }
}
```

**HEARTBEAT_OK:** When agent finds nothing urgent, returns this token. System strips it from replies to prevent unnecessary notifications.

**Cost optimization:** `isolatedSession: true` + `lightContext: true` + small HEARTBEAT.md = minimal token burn.

## Standing Orders

Defined in AGENTS.md. Four required elements:
1. **Scope** — authorized actions
2. **Triggers** — when to execute (schedule, event, condition)
3. **Approval gates** — what needs human sign-off
4. **Escalation rules** — when to ask for help

**Pattern:** Execute → Verify → Report. Never acknowledge without completing.

## Session Management

- Session key format: `agent:<agentId>:<mainKey>`
- Daily reset: 4:00 AM local gateway time
- Pruning: 30 days max age, 500 entries max per agent
- Storage: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: JSONL files
- CLI: `openclaw sessions --json`, `openclaw sessions cleanup`
- In-chat: `/status`, `/context list`, `/new`, `/reset`

## Token Optimization — 8 Layer Stack

1. **Disable thinking:** `{ thinking: { type: "disabled" } }` or `/reasoning off`
2. **Cap context:** `{ contextTokens: 50000 }`
3. **Model routing:** Default Haiku, Sonnet only for complex tasks
4. **Session discipline:** `/status` → `/compact` → `openclaw session new`
5. **Lean init:** Only load SOUL.md, USER.md, IDENTITY.md, today's memory
6. **Cheap heartbeats:** Route to Ollama or Haiku
7. **Prompt caching:** Automatic with Anthropic
8. **Subagent isolation:** Cheaper models, limited context

## SOUL.md Best Practices

- Be genuinely helpful, not performatively helpful
- Skip pleasantries, deliver results
- Express preferences and viewpoints (personality through opinions)
- Be resourceful — attempt before requesting
- Private info stays confidential
- External actions need approval, internal ones allow autonomy
- Never send incomplete responses to messaging platforms

## AGENTS.md Best Practices

- Memory is limited — write to files, don't rely on context
- Two-tiered memory: daily logs + curated MEMORY.md
- Group chat: respond when addressed or adding value, use reactions
- Restricted: sending external comms, destructive operations
- Heartbeat polls: check email/calendar/notifications 2-4x daily
- Quiet hours: 23:00–08:00

## Online Documentation Index

Full docs: https://docs.openclaw.ai/llms.txt (247 pages)
Key pages:
- Configuration: /gateway/configuration-reference
- Cron: /automation/cron-jobs
- Multi-agent: /concepts/multi-agent
- Memory: /concepts/memory
- Sessions: /concepts/session
- Heartbeat: /gateway/heartbeat
- Agent command: /cli/agent
- Standing orders: /automation/standing-orders
- Subagents: /tools/subagents
- Security: /gateway/security/index
- Troubleshooting: /gateway/troubleshooting
- FAQ: /help/faq
