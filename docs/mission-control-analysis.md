# Mission Control — Deep Repository Analysis

**Repository:** [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control)
**License:** MIT | **Stars:** 1.6k | **Forks:** 233 | **Language:** TypeScript (97.5%)
**Current Version:** 1.3.0 (2026-03-02) | **First Release:** 1.0.0 (2026-02-15)
**Status:** Alpha — under active development

---

## What It Is

Mission Control is an **open-source dashboard for AI agent orchestration**. It lets you manage agent fleets, track tasks, monitor costs, and orchestrate workflows from a single UI. It's designed around the [OpenClaw](https://github.com/builderz-labs) agent gateway but is moving toward being gateway-agnostic.

**Key differentiator:** Zero external dependencies — it uses **SQLite** (not Postgres/Redis), runs with a single `pnpm start`, and requires no Docker to operate.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **UI** | React 19.0.1 + Tailwind CSS 3.4 |
| **Language** | TypeScript 5.7 (strict mode) |
| **Database** | SQLite via better-sqlite3 (WAL mode) |
| **State** | Zustand 5 |
| **Charts** | Recharts 3 |
| **Real-time** | WebSocket (ws) + Server-Sent Events (SSE) |
| **Auth** | scrypt hashing, session cookies, RBAC (3 roles) |
| **Validation** | Zod 4 |
| **Logging** | pino (structured) |
| **Testing** | Vitest (unit) + Playwright (148+ E2E tests) |
| **Deployment** | Docker + docker-compose, or bare pnpm |

---

## Full Directory Structure

```
mission-control/
├── .github/                  # CI workflows, issue templates
├── docs/
│   ├── cli-integration.md    # Direct CLI tool connection guide
│   ├── deployment.md         # Deployment documentation
│   └── mission-control.jpg   # Logo/banner image
├── ops/                      # Operations/deployment configs
├── scripts/
│   ├── heartbeat-monitor.ts  # Agent status checker
│   ├── notification-daemon.ts # Notification processor
│   └── (E2E utilities)
├── tests/                    # 28 Playwright E2E specs (see Testing section)
│   ├── fixtures/openclaw/    # Offline harness test data
│   └── helpers.ts            # Factory functions, cleanup utilities
│
├── src/
│   ├── proxy.ts              # Auth gate + CSRF + host allowlist + rate limiting
│   ├── index.ts              # Entry point
│   ├── live-feed.tsx         # Live activity component
│   ├── nav-rail.tsx          # Navigation sidebar
│   ├── page.tsx              # Home page
│   │
│   ├── app/
│   │   ├── [[...panel]]/     # Dynamic catch-all routing (SPA panel system)
│   │   ├── login/page.tsx    # Login page
│   │   ├── docs/             # OpenAPI documentation (Scalar UI)
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   └── api/              # 38 route groups → 66+ REST endpoints
│   │       ├── activities/
│   │       ├── agents/       # CRUD, heartbeat, wake, sync, SOUL, comms, messaging
│   │       ├── alerts/
│   │       ├── audit/
│   │       ├── auth/         # Login, logout, Google SSO, access requests
│   │       ├── backup/
│   │       ├── chat/         # Conversations + messages
│   │       ├── claude/sessions/  # Claude Code session discovery
│   │       ├── cleanup/
│   │       ├── connect/      # Direct CLI integration
│   │       ├── cron/
│   │       ├── docs/         # OpenAPI spec
│   │       ├── events/       # SSE stream
│   │       ├── export/
│   │       ├── gateway-config/
│   │       ├── gateways/
│   │       ├── github/       # Issues inbound sync
│   │       ├── integrations/
│   │       ├── logs/
│   │       ├── memory/
│   │       ├── mentions/
│   │       ├── notifications/
│   │       ├── pipelines/
│   │       ├── projects/
│   │       ├── quality-review/
│   │       ├── releases/check/
│   │       ├── scheduler/
│   │       ├── search/
│   │       ├── sessions/
│   │       ├── settings/
│   │       ├── spawn/
│   │       ├── standup/
│   │       ├── status/
│   │       ├── super/
│   │       ├── tasks/        # CRUD, comments, broadcast
│   │       ├── tokens/
│   │       ├── webhooks/     # CRUD, test, retry, deliveries, verify-docs
│   │       └── workflows/
│   │
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── markdown-renderer.tsx
│   │   ├── chat/             # 5 files
│   │   │   ├── chat-panel.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── conversation-list.tsx
│   │   │   ├── message-list.tsx
│   │   │   └── message-bubble.tsx
│   │   ├── dashboard/        # 5 files
│   │   │   ├── dashboard.tsx
│   │   │   ├── stats-grid.tsx
│   │   │   ├── agent-network.tsx
│   │   │   ├── sessions-list.tsx
│   │   │   └── sidebar.tsx
│   │   ├── hud/              # Heads-up display components
│   │   ├── layout/           # 6 files
│   │   │   ├── header-bar.tsx
│   │   │   ├── nav-rail.tsx
│   │   │   ├── live-feed.tsx
│   │   │   ├── update-banner.tsx
│   │   │   ├── local-mode-banner.tsx
│   │   │   └── promo-banner.tsx
│   │   ├── panels/           # 29 feature panels (see Panels section)
│   │   └── ui/               # 4 atomic UI primitives
│   │
│   ├── lib/                  # 38 core modules
│   │   ├── __tests__/        # 8 unit test files
│   │   │
│   │   │ # Database
│   │   ├── db.ts             # SQLite singleton (WAL, FK, prepared statements)
│   │   ├── migrations.ts     # 21 incremental schema migrations
│   │   ├── schema.sql        # Complete schema definition
│   │   │
│   │   │ # Auth & Security
│   │   ├── auth.ts           # Session + API key auth, RBAC, user CRUD
│   │   ├── password.ts       # scrypt hashing, 12-char minimum
│   │   ├── session-cookie.ts # Cookie management (7-day expiry)
│   │   ├── sessions.ts       # Session lifecycle
│   │   ├── google-auth.ts    # Google OAuth integration
│   │   ├── rate-limit.ts     # Rate limiting with trusted proxy support
│   │   ├── device-identity.ts # Ed25519 device signing for gateway auth
│   │   │
│   │   │ # Real-time & Events
│   │   ├── websocket.ts      # Gateway WebSocket client (auto-reconnect, heartbeat)
│   │   ├── event-bus.ts      # Internal pub/sub event system
│   │   ├── use-server-events.ts  # React hook for SSE subscription
│   │   ├── use-smart-poll.ts     # React hook for intelligent polling
│   │   │
│   │   │ # Integrations
│   │   ├── webhooks.ts       # HMAC-SHA256, retry with backoff, circuit breaker
│   │   ├── github.ts         # GitHub API integration
│   │   ├── agent-sync.ts     # OpenClaw config → database sync
│   │   ├── provisioner-client.ts  # Workspace provisioning
│   │   ├── claude-sessions.ts     # Claude Code session auto-discovery
│   │   │
│   │   │ # Agent System
│   │   ├── agent-templates.ts # Template definitions
│   │   ├── command.ts         # Command processing
│   │   ├── mentions.ts        # @mention parsing and validation
│   │   │
│   │   │ # Scheduling
│   │   ├── scheduler.ts      # Background task scheduler (5 tasks, 60s tick)
│   │   ├── cron-occurrences.ts # Cron expression parsing
│   │   │
│   │   │ # Config & Utilities
│   │   ├── config.ts          # App configuration
│   │   ├── paths.ts           # Path resolution
│   │   ├── navigation.ts      # Nav structure
│   │   ├── models.ts          # Data model definitions
│   │   ├── token-pricing.ts   # Model cost calculator
│   │   ├── utils.ts           # General helpers
│   │   ├── validation.ts      # Zod schemas
│   │   ├── version.ts         # Version info
│   │   ├── logger.ts          # pino structured logging
│   │   ├── client-logger.ts   # Client-side logging
│   │   │
│   │   │ # Admin
│   │   ├── super-admin.ts     # Super admin functions
│   │   ├── provider-subscriptions.ts  # Subscription management
│   │   │
│   │   │ # UI Hooks
│   │   └── use-focus-trap.ts  # Accessibility focus trap
│   │
│   ├── store/
│   │   └── index.ts           # Zustand global state (entities, UI, connection)
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── test/                  # Shared test utilities
│
├── # Root config
├── Dockerfile                 # Multi-stage build with healthcheck
├── docker-compose.yml
├── next.config.js             # Turbopack, CSP headers, transpilePackages
├── tsconfig.json              # Strict mode, @/* path alias
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.mjs
├── vitest.config.ts
├── playwright.config.ts       # Default E2E suite
├── playwright.openclaw.gateway.config.ts
├── playwright.openclaw.local.config.ts
├── openapi.json               # OpenAPI 3.1 specification
├── package.json               # v1.3.0, pnpm required
├── .env.example
├── .env.test
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── LICENSE (MIT)
└── README.md
```

---

## Architecture Deep Dive

### SPA Panel System

Unlike traditional multi-page Next.js apps, Mission Control uses a **single catch-all route** (`app/[[...panel]]/`) that renders all 28 panels from one SPA shell. Panel switching is client-side via Zustand state + URL sync. This gives instant panel transitions without page reloads.

### Real-time Architecture

```
┌─────────────┐    WebSocket     ┌──────────────────┐
│  OpenClaw   │◄───────────────►│  Mission Control  │
│  Gateway    │  (agent events)  │   websocket.ts    │
└─────────────┘                  │                   │
                                 │   event-bus.ts    │
┌─────────────┐    SSE           │   (pub/sub)       │
│   Browser   │◄────────────────│                   │
│   (React)   │  /api/events     │   db.ts           │
│             │                  │   (SQLite WAL)    │
│  Zustand +  │    REST API      │                   │
│  smart-poll │◄───────────────►│   66+ endpoints   │
└─────────────┘                  └──────────────────┘
```

**Three real-time channels:**

1. **WebSocket** — connects to OpenClaw gateway for agent lifecycle events (heartbeat, spawn, status changes). Auto-reconnects with exponential backoff (max 10 attempts). Ed25519 device identity for handshake auth.

2. **SSE** (`/api/events`) — streams database changes to all connected browsers. Event types: `tick`, `log`, `chat.message`, `notification`, `agent.status`.

3. **Smart polling** (`use-smart-poll.ts`) — reduces frequency when browser tab is inactive. Supplements WebSocket for data that doesn't need sub-second delivery.

### Security Layers

All requests pass through `proxy.ts`:

```
Request → Host Allowlist → CSRF Check → Rate Limit → Auth (Session/API Key) → Route Handler
```

- **Timing-safe comparisons** via `timingSafeEqual()` on all auth token checks
- **CSRF** — mutating requests validate origin header matches request host
- **Host allowlist** — `MC_ALLOWED_HOSTS` env var, deny-all default in production
- **Rate limiting** — per-endpoint, trusted proxy support (`MC_TRUSTED_PROXIES`)
- **Password security** — scrypt hashing, 12-character minimum
- **Webhook signatures** — HMAC-SHA256 with constant-time verification

### Database: SQLite with 21 Migrations

Self-contained in `.data/` (gitignored). Uses WAL mode for concurrent reads, foreign keys enforced.

**Core table groups (21 tables):**

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Auth** | users, sessions, access_requests | Authentication, role management |
| **Agents** | agents, agent_heartbeats, agent_souls, working_memory | Fleet lifecycle, SOUL system |
| **Tasks** | tasks, task_subscriptions, comments | Kanban board, threaded comments |
| **Monitoring** | activities, token_usage, audit_log | Event stream, cost tracking, audit trail |
| **Chat** | conversations, messages | Agent chat threads |
| **Automation** | cron_jobs, scheduled_tasks, pipeline_runs, workflows | Background scheduling, pipelines |
| **Integrations** | webhooks, webhook_deliveries, alert_rules, alert_events, gateways, github_issues | External systems |
| **Config** | settings, notification_preferences | App configuration |
| **Claude** | claude_sessions | Local session tracking |

**Key constraints:** Cascade deletes on comments/reviews, unique agent-task subscriptions, indexes on status/assignment/timestamp columns.

---

## The 29 Feature Panels

| # | Panel | File | What It Does |
|---|-------|------|-------------|
| 1 | **Task Board** | `task-board-panel.tsx` | Kanban with 6 columns (inbox → done), drag-drop, priorities, assignments, threaded comments |
| 2 | **Agent Squad** | `agent-squad-panel.tsx` | Agent fleet overview — register, monitor, lifecycle management |
| 3 | **Agent Squad v2** | `agent-squad-panel-phase3.tsx` | Enhanced agent grid with phase 3 features |
| 4 | **Agent Detail** | `agent-detail-tabs.tsx` | Individual agent: SOUL editor, memory, history, cost tabs |
| 5 | **Agent Spawn** | `agent-spawn-panel.tsx` | Spawn new agent sessions with model/tools selection |
| 6 | **Agent History** | `agent-history-panel.tsx` | Agent event timeline and activity log |
| 7 | **Agent Comms** | `agent-comms-panel.tsx` | Inter-agent messaging and communication |
| 8 | **Agent Cost** | `agent-cost-panel.tsx` | Per-agent token usage and spend breakdown |
| 9 | **Token Dashboard** | `token-dashboard-panel.tsx` | Global token usage, per-model cost trends (Recharts) |
| 10 | **Session Details** | `session-details-panel.tsx` | Active session inspector with live metrics |
| 11 | **Activity Feed** | `activity-feed-panel.tsx` | Real-time activity stream across all agents |
| 12 | **Log Viewer** | `log-viewer-panel.tsx` | Filterable agent log browser |
| 13 | **Memory Browser** | `memory-browser-panel.tsx` | Filesystem memory tree (workspace markdown files) |
| 14 | **Alert Rules** | `alert-rules-panel.tsx` | Configurable alert conditions with cooldowns |
| 15 | **Webhook** | `webhook-panel.tsx` | Outbound webhooks — CRUD, delivery history, test/retry |
| 16 | **Gateway Config** | `gateway-config-panel.tsx` | OpenClaw gateway settings |
| 17 | **Multi-Gateway** | `multi-gateway-panel.tsx` | Multiple simultaneous gateway connections |
| 18 | **Cron Management** | `cron-management-panel.tsx` | Scheduled task creation and monitoring |
| 19 | **Pipeline** | `pipeline-tab.tsx` | Workflow pipeline orchestration and DAG runs |
| 20 | **Standup** | `standup-panel.tsx` | Auto-generated daily standup reports |
| 21 | **Audit Trail** | `audit-trail-panel.tsx` | Immutable change log with actor tracking |
| 22 | **Settings** | `settings-panel.tsx` | App-wide configuration |
| 23 | **User Management** | `user-management-panel.tsx` | RBAC user admin — create, roles, approve access |
| 24 | **Notifications** | `notifications-panel.tsx` | Notification center with read tracking |
| 25 | **GitHub Sync** | `github-sync-panel.tsx` | GitHub Issues inbound sync with label/assignee mapping |
| 26 | **Integrations** | `integrations-panel.tsx` | Third-party integration management |
| 27 | **Office** | `office-panel.tsx` | Office/workspace view |
| 28 | **Super Admin** | `super-admin-panel.tsx` | Elevated admin controls, workspace provisioning |
| 29 | **Orchestration Bar** | `orchestration-bar.tsx` | Workflow orchestration toolbar |

---

## API Surface — 38 Route Groups (66+ Endpoints)

### Auth & Users
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login with username/password |
| POST | `/api/auth/google` | — | Google Sign-In |
| POST | `/api/auth/logout` | — | Destroy session |
| GET | `/api/auth/me` | — | Current user info |
| GET | `/api/auth/access-requests` | admin | Pending access requests |
| POST | `/api/auth/access-requests` | admin | Approve/reject requests |

### Agents
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/agents` | viewer | List agents with task stats |
| POST | `/api/agents` | operator | Register/update agent |
| GET | `/api/agents/[id]` | viewer | Agent details |
| POST | `/api/agents/sync` | operator | Sync from openclaw.json |
| GET/PUT | `/api/agents/[id]/soul` | operator | Agent SOUL content (bidirectional disk/DB sync) |
| GET/POST | `/api/agents/comms` | operator | Inter-agent communication |
| POST | `/api/agents/message` | operator | Send message to agent |
| POST | `/api/agents/[id]/heartbeat` | operator | Agent heartbeat |
| POST | `/api/agents/[id]/wake` | operator | Wake sleeping agent |

### Tasks
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/tasks` | viewer | List tasks (filter: status, assigned_to, priority) |
| POST | `/api/tasks` | operator | Create task |
| GET | `/api/tasks/[id]` | viewer | Task details |
| PUT | `/api/tasks/[id]` | operator | Update task |
| DELETE | `/api/tasks/[id]` | admin | Delete task |
| GET/POST | `/api/tasks/[id]/comments` | viewer/operator | Task comments |
| POST | `/api/tasks/[id]/broadcast` | operator | Broadcast task to agents |

### Monitoring & Observability
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/status` | viewer | System status (uptime, memory, disk) |
| GET | `/api/activities` | viewer | Activity feed |
| GET | `/api/notifications` | viewer | User notifications |
| GET | `/api/sessions` | viewer | Active gateway sessions |
| GET | `/api/tokens` | viewer | Token usage and cost data |
| GET/POST | `/api/standup` | viewer/operator | Standup reports |
| GET | `/api/logs` | viewer | Agent log browser |
| GET | `/api/memory` | viewer | Memory file browser/search |
| GET | `/api/search` | viewer | Global search |
| GET | `/api/audit` | admin | Audit log |

### Integrations & Operations
| Method | Path | Role | Description |
|--------|------|------|-------------|
| CRUD | `/api/webhooks` | admin | Webhook management |
| POST | `/api/webhooks/test` | admin | Test delivery |
| POST | `/api/webhooks/retry` | admin | Manual retry failed delivery |
| CRUD | `/api/alerts` | admin | Alert rules |
| CRUD | `/api/gateways` | admin | Gateway connections |
| CRUD | `/api/integrations` | admin | Integration management |
| POST | `/api/github` | admin | Trigger GitHub Issues sync |
| POST | `/api/connect` | operator | Register direct CLI connection |
| GET | `/api/connect` | viewer | List active connections |

### Automation & Admin
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET/POST | `/api/scheduler` | admin | Background task scheduler |
| GET/POST | `/api/cron` | admin | Cron management |
| GET/PUT | `/api/settings` | admin | App settings |
| GET/PUT | `/api/gateway-config` | admin | Gateway config |
| POST | `/api/backup` | admin | Database backup |
| POST | `/api/cleanup` | admin | Stale data cleanup |
| GET | `/api/export` | admin | CSV export |
| POST | `/api/spawn` | operator | Spawn agent session |
| POST | `/api/quality-review` | operator | Submit quality review |
| GET | `/api/releases/check` | viewer | Check for new GitHub releases |

### Real-time & Chat
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | SSE stream of DB changes |
| GET/POST | `/api/chat/conversations` | Conversation CRUD |
| GET/POST | `/api/chat/messages` | Message CRUD |
| GET/POST | `/api/claude/sessions` | Claude Code session discovery |
| GET/POST | `/api/pipelines` | Pipeline runs |
| GET/POST | `/api/workflows` | Workflow templates |

---

## Core Library Modules

### Scheduler (`lib/scheduler.ts`)

5 registered background tasks on a 60-second tick loop:

| Task | Interval | Purpose |
|------|----------|---------|
| `auto_backup` | ~3 AM UTC daily | Database backup with retention pruning |
| `auto_cleanup` | ~4 AM UTC daily | Stale record removal |
| `agent_heartbeat` | 5 min | Mark unresponsive agents offline |
| `webhook_retry` | 60 sec | Retry failed webhook deliveries |
| `claude_session_scan` | 60 sec | Discover local Claude Code sessions |

Prevents concurrent runs. Database-driven enable/disable via settings panel.

### Webhooks (`lib/webhooks.ts`)

- **Signature:** HMAC-SHA256 via `X-MC-Signature` header, constant-time verification
- **Delivery:** 10-second timeout, response truncation (1000 chars max in logs)
- **Retry:** Exponential backoff: 30s → 5m → 30m → 2h → 8h (±20% jitter)
- **Circuit breaker:** 5 consecutive failures → webhook auto-disabled
- **Cleanup:** Retains last 200 delivery records per webhook

### WebSocket (`lib/websocket.ts`)

- **Auth:** Ed25519 device identity signing with nonce-based challenges
- **Reconnection:** Exponential backoff, max 10 attempts
- **Heartbeat:** 30-second ping, closes after 3 missed pongs with RTT tracking
- **Message types:** `event`, `req`, `res` with typed payloads
- **Broadcast events:** tick, log, chat.message, notification, agent.status

### Zustand Store (`store/index.ts`)

| Category | State | Details |
|----------|-------|---------|
| **Connection** | `dashboardMode`, `gatewayAvailable`, `connection` | WebSocket link status |
| **Entities** | `tasks`, `agents`, `sessions`, `activities`, `notifications` | Core data (1000-item cap on activities/logs) |
| **Chat** | `chat`, `comments` | Messages with deduplication |
| **Observability** | `logs`, `token_usage`, `standup_reports` | Monitoring data |
| **UI** | `sidebarExpanded`, `collapsedGroups`, `liveFeedVisible` | Persisted to localStorage |

---

## Authentication & Authorization

### Three Auth Methods

| Method | Mechanism |
|--------|-----------|
| **Session cookie** | `POST /api/auth/login` → `mc-session` (7-day expiry) |
| **API key** | `x-api-key` header matching `API_KEY` env var |
| **Google SSO** | OAuth with admin approval workflow |

### Three Roles (RBAC)

| Role | Access |
|------|--------|
| `viewer` | Read-only across all panels |
| `operator` | Read + write (tasks, agents, chat, CLI connections) |
| `admin` | Full access (users, settings, system ops, webhooks, alerts) |

Initial login seeded from `AUTH_USER` / `AUTH_PASS` env vars on first run.

---

## Testing Strategy

### E2E Tests — 28 Playwright Specs

| Category | Specs | Coverage |
|----------|-------|---------|
| **Security** | auth-guards, csrf-validation, legacy-cookie-removed, login-flow, rate-limiting, timing-safe-auth | Auth, CSRF, rate limits, timing attacks |
| **CRUD** | tasks-crud, agents-crud, task-comments, workflows-crud, webhooks-crud, alerts-crud, user-management | Full lifecycle for all core entities |
| **Features** | notifications, quality-review, search-and-export, agent-costs | Feature-specific validation |
| **Infrastructure** | limit-caps, delete-body, device-identity, direct-cli, github-sync, mentions, openapi, openclaw-harness | CLI integration, GitHub, @mentions, OpenAPI |

### Unit Tests — Vitest

8 test files in `src/lib/__tests__/` covering auth, webhooks, rate limiting, and core utilities.

### Quality Gate

```bash
pnpm quality:gate  # runs: typecheck + lint + test + e2e
```

### 3 Playwright Configs

- `playwright.config.ts` — Default E2E suite
- `playwright.openclaw.gateway.config.ts` — Gateway integration tests
- `playwright.openclaw.local.config.ts` — Local mode tests

---

## Release History

| Version | Date | Key Changes |
|---------|------|------------|
| **1.0.0** | 2026-02-15 | Core dashboard, Kanban board, SSE, webhooks with HMAC, alerts, Docker support |
| **1.1.0** | 2026-02-27 | Multi-user auth, Google SSO, RBAC, 1Password integration, workflows, quality reviews, global search, notifications with @mentions |
| **1.2.0** | 2026-03-01 | Zod validation on all mutations, security headers, rate limiting, unit test coverage |
| **1.3.0** | 2026-03-02 | Claude Code session tracking, webhook retry + circuit breaker, pino structured logging, 69 unit + 165 E2E tests |

---

## Integration Points

| Integration | Direction | Mechanism |
|------------|-----------|-----------|
| **OpenClaw Gateway** | Bidirectional | WebSocket + REST sync, Ed25519 handshake |
| **Claude Code** | Inbound | Auto-discovery from `~/.claude/projects/` (60s scan) |
| **Direct CLI** | Inbound | `POST /api/connect` — any CLI tool registers without gateway |
| **GitHub Issues** | Inbound | Sync with label/assignee mapping |
| **Outbound Webhooks** | Outbound | HMAC-SHA256 signed, retry + circuit breaker |
| **1Password CLI** | Optional | Secret management |
| **Google OAuth** | Inbound | SSO with admin approval |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_USER` | No | Initial admin username (default: admin) |
| `AUTH_PASS` | No | Initial admin password |
| `AUTH_PASS_B64` | No | Base64-encoded password (overrides AUTH_PASS) |
| `API_KEY` | No | API key for headless access |
| `OPENCLAW_CONFIG_PATH` | Yes* | Path to openclaw.json |
| `OPENCLAW_STATE_DIR` | Yes* | OpenClaw state root (default: ~/.openclaw) |
| `OPENCLAW_GATEWAY_HOST` | No | Gateway host (default: 127.0.0.1) |
| `OPENCLAW_GATEWAY_PORT` | No | WebSocket port (default: 18789) |
| `OPENCLAW_GATEWAY_TOKEN` | No | Server-side gateway auth token |
| `NEXT_PUBLIC_GATEWAY_TOKEN` | No | Browser-side gateway token |
| `OPENCLAW_MEMORY_DIR` | No | Agent memory root for Memory Browser |
| `MC_CLAUDE_HOME` | No | Path to ~/.claude (default: ~/.claude) |
| `MC_TRUSTED_PROXIES` | No | Comma-separated trusted proxy IPs |
| `MC_ALLOWED_HOSTS` | No | Host allowlist for production |

---

## Deployment Options

### Bare Metal
```bash
pnpm install --frozen-lockfile
pnpm build
OPENCLAW_CONFIG_PATH=/path/to/openclaw.json pnpm start
```

### Docker
```bash
docker-compose up
```
Multi-stage Dockerfile with healthcheck. Network access restricted by default.

### Production Hardening
- Set `MC_ALLOWED_HOSTS` or `MC_ALLOW_ANY_HOST=1`
- Deploy behind reverse proxy (Caddy/nginx) with TLS
- Change all default credentials
- Review SECURITY.md

---

## Comparison with Command Center

| Aspect | Mission Control | Command Center |
|--------|----------------|----------------|
| **Purpose** | Generic agent orchestration | Delphi-specific commercial backoffice |
| **Database** | SQLite (embedded, zero-config) | Supabase (PostgreSQL, managed) |
| **Auth** | Custom scrypt + RBAC + Google SSO | Supabase Auth + Row-Level Security |
| **Real-time** | WebSocket + SSE + smart polling | Supabase Realtime channels |
| **UI Routing** | SPA catch-all (28 panels) | App Router multi-page (21 pages) |
| **Agent Gateway** | OpenClaw (multi-gateway) | None (direct Supabase writes) |
| **State** | Zustand (client-side) | Server Components (mostly server) |
| **Deployment** | Docker / bare pnpm / any host | Systemd on dedicated machine |
| **Open Source** | Yes (MIT, 1.6k stars) | Private |
| **Testing** | 148+ E2E + 69 unit tests | Not documented |
| **API Docs** | OpenAPI 3.1 with Scalar UI | None |
| **Styling** | Tailwind CSS 3.4 | Tailwind CSS v4 |

---

## Roadmap (from open issues)

**Completed recently:**
- Docker support, session controls, model catalog, API rate limiting
- Error boundaries, accessibility (WCAG 2.1 AA), HSTS
- Direct CLI integration (gateway-free), OpenAPI docs
- GitHub Issues sync, webhook retry + circuit breaker
- Ed25519 device identity, Agent SOUL system, update checker

**Up next:**
- Agent-agnostic gateway support (beyond OpenClaw)
- Workspace isolation for multi-team usage
- **Flight Deck** — native desktop companion app (Tauri v2) with PTY terminal grid, stall inbox, system tray HUD (private beta)
- Per-agent cost breakdowns panel
- OAuth approval UI improvements
- API token rotation UI

---

## Summary

Mission Control is a **horizontally-featured, security-hardened, real-time agent orchestration dashboard** built as a single-page Next.js application with 66+ REST API endpoints and SQLite persistence. It emphasizes:

- **Zero-config deployment** — SQLite means no database server to manage
- **Real-time visibility** — WebSocket + SSE + smart polling trifecta
- **Security-first** — timing-safe auth, CSRF, rate limiting, Ed25519 device identity
- **Comprehensive testing** — 148+ E2E + 69 unit tests, quality gate CI
- **Integration-ready** — webhooks, GitHub sync, direct CLI, multi-gateway

Best suited for teams managing 10–100 AI agents where central visibility, task coordination, and cost tracking are critical. The SQLite choice makes it ideal as an internal/backoffice tool rather than a high-throughput SaaS platform.
