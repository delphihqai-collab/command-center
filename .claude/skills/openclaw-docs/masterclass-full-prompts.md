# OpenClaw Masterclass — Full Prompt Library (Gemini Extract)

Source: https://masterclass-prompts.netlify.app/ · Summarized by Gemini, verified against original pages.

## Security Module — Audit Prompt

Two prompts: Security Audit Script + Full Hardening Guide.

### Security Audit Script
```
You are a security auditor for an OpenClaw deployment. Run a comprehensive audit covering these 6 areas:

1. SECRET KEY & REGISTRATION
   - Check if gateway.auth.token is set and strong (32+ chars)
   - Check if registration is disabled for unknown users
   - Verify no default/example tokens in openclaw.json

2. TOOL RESTRICTIONS
   - Check if PIP install is disabled in tools config
   - Check workspace tool restrictions (deny dangerous commands)
   - Verify exec approvals are configured

3. NETWORK BINDING
   - Verify gateway binds to localhost only (127.0.0.1)
   - Check no ports exposed to 0.0.0.0
   - Verify reverse proxy if remote access needed

4. FIREWALL
   - Check Docker-aware firewall rules
   - Verify only necessary ports open
   - Check for UFW/iptables/nftables config

5. HTTPS/TLS
   - Check for Caddy or nginx reverse proxy with TLS
   - Verify no plaintext HTTP on external interfaces

6. SOFTWARE UPDATES
   - Check OpenClaw version (openclaw --version)
   - Check Node.js version
   - Check for known CVEs

Output: risk_level (critical/high/medium/low) per area + remediation steps.
```

### Known CVEs
- **CVE-2026-0765:** Critical RCE via crafted prompt
- **CVE-2026-0766:** Critical arbitrary file read
- **CVE-2025-9074:** Moderate SSRF via web_fetch
- **CVE-2026-25253:** Critical code execution via MCP tool
- **ClawHavoc:** Supply chain attack — 1,184+ malicious skills on ClawHub

### Hardening Quick Reference
```bash
# 1. Set strong auth token
openclaw config set gateway.auth.token "$(openssl rand -hex 32)"

# 2. Restrict tools
openclaw config set tools.deny '["pip", "pip3", "npm install -g"]'

# 3. Bind to localhost
openclaw config set gateway.host "127.0.0.1"

# 4. Run security audit
openclaw security audit

# 5. Run doctor
openclaw doctor

# 6. Update
openclaw update
```

## Skills Factory — Full Prompt

### Skill Template Structure
```yaml
---
name: skill-name
description: "What this skill does"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - REQUIRED_ENV_VAR
    primaryEnv: PRIMARY_SECRET
    emoji: 🔧
---

# Skill Title

Instructions for the agent when this skill is activated.
```

### Naming Convention
- Pattern: `^[a-z][a-z0-9-]{2,49}$`
- Examples: `morning-digest`, `email-outreach`, `competitor-intel`

### 5 Foundational Skill Templates

1. **ClawBuddy Core (REST)** — Base integration with dashboard API
2. **Office Animation (Custom)** — Visual status updates
3. **Resend Email (SMTP)** — Email sending via Resend API
4. **Intelligence Sync (REST)** — Data pipeline from external sources
5. **Morning Digest Boot Check (Custom)** — Health check on session start

### Validation Workflow
1. Define skill in SKILL.md with YAML frontmatter
2. Test with `openclaw skills check <skill-name>`
3. Install: `openclaw skills list` to verify
4. Deploy to ClawHub (optional): `openclaw skills publish`

## Multi-Agent Dispatch — Full Protocol

### Queue System API

**Create dispatch:**
```json
{
  "request_type": "queue",
  "action": "create",
  "task_type": "build",
  "action_name": "Full Human-Readable Task Title",
  "priority": "high",
  "payload": {
    "prompt": "## Task\n<one sentence>\n\n## Requirements\n<spec>\n\n## Environment\n- Working directory: <path>\n- Env vars: <list>\n\n## Deliverables\n1. Working app\n2. README.md\n3. Logs\n4. Report",
    "dispatcher": "<coordinator_name>",
    "task_title": "Full Human-Readable Task Title",
    "max_turns": 50
  }
}
```

**Claim work:**
```json
{"request_type": "queue", "action": "claim", "task_id": "<id>"}
```

**Complete work:**
```json
{"request_type": "queue", "action": "complete", "task_id": "<id>",
 "result": {"status": "completed", "summary": "<what was built>"}}
```

**List pending:**
```json
{"request_type": "queue", "action": "list", "status": "pending", "limit": 5}
```

### Agent Communication API

**Send message:**
```json
{"request_type": "agent_comms", "action": "send",
 "from_agent": "<name>", "to_agent": "<name>",
 "message_type": "status_response",
 "message": "Build complete. Dashboard updated."}
```

**Check messages:**
```json
{"request_type": "agent_comms", "action": "check", "agent_name": "<name>"}
```

**Reply:**
```json
{"request_type": "agent_comms", "action": "reply",
 "message_id": "<id>", "from_agent": "<name>",
 "message": "Acknowledged. Starting build."}
```

### 4 Orchestration Patterns

1. **Queue Dispatch** (primary) — Coordinator creates queue item → Executor claims and builds
2. **Sequential Handoff** — Agent A completes → dispatches to Agent B → B completes → dispatches to C
3. **Parallel Execution** — Coordinator dispatches multiple items → Multiple executors claim simultaneously
4. **Escalation** — Executor hits max heal attempts → escalates to coordinator → coordinator re-dispatches or intervenes

## Automations & Cron — Full Prompt

### 5 Production-Ready Automations

**1. Morning Digest (daily 7am)**
```
openclaw cron add --name "Morning Digest" \
  --cron "0 7 * * *" --tz "Europe/Lisbon" \
  --session isolated --message "
Morning brief. Check:
1. Overnight alerts and errors
2. Pending tasks on the board
3. Unanswered questions
4. Today's calendar
5. Key meetings requiring prep
Format as a concise brief. Deliver to #daily-standup." \
  --announce --channel discord --to "channel:<standup_id>"
```

**2. Midday Prep (noon weekdays)**
```
openclaw cron add --name "Midday Prep" \
  --cron "0 12 * * 1-5" --tz "Europe/Lisbon" \
  --session isolated --message "
Midday update:
1. Afternoon meetings — pull context for each
2. Morning task progress — flag blockers
3. Pipeline status — any leads need attention
4. Prepare talking points for upcoming calls
Post to #hermes-chat." \
  --announce --channel discord --to "channel:<chat_id>"
```

**3. Evening Report (6pm weekdays)**
```
openclaw cron add --name "Evening Report" \
  --cron "0 18 * * 1-5" --tz "Europe/Lisbon" \
  --session isolated --message "
End of day report:
1. What was completed today
2. Incomplete tasks and blockers
3. Decisions that need attention
4. Tomorrow's priorities
Post to #hermes-chat." \
  --announce --channel discord --to "channel:<chat_id>"
```

**4. Competitor Intel (Monday 9am)**
```
openclaw cron add --name "Competitor Intel" \
  --cron "0 9 * * 1" --tz "Europe/Lisbon" \
  --session isolated --message "
Weekly competitive intelligence:
1. Scan competitor websites for changes
2. Check social media for announcements
3. Look for pricing changes or new features
4. Identify positioning shifts
Format as weekly intelligence brief for #market-intelligence." \
  --announce --channel discord --to "channel:<intel_id>"
```

**5. Meeting Sync (every 4h)**
```
openclaw cron add --name "Meeting Sync" \
  --cron "0 */4 * * *" --tz "Europe/Lisbon" \
  --session isolated --message "
Meeting sync:
1. Pull latest meeting transcripts
2. Extract action items and decisions
3. Update task board with new items
4. Flag follow-ups needed
Silent run — log results only." \
  --delivery none
```

### Error Handling Pattern
- Exponential backoff: 30s → 1m → 5m → 15m → 60m
- Max consecutive errors tracked per job
- Run history in `~/.openclaw/cron/runs/<jobId>.jsonl`
- Each line: `{"timestamp", "status", "tokens", "cost", "duration"}`

### Pro Move: Sub-Agent Trick
"When setting up cron jobs for anything complex — morning briefs, email scans, multi-step workflows — do NOT run the task directly in your heartbeat cron. It will timeout and fail."

**Wrong:** `heartbeat cron → run complex task directly`
**Right:** `heartbeat cron → spawn sub-agent → sub-agent runs the task`

The heartbeat is just the trigger. The sub-agent runs independently, handles its own context, and doesn't timeout.

## Token Optimization — Full 8-Layer Config

### Layer 1: Disable Thinking
```json
{ "thinking": { "type": "disabled" } }
```
Mid-session: `/reasoning off`

### Layer 2: Cap Context
```json
{ "contextTokens": 50000 }
```

### Layer 3: Model Routing
```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "anthropic/claude-haiku-4-5" },
      "models": {
        "anthropic/claude-sonnet-4-5": { "alias": "sonnet" },
        "anthropic/claude-haiku-4-5": { "alias": "haiku" }
      }
    }
  }
}
```

System prompt rule:
```
MODEL SELECTION RULE:
Default: Always use Haiku.
Switch to Sonnet ONLY when:
- Architecture decisions
- Production code review
- Security analysis
- Complex debugging / reasoning
- Strategic multi-project decisions
When in doubt: Try Haiku first.
```

### Layer 4: Session Reset Discipline
```bash
# Check session sizes
du -h ~/.openclaw/agents/main/sessions/*.jsonl | sort -h
# Fix: compact then new session
/status → /compact → openclaw session new
```

### Layer 5: Lean Session Init
```
SESSION INITIALIZATION RULE:
1. Load ONLY: SOUL.md, USER.md, IDENTITY.md, memory/YYYY-MM-DD.md
2. DO NOT auto-load: MEMORY.md, session history, prior messages
3. Use memory_search() on demand — don't load whole files
4. Update memory/YYYY-MM-DD.md at end of session
```

### Layer 6: Cheap Heartbeats
Route heartbeats to Ollama or Haiku with `lightContext: true` + `isolatedSession: true`.

### Layer 7: Prompt Caching
Automatic with Anthropic API. Workspace files cached on repeated reads.

### Layer 8: Subagent Isolation
```json
{
  "agents": {
    "defaults": {
      "subagents": {
        "model": "anthropic/claude-haiku-4-5-20251001",
        "maxConcurrent": 8
      }
    }
  }
}
```

## Blueprint Session End Protocol (/done)

```
VALIDATE → SYNC → REPORT → LEARN → OFFLINE
```

1. **VALIDATE** — Loose ends? Tasks in "doing"? Unsaved files? Uncommitted changes?
2. **SYNC** — Update STATUS.md: accomplished, in-progress, next, blockers
3. **REPORT** — Generate session report with completed/in-progress/next
4. **LEARN** — Extract patterns, submit to Cognitive Memory (1-3 learnings)
5. **OFFLINE** — Set status offline, close session cleanly

## Key Gotchas (from community)

1. **SOUL.md drift:** Agent stops executing and starts only describing work. Fix: rewrite SOUL.md and IDENTITY.md using a separate AI, paste clean versions.
2. **Config editing:** OpenClaw hallucinates field names when asked to edit openclaw.json. Always paste exact JSON.
3. **Subagent blindspot:** Sub-agents only see AGENTS.md + TOOLS.md. Not SOUL, IDENTITY, USER, MEMORY.
4. **Memory flush:** Enable `compaction.memoryFlush.enabled: true` to save context before compaction.
5. **Email trap:** A single crafted email can trick an agent into leaking inbox contents via prompt injection.
6. **ClawHub safety:** 1,184+ malicious skills found (ClawHavoc attack). Always review skill source code.
7. **CLI access drift:** OpenClaw can lose CLI access mid-session. Re-grant without restart.
8. **Heartbeat timeout:** Complex tasks in heartbeat cron will timeout. Use sub-agents instead.
