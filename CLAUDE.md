# Mission Control — Claude Code Instructions

## What This Project Is

Mission Control is the orchestration dashboard for **Hermes** — a commercial AI agent fleet running on **OpenClaw**. It provides Delphi with live visibility and full control over the agent fleet: pipeline, workflows, comms, costs, sessions, memory, cron, webhooks, and system health.

The app is a **Next.js 16 (App Router) + Supabase** project running on port 9069 on a dedicated Linux machine. It is not publicly hosted.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (PostgreSQL + Auth + SSR) · Recharts · Lucide icons · date-fns · Sonner (toasts) · @dnd-kit

---

## OpenClaw — The Agent Runtime

OpenClaw is a self-hosted multi-channel AI gateway. It is the runtime that all Hermes agents execute within. Installed globally via npm (`openclaw@2026.3.13`), running as a systemd user service (`openclaw-gateway.service`).

**Docs:** https://docs.openclaw.ai/ · **Repo:** https://github.com/openclaw/openclaw · **License:** MIT

### Core Architecture

- **Gateway:** WebSocket control plane on `ws://127.0.0.1:18789`. All agent sessions, cron jobs, and channel messages route through it. Serves a Vite+Lit Control UI on the same port.
- **Channels:** Supports 24+ platforms (Discord, WhatsApp, Telegram, Slack, Signal, iMessage, etc.). This deployment uses **Discord** as the primary channel.
- **Agents:** Multi-agent system with isolated workspaces. Each agent has its own workspace directory, session store, model config, and channel bindings.
- **Sessions:** Conversation state per agent. `dmScope` controls session isolation: `main` (shared), `per-peer`, `per-channel-peer`, `per-account-channel-peer`. Stored in `~/.openclaw/agents/<agentId>/sessions/sessions.json`.
- **Memory:** Plain Markdown memory system. Daily logs (`memory/YYYY-MM-DD.md`), long-term (`MEMORY.md`). Agents have `memory_search` and `memory_get` tools for vector-based semantic search.
- **Context Engine:** Manages system prompt assembly (tooling → safety → skills → workspace → sandbox → runtime), auto-compaction when approaching context limits, and bootstrap injection.
- **Model Failover:** Auth profile rotation, model fallback chains, exponential backoff cooldowns, session stickiness.
- **Sandboxing:** Docker/SSH/OpenShell backends for agent isolation. Modes: off, non-main, all. Scope: session, agent, shared.

### OpenClaw Filesystem Layout

```
~/.openclaw/
├── openclaw.json              ← Gateway config (JSON5, hot reload)
├── cron/
│   ├── jobs.json              ← All 16 scheduled jobs
│   └── runs/                  ← Cron run history (JSONL per job)
├── workspace/                 ← Hermes (main agent) workspace
│   ├── SOUL.md                ← Personality, mission, principles
│   ├── IDENTITY.md            ← Name, role, model, capabilities
│   ├── AGENTS.md              ← Sub-agent roster, playbooks, runbooks, rules
│   ├── TOOLS.md               ← Available tools, channels, integrations
│   ├── USER.md                ← Owner context (Delphi's profile)
│   ├── HEARTBEAT.md           ← Periodic check-in instructions
│   ├── MEMORY.md              ← Synthesized preferences & registries
│   ├── memory/                ← Daily notes + state files
│   ├── playbooks/             ← 7 standing orders (escalation, approvals, etc.)
│   ├── runbooks/              ← 6 reusable procedures
│   └── templates/commercial/  ← 11 output templates
└── workspace/teams/commercial/
    ├── sdr/                   ← SDR agent workspace
    ├── account-executive/     ← AE agent workspace
    ├── account-manager/       ← AM agent workspace
    ├── finance/               ← Finance agent workspace
    ├── legal/                 ← Legal agent workspace
    ├── market-intelligence/   ← MI agent workspace
    └── knowledge-curator/     ← KC agent workspace
```

Each sub-agent workspace has: `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `TOOLS.md`, `USER.md`, `HEARTBEAT.md`, `memory/`

### Workspace Template Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality, mission, principles, behavioral guidelines |
| `IDENTITY.md` | Name, role (director/worker/specialist), model, capabilities |
| `AGENTS.md` | Sub-agent roster, routing rules, playbooks, runbooks, approval gates |
| `TOOLS.md` | Available tools, Discord channels, integrations, rate limits |
| `USER.md` | Owner context — who manages this agent, communication preferences |
| `HEARTBEAT.md` | Periodic check-in: what to review, report format, known issues |
| `BOOT.md` | Regular session startup: context loading, status check |
| `BOOTSTRAP.md` | First-run initialization: what to do upon first activation |
| `MEMORY.md` | Long-term synthesized preferences, registries, distilled patterns |

### OpenClaw CLI — Full Reference

```bash
# Agent management
openclaw agents list                                    # List all agents
openclaw agents add <name>                              # Add new agent
openclaw agents delete <name>                           # Remove agent
openclaw agents bind <agent> <provider>:<channel>       # Bind to Discord channel
openclaw agents unbind <agent> <provider>:<channel>     # Unbind from channel
openclaw agents set-identity <agent> <model>            # Set model
openclaw agents bindings                                # Show all bindings

# Run agent turns (IMPORTANT — this is how Claude Code can talk to Hermes)
openclaw agent --agent main --message "<prompt>" --json   # Send message to Hermes
openclaw agent --agent sdr --message "<prompt>" --json    # Send message to SDR
openclaw agent --agent <id> --message "<msg>" --deliver channel:<discord_channel_id>  # Deliver to Discord
openclaw agent --agent <id> --message "<msg>" --session-id <key>   # Target specific session
openclaw agent --agent <id> --message "<msg>" --thinking           # Enable extended thinking
openclaw agent --agent <id> --message "<msg>" --timeout 120        # Custom timeout (seconds)
openclaw agent --agent <id> --message "<msg>" --local              # Skip channel delivery

# Cron management
openclaw cron list                      # List all scheduled jobs (--json for JSON)
openclaw cron add                       # Add new cron job (interactive)
openclaw cron edit <id>                 # Edit existing job
openclaw cron rm <id>                   # Remove job
openclaw cron run <id>                  # Trigger job immediately
openclaw cron runs [id]                 # View execution history
openclaw cron enable <id>               # Enable job
openclaw cron disable <id>              # Disable job
openclaw cron status                    # Overall cron status

# Sessions
openclaw sessions                       # List sessions
openclaw sessions --all-agents --json   # All agents, JSON format
openclaw sessions --active              # Active sessions only
openclaw sessions cleanup               # Prune old sessions

# Memory
openclaw memory search <query>          # Semantic search across memory files
openclaw memory index                   # Reindex memory files
openclaw memory status                  # Memory system status

# Gateway
openclaw status                         # Full gateway health report
openclaw health                         # Quick health check
openclaw gateway usage-cost             # Token usage and cost report
openclaw gateway run                    # Run gateway in foreground
openclaw gateway install                # Install as system service
openclaw gateway restart                # Restart service

# Configuration
openclaw config get <key>               # Read config value
openclaw config set <key> <value>       # Set config value
openclaw config validate                # Validate config
openclaw configure                      # Interactive setup wizard

# System
openclaw system heartbeat enable/disable/last   # Heartbeat control
openclaw system event <type> --message "<msg>"   # Send system event
openclaw system presence                         # Presence status

# Channels
openclaw channels list                  # List connected channels
openclaw channels status                # Channel health
openclaw channels login <provider>      # Login to channel
openclaw channels logout <provider>     # Logout from channel

# Message operations
openclaw message send <recipient> "<msg>"    # Send message
openclaw message broadcast "<msg>"           # Broadcast to all channels
openclaw message search "<query>"            # Search messages

# Models
openclaw models list                    # Available models
openclaw models status                  # Current model config
openclaw models set <model>             # Set default model
openclaw models auth                    # Auth status
openclaw models fallbacks               # Fallback chain

# Browser automation
openclaw browser open <url>             # Open URL in managed browser
openclaw browser screenshot             # Capture screenshot
openclaw browser navigate <url>         # Navigate
openclaw browser click <selector>       # Click element
openclaw browser fill <selector> <text> # Fill input

# Skills & Plugins
openclaw skills list                    # List available skills
openclaw plugins list                   # List installed plugins
openclaw plugins install <name>         # Install plugin
openclaw plugins enable/disable <name>  # Toggle plugin

# Security & Health
openclaw security audit                 # Security audit
openclaw doctor                         # Health checks + fixes (19 check categories)
openclaw backup create                  # Create local backup
openclaw backup verify                  # Verify backup integrity

# Hooks
openclaw hooks list                     # List active hooks
openclaw hooks enable/disable <name>    # Toggle hook

# Other
openclaw update                         # Update OpenClaw
openclaw dashboard                      # Open Control UI in browser
openclaw tui                            # Terminal UI connected to gateway
openclaw docs <query>                   # Search live docs
openclaw --dev                          # Dev profile (isolated state, port 19001)
openclaw --profile <name>               # Named profile isolation
```

### Cron System

Jobs stored in `~/.openclaw/cron/jobs.json`. Each job has:
- `id` — unique identifier
- `agentId` — which agent runs it (`main` = Hermes)
- `prompt` — instruction sent to the agent
- `schedule` — `{ type: "at"|"every"|"cron", value: "..." }`
- `sessionTarget` — `main` (uses active session) or `isolated` (new parallel session)
- `delivery` — `{ mode: "announce"|"webhook"|"none", channel: "<id>"|"last" }`
- `enabled` — boolean toggle
- `lightweight` — reduced context injection for cost savings
- `modelOverride` / `thinkingOverride` — per-job model/thinking settings

Currently **16 active cron jobs**: 4 healthy (Hermes heartbeats + weekly maintenance), 12 erroring (sub-agent heartbeats missing Discord channel bindings, daily update job).

### Heartbeat vs Cron

- **Heartbeat:** OpenClaw's built-in periodic agent turns (default 30min interval). Configured per-agent. Uses `HEARTBEAT_OK` suppression to skip if no changes. Best for frequent, lightweight monitoring.
- **Cron:** Scheduled jobs with full control over timing, delivery, isolation, and model. Best for daily standups, weekly reviews, specific-time operations.
- Both can coexist. Hermes uses cron for 09:00/12:00/18:00 standups + weekly maintenance. Sub-agents should use cron for heartbeats at specific times.

### Hooks (OpenClaw Agent Hooks)

Event-driven extensibility built into OpenClaw:
- **Internal hooks:** Run within agent session (session-memory, bootstrap-extra-files, command-logger, boot-md)
- **Webhook hooks:** HTTP POST to external endpoints on events
- **Bundled hooks:** `session-memory` (auto-save daily logs), `bootstrap-extra-files` (inject extra files on first run), `command-logger` (log commands), `boot-md` (inject BOOT.md on session start)

### Standing Orders & Automation

Agents can have permanent operating authority defined in `AGENTS.md`:
- Pre-approved actions (what agents can do without asking)
- Always-blocked actions (what agents can never do)
- Escalation triggers (when to escalate to Hermes or Boss)
- Execute-Verify-Report pattern for autonomous operations

### Key Gateway Config (`openclaw.json`)

- Port: 18789 (local loopback only)
- Default model: `claude-sonnet-4-6`
- Sub-agent model: `claude-haiku-4-5-20251001`
- Timezone: `Europe/Lisbon` (WET/WEST)
- Discord: Primary channel, bot logged in
- Hot reload: Config changes take effect without restart
- **Gotcha:** Never let agents edit `openclaw.json` by describing changes — always paste exact JSON. Run `openclaw doctor` after any config change to validate.

### Config Examples (openclaw.json)

```json5
{
  // Agent defaults
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      contextTokens: 200000,
      heartbeat: { every: "1h", lightContext: true, isolatedSession: true },
      subagents: { model: "anthropic/claude-haiku-4-5-20251001", maxConcurrent: 8 }
    },
    list: [
      { id: "researcher", model: { primary: "anthropic/claude-haiku-4-5-20251001" } }
    ]
  },
  // Cron config
  cron: {
    enabled: true,
    maxConcurrentRuns: 1,
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 }
  },
  // Session management
  sessions: {
    dmScope: "main",
    dailyReset: "04:00",
    maintenance: { maxAge: "30d", maxEntries: 500, mode: "enforce" }
  },
  // Token optimization
  thinking: { type: "disabled" },  // for cost savings on routine tasks
  contextTokens: 200000
}
```

### Cron Job JSON Schema (Full)

```json
{
  "id": "unique-id",
  "name": "Human-readable name",
  "agentId": "main",
  "schedule": { "kind": "cron", "expr": "0 9 * * 1-5", "tz": "Europe/Lisbon" },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "The prompt sent to the agent",
    "lightContext": true,
    "model": "anthropic/claude-haiku-4-5-20251001",
    "thinking": { "type": "disabled" }
  },
  "delivery": {
    "mode": "announce",
    "channel": "discord",
    "to": "channel:1477060385596248134"
  },
  "enabled": true,
  "deleteAfterRun": false
}
```

**Schedule kinds:** `at` (one-shot ISO 8601), `every` (interval ms or "30m"), `cron` (5-field with timezone)
**Session targets:** `main` (heartbeat queue), `isolated` (dedicated session), `current`, custom key
**Delivery modes:** `announce` (channel), `webhook` (HTTP POST), `none` (silent)
**Retry:** One-shot: 3 retries with backoff. Recurring: exponential backoff 30s→60m, stays enabled.

### Token Optimization — 8-Layer Stack

Reduce costs from ~$150/month to ~$10/month:

1. **Disable thinking** for routine tasks: `{ thinking: { type: "disabled" } }`
2. **Cap context window:** `{ contextTokens: 50000 }`
3. **Model routing:** Default Haiku, Sonnet only for complex reasoning
4. **Session discipline:** `/compact` regularly, prune old sessions
5. **Lean session init:** Only load SOUL.md, USER.md, IDENTITY.md, today's memory
6. **Cheap heartbeats:** `lightContext: true` + `isolatedSession: true`
7. **Prompt caching:** Automatic with Anthropic API
8. **Subagent isolation:** Cheaper models, limited context for sub-agents

### Subagent Constraints (Critical Knowledge)

- Sub-agents only receive **AGENTS.md + TOOLS.md** — no SOUL, IDENTITY, USER, MEMORY
- Don't get session tools by default
- Concurrency: 8 max simultaneous, 5 active children per session
- Auto-archived after 60 minutes
- Nesting depth: main (0) → orchestrator (1) → worker (2, max)
- Each sub-agent has its own context and token usage — use cheaper models

### Session Management

- Session key format: `agent:<agentId>:<mainKey>`
- Daily reset: 4:00 AM local gateway time
- Auto-pruning: 30 days max age, 500 entries max per agent
- Storage: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- CLI: `openclaw sessions --json`, `openclaw sessions cleanup`
- In-chat: `/status`, `/context list`, `/new`, `/reset`, `/compact`

### Memory Architecture

**Two layers:**
- `memory/YYYY-MM-DD.md` — daily append-only logs, loaded at session start
- `MEMORY.md` — curated long-term memory, takes precedence over daily logs

**Auto-flush:** Before context compaction, system triggers silent turn to save durable memories (activates at 4,000 tokens before compaction reserve).

**Vector search:** `memory_search` tool uses hybrid BM25 + vector search with semantic recall. Supports OpenAI, Gemini, Voyage, Mistral, Ollama embeddings.

**Best practice:** Write to files, don't rely on context. `memory_search()` on demand, don't load entire MEMORY.md.

---

## Claude Code ↔ OpenClaw Integration

Claude Code can directly interact with the OpenClaw agent fleet. This is a key capability.

### Talking to Agents

Send messages to any agent and get responses:
```bash
# Talk to Hermes (the director)
openclaw agent --agent main --message "What's the pipeline status?" --json

# Talk to a sub-agent
openclaw agent --agent sdr --message "Research company X" --json

# With timeout (default 60s, extend for complex tasks)
openclaw agent --agent main --message "Generate weekly report" --json --timeout 120

# Deliver response to Discord channel
openclaw agent --agent main --message "Post standup" --deliver channel:1477060385596248134
```

The `--json` flag returns structured output: `{ response, runId, sessionKey, ... }`.

### Claude Code Hooks for OpenClaw

Claude Code hooks can automate OpenClaw interactions. Define in `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "echo 'File changed' >> /tmp/claude-changes.log"
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/notify-hermes.sh"
        }]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": ".claude/hooks/load-fleet-context.sh"
        }]
      }
    ]
  }
}
```

**Hook events relevant to this project:**

| Event | Use case |
|-------|----------|
| `SessionStart` | Inject fleet status, pipeline state, active alerts |
| `PreToolUse` | Validate commands before execution, block dangerous ops |
| `PostToolUse` | Auto-lint after file edits, log changes |
| `Stop` | Notify Hermes of completed work, run build check |
| `UserPromptSubmit` | Transform prompts, add context |

**Hook types:**
- `command` — shell script, receives JSON on stdin, exit 0 = allow, exit 2 = block
- `http` — POST to URL endpoint
- `prompt` — single-turn LLM evaluation
- `agent` — multi-turn subagent with tool access

### Claude Code Skills for OpenClaw

Skills are `SKILL.md` files that extend Claude Code with reusable procedures. Located in `.claude/skills/`.

**Dynamic context injection** with `!`command`` syntax:
```markdown
Current fleet status:
!`openclaw agents list 2>/dev/null`

Active cron jobs:
!`openclaw cron list 2>/dev/null | head -20`
```

### Claude Code Sub-agents for OpenClaw

Custom subagents in `.claude/agents/` can specialize in fleet operations:
- Read-only fleet monitor agent
- Deployment agent with restricted tools
- Debug agent with persistent memory

Subagent frontmatter supports: `tools`, `model`, `permissionMode`, `maxTurns`, `hooks`, `memory`, `isolation: worktree`.

---

## Agent Fleet — Hermes Commercial

8 agents managed by OpenClaw. Hermes is the director; 7 sub-agents handle specialized domains.

| Slug | Name | Type | Model | Status |
|------|------|------|-------|--------|
| hermes (main) | Hermes 🪶 | director | claude-sonnet-4-6 | **active** |
| sdr | SDR 🔍 | worker | claude-sonnet-4-6 | idle (calibrating) |
| account-executive | AE 📈 | worker | claude-sonnet-4-6 | idle |
| account-manager | AM 💚 | worker | claude-sonnet-4-6 | idle |
| finance | Finance 💰 | specialist | claude-haiku-4-5-20251001 | framework defined |
| legal | Legal ⚖️ | specialist | claude-sonnet-4-6 | framework defined |
| market-intelligence | MI 🔍 | specialist | claude-haiku-4-5-20251001 | framework defined |
| knowledge-curator | KC 📚 | specialist | claude-sonnet-4-6 | framework defined |

### Hermes — Commercial Director

- **Role:** AI Commercial Director — strategist, operator, closer
- **Personality:** Direct, opinionated, resourceful. Not an assistant — a department head
- **Owns:** Full commercial results (pipeline, revenue, team coordination)
- **Commands:** 7 sub-agents, reviews all output before it moves forward
- **Escalates to:** Boss (Delphi/Pedro) on major decisions, external contact, financial commitments
- **Daily rhythm:** 09:00 standup → 12:00 midday update → 18:00 afternoon update to `#hermes-chat`
- **Workspace:** `~/.openclaw/workspace/` with playbooks, runbooks, templates

### Pipeline Workflow

```
Prospecting → Qualification (SDR, BANT checklist)
  → Initial Contact (AE outreach, approved by Hermes)
  → Demo/Meeting (AE discovery, MEDDIC assessment)
  → Proposal (sequential gates: ATLAS estimate → Legal → Finance → Hermes → Boss approval)
  → Negotiation (AE handles, escalates pricing to Finance/Hermes)
  → Closed Won / Lost / Disqualified (human decision only)
```

### Discord Channels (26 total)

Key channels:
- `#hermes-chat` — Direct Boss conversation
- `#pipeline` — Sales pipeline status
- `#approvals` — Blocked actions requiring Boss approval (✅ = approved)
- `#daily-standup` — 09:00 cross-department standup
- `#weekly-review` — Friday weekly review
- `#hermes-logs` — Automatic activity logs

### Agent Authority Model

- **Pre-approved:** Read/write workspace, git ops, cron management, Discord posting to designated channels, memory synthesis
- **Must request approval:** External contact, outbound communication, financial commitments
- **Never allowed:** Direct prospect contact (SDR), unilateral pricing (AE), marking won/lost (agents — human only)
- **Approval format:** URGENCY → ACTION → RECIPIENT → CONTEXT → DRAFT → RISKS → ALTERNATIVES → RISK_IF_DELAYED

---

## Architecture

```
src/
├── app/
│   ├── (app)/              ← Protected routes (require auth)
│   │   ├── command/          ← Primary command interface (Quick Actions + Hermes Chat + Recent Ops)
│   │   ├── operations/       ← Operations list + detail view
│   │   ├── pipeline/         ← Kanban board (11 stages, drag-drop) + lead detail
│   │   ├── fleet/            ← Agent grid + topology visualizer + Hermes chat
│   │   ├── agents/           ← Agent list, detail, soul editor
│   │   ├── sessions/         ← Live session monitor (OpenClaw CLI)
│   │   ├── costs/            ← Token/cost dashboard (cron runs + live sessions)
│   │   ├── logs/             ← Unified log viewer (journalctl + Supabase)
│   │   ├── cron/             ← Scheduler UI (OpenClaw cron)
│   │   ├── memory/           ← Memory file browser (filesystem API)
│   │   ├── webhooks/         ← Webhook CRUD + delivery history
│   │   ├── alerts/           ← Alert rules + events
│   │   ├── templates/        ← Outreach message templates
│   │   ├── audit-log/        ← Immutable audit trail
│   │   ├── gateway/          ← Gateway config viewer
│   │   ├── integrations/     ← Third-party connections
│   │   ├── settings/         ← App settings (account, scheduler, agents, retention)
│   │   └── office/           ← Topology visualizer (standalone)
│   ├── (auth)/             ← Login page + server actions
│   ├── api/
│   │   ├── command/send      ← Send message to Hermes via OpenClaw CLI
│   │   ├── agent/pipeline    ← Pipeline lead CRUD (agent Bearer token auth)
│   │   ├── agent/notify      ← Human-triggered contextual prompt to Hermes
│   │   ├── agents/[id]/      ← workspace, soul, heartbeat, comms endpoints
│   │   ├── pipeline/funnel   ← Lead counts per stage
│   │   ├── review-queue/     ← Human review stage gate
│   │   ├── daily-targets     ← Daily pipeline KPIs
│   │   ├── templates/        ← Template CRUD
│   │   ├── sequences/        ← Outreach sequences per lead
│   │   ├── webhooks/         ← Webhook CRUD + test + deliveries
│   │   ├── war-rooms         ← Operations/war room CRUD
│   │   ├── memory            ← Filesystem memory access
│   │   ├── logs/journal      ← journalctl output
│   │   ├── integrations      ← Integration CRUD
│   │   ├── status            ← System health
│   │   └── search            ← Full-text search (agents + leads)
│   └── layout.tsx
├── components/
│   ├── ui/                 ← shadcn/ui primitives (do not edit)
│   ├── sidebar.tsx           ← Desktop sidebar + mobile bottom nav (4 groups: Operate/Monitor/Configure/Admin)
│   ├── command-palette.tsx   ← Cmd+K global search
│   ├── realtime-refresh.tsx  ← Supabase realtime → router.refresh()
│   └── status-badge.tsx      ← 50+ status strings → color-coded badges
├── lib/
│   ├── supabase/
│   │   ├── client.ts       ← Browser client (Client Components)
│   │   ├── server.ts       ← Server client (Server Components + API routes)
│   │   └── admin.ts        ← Admin client (service role, bypasses RLS)
│   ├── database.types.ts   ← Generated from Supabase schema (do not edit)
│   ├── types.ts            ← Type aliases + pipeline stage constants
│   ├── schemas.ts          ← Zod validation schemas
│   ├── memory-paths.ts     ← Agent slug → filesystem memory directory mapping
│   ├── model-costs.ts      ← Token cost constants per model
│   ├── agent-auth.ts       ← Bearer token validation (constant-time comparison)
│   ├── pagination.ts       ← Cursor-based pagination helpers
│   └── utils.ts            ← cn() class name merger
└── middleware.ts            ← Auth guard (redirects unauthenticated → /login)
```

### Data Source Architecture

Mission Control has **dual data sources** — Supabase for structured data, OpenClaw/filesystem for runtime state:

| Page | Primary Source | Method |
|------|---------------|--------|
| Command, Operations, Pipeline, Fleet, Templates | Supabase | Server Component queries |
| Sessions | OpenClaw CLI | `openclaw sessions --all-agents --json` |
| Costs | Filesystem + CLI | `~/.openclaw/cron/runs/*.jsonl` + live sessions |
| Memory | Filesystem API | `/api/memory` → `~/.openclaw/workspace/*/memory/` |
| Cron | OpenClaw CLI | `openclaw cron list --json` |
| Gateway | Gateway HTTP | `localhost:18789` (serves Control UI SPA) |
| Logs | journalctl + Supabase | System logs from journald + `agent_logs` table |
| Workspace files | Filesystem API | `/api/agents/[id]/workspace` → reads/writes .md files |

### Command Execution Flow

```
User → Command page Quick Action or Chat
  → POST /api/command/send { message }
  → execFile("openclaw", ["agent", "--agent", "main", "--message", prompt, "--json"])
  → OpenClaw runs Hermes agent turn
  → Response logged to war_room_activity (singleton "chat" war room)
  → Realtime subscription updates UI
```

---

## Database Schema

35 tables across 9 domains. All tables have UUID primary keys, `created_at`, and RLS enabled.

**Core:** agents · agent_reports · agent_logs · agent_souls · agent_comms · heartbeats
**Pipeline:** pipeline_leads · outreach_sequences · outreach_templates · daily_targets · review_queue
**Orchestration:** war_rooms · war_room_agents · war_room_activity · workflows · pipeline_runs · scheduled_tasks · standup_reports
**Team:** team_topology · agent_pools · fleet_experiments
**Tasks:** projects · tasks · task_comments · task_subscriptions · quality_reviews
**Alerting:** alert_rules · alert_events
**External:** webhooks · webhook_deliveries · integrations · github_issues
**System:** agent_token_usage · audit_log · system_config · notifications

**Pipeline stages (11):** discovery → enrichment → human_review → outreach → engaged → meeting_booked → meeting_completed → proposal_sent → won → lost → disqualified
**Agent restriction:** Agents cannot mark `won` or `lost` — human decision only.

Migrations: `supabase/migrations/` · Seed: `supabase/seed.sql`

---

## Rules — Always Follow

### Supabase access pattern
- Server Components and Route Handlers: `createClient()` from `@/lib/supabase/server`
- Client Components (`"use client"`): `createClient()` from `@/lib/supabase/client`
- Agent API routes (Bearer token auth): `createAdminClient()` from `@/lib/supabase/admin`
- Never cross the boundary — server client stays server-side, browser client stays client-side

### Data fetching
- Prefer Server Components — no loading states, no useEffect, no client-side fetching unless realtime needed
- `Promise.all()` for parallel queries on the same page
- Always handle `.error` — never assume success
- `?? []` or `?? null` fallbacks on `.data`

### TypeScript
- Strict mode — no `any`, no unnecessary `!` non-null assertions
- Use generated `Database` type from `@/lib/database.types.ts`

### Components
- Functional components only — no class components
- shadcn/ui primitives from `@/components/ui/` — do not modify
- New shared components in `src/components/`
- Page-specific components in `src/app/(app)/<page>/_components/`

### Styling
- Tailwind CSS v4 only — no inline styles, no CSS modules
- Dark theme only — zinc palette
- `zinc-950` bg · `zinc-900` cards · `zinc-800` borders · `zinc-50` text · `indigo-600` accent
- Status: `emerald` active · `amber` pending · `red` critical · `zinc` offline

### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Never commit `.env.local`
- Never bypass Row-Level Security from Client Components
- Shell commands: always `execFile()` (never `exec()`) — prevents injection
- Filesystem access: always `normalize()` + prefix check — prevents directory traversal
- Agent API: Bearer token with constant-time comparison (`timingSafeEqual`)

### OpenClaw integration
- Route Handlers → OpenClaw CLI: `execFile("openclaw", [...args])` with auth check
- Route Handlers → OpenClaw files: validate paths, prevent directory traversal
- Route Handlers → Gateway: `fetch("http://127.0.0.1:18789/...")` — local only
- Never call OpenClaw gateway from client-side code — always via API route
- Never hardcode workspace paths — use `MEMORY_PATHS` from `src/lib/memory-paths.ts`

---

## What Never To Do

- Do not modify `src/lib/database.types.ts` manually
- Do not add `"use client"` without genuine need for browser APIs or interactivity
- Do not write raw SQL in application code — use the Supabase client query builder
- Do not create new database tables without a migration file
- Do not expose PII in shared log output
- Do not use `exec()` for shell commands — always `execFile()`
- Do not hardcode agent workspace paths — use `MEMORY_PATHS`
- Do not call OpenClaw gateway from client-side code — always via API route

---

## Running the Project

```bash
npm run dev          # starts on port 9069

# Mission Control service
systemctl --user status command-center
systemctl --user restart command-center
journalctl --user -u command-center -f

# OpenClaw gateway (NOTE: service name is openclaw-gateway.service)
systemctl --user status openclaw-gateway
systemctl --user restart openclaw-gateway
journalctl --user -u openclaw-gateway -f

# OpenClaw CLI
openclaw agents list
openclaw cron list
openclaw status
openclaw agent --agent main --message "status" --json

# After schema changes
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## Build — Important

`NEXT_PUBLIC_*` env vars are **baked at build time**:
```bash
set -a && source .env.local && set +a && npm run build
```
The `env` block in `next.config.ts` passes `NEXT_PUBLIC_*` vars explicitly for Turbopack.
Server-side code reads non-prefixed `SUPABASE_URL` / `SUPABASE_ANON_KEY` as runtime fallbacks.

## Migrations — How to Apply

Use Node.js `pg` script with explicit credentials (password has special chars `*`, `.`, `#`):
```bash
# See memory for exact credentials
# After applying: regenerate types
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

---

## HERMES Guide — Current-State Document

`docs/HERMES.md` is a current-state reference that explains Mission Control to Hermes. Every section describes how things work **right now**. There is no changelog.

After every implementation session, **update the relevant sections** of `docs/HERMES.md` to reflect changes. Keep every section accurate.

## Session Completion Protocol — MANDATORY

1. Build passes — `next build` zero errors
2. HERMES.md updated — reflect any changes
3. Git commit + push
4. Service restart if code changed — `systemctl --user restart command-center`

---

## Active Spec — V9

V9 introduced the Command/Operations/Fleet page structure:
- **Command:** Quick Actions + Hermes Chat + Recent Operations
- **Operations:** War room list with status groups + detail view with activity timeline
- **Fleet:** Grid/Topology toggle with agent cards and hub-and-spoke network diagram
- Pipeline as standalone Kanban with 11 stages
- 8 agents backed by OpenClaw runtime
- Dual data sources: Supabase (structured) + OpenClaw (runtime)

---

## OpenClaw Documentation & Learning Resources

### Official Documentation
- **Docs index (247 pages):** https://docs.openclaw.ai/llms.txt
- **Full docs dump (LLM-optimized):** https://docs.openclaw.ai/llms-full.txt
- **Bundled docs:** `/home/delphi/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/docs/`
- **GitHub:** https://github.com/openclaw/openclaw

### Key Documentation Pages
| Topic | URL |
|-------|-----|
| Configuration reference | https://docs.openclaw.ai/gateway/configuration-reference |
| Cron jobs | https://docs.openclaw.ai/automation/cron-jobs |
| Multi-agent routing | https://docs.openclaw.ai/concepts/multi-agent |
| Agent workspace | https://docs.openclaw.ai/concepts/agent-workspace |
| Memory system | https://docs.openclaw.ai/concepts/memory |
| Sessions | https://docs.openclaw.ai/concepts/session |
| Heartbeat | https://docs.openclaw.ai/gateway/heartbeat |
| Standing orders | https://docs.openclaw.ai/automation/standing-orders |
| Sub-agents | https://docs.openclaw.ai/tools/subagents |
| Security | https://docs.openclaw.ai/gateway/security/index |
| Troubleshooting | https://docs.openclaw.ai/gateway/troubleshooting |
| FAQ | https://docs.openclaw.ai/help/faq |
| Discord channel | https://docs.openclaw.ai/channels/discord |
| Sandboxing | https://docs.openclaw.ai/gateway/sandboxing |
| Context engine | https://docs.openclaw.ai/concepts/context-engine |
| Hooks (OpenClaw) | https://docs.openclaw.ai/automation/hooks |

### Masterclass Reference
- **Masterclass prompts:** https://masterclass-prompts.netlify.app/
- **Patterns extracted in:** `.claude/skills/openclaw-docs/masterclass-prompts.md`
- **Deep reference in:** `.claude/skills/openclaw-docs/openclaw-reference.md`

### .claude/ Toolkit

| Type | Name | Purpose |
|------|------|---------|
| Skill | `/fleet-status` | Live fleet health check — agents, sessions, cron, services |
| Skill | `/hermes <msg>` | Talk to Hermes directly via OpenClaw CLI |
| Skill | `/openclaw-docs <topic>` | Look up OpenClaw docs (local + online) |
| Skill | `/deploy` | Build + restart Command Center service |
| Skill | `/agent-workspace <agent>` | Read/edit agent workspace files |
| Skill | `/cron-manage` | View/create/edit/debug cron jobs |
| Agent | `@openclaw-explorer` | Read-only research agent for OpenClaw |
| Agent | `@fleet-doctor` | Diagnose + fix fleet problems |
| Hook | `load-fleet-context.sh` | Auto-inject fleet status on session start |
| Hook | `notify-complete.sh` | Desktop notification on task completion |
| Rule | `openclaw-patterns.md` | CLI patterns, service names, model costs |
| Rule | `session-protocol.md` | Session completion checklist |
