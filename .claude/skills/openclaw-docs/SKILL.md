---
name: openclaw-docs
description: Look up OpenClaw documentation for any topic. Use when you need to understand how OpenClaw works — configuration, CLI commands, agents, cron, sessions, channels, tools, etc.
user-invocable: true
---

# OpenClaw Documentation Lookup

Search the OpenClaw documentation for information about a specific topic.

## Query

The user wants to know about: $ARGUMENTS

## Instructions

1. Search the local OpenClaw docs first:
   ```bash
   grep -ril "<search terms>" /home/delphi/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/docs/ 2>/dev/null | head -10
   ```

2. If found, read the relevant doc files and extract the answer.

3. If not found locally, fetch from the online docs. The documentation index is at:
   `https://docs.openclaw.ai/llms.txt`

   Key documentation pages:
   - Configuration: `https://docs.openclaw.ai/gateway/configuration`
   - Configuration Reference: `https://docs.openclaw.ai/gateway/configuration-reference`
   - Cron Jobs: `https://docs.openclaw.ai/automation/cron-jobs`
   - Agents CLI: `https://docs.openclaw.ai/cli/agents`
   - Agent command: `https://docs.openclaw.ai/cli/agent`
   - Sessions: `https://docs.openclaw.ai/concepts/session`
   - Memory: `https://docs.openclaw.ai/concepts/memory`
   - Multi-Agent: `https://docs.openclaw.ai/concepts/multi-agent`
   - Agent Workspace: `https://docs.openclaw.ai/concepts/agent-workspace`
   - Heartbeat: `https://docs.openclaw.ai/gateway/heartbeat`
   - Discord: `https://docs.openclaw.ai/channels/discord`
   - Hooks: `https://docs.openclaw.ai/automation/hooks`
   - Standing Orders: `https://docs.openclaw.ai/automation/standing-orders`
   - Tools: `https://docs.openclaw.ai/tools/index`
   - Sub-Agents: `https://docs.openclaw.ai/tools/subagents`
   - Skills: `https://docs.openclaw.ai/tools/skills`
   - Security: `https://docs.openclaw.ai/gateway/security/index`
   - Troubleshooting: `https://docs.openclaw.ai/gateway/troubleshooting`
   - FAQ: `https://docs.openclaw.ai/help/faq`
   - Sandboxing: `https://docs.openclaw.ai/gateway/sandboxing`
   - System Prompt: `https://docs.openclaw.ai/concepts/system-prompt`
   - Workspace Templates: `https://docs.openclaw.ai/reference/templates/SOUL`
   - Token/Costs: `https://docs.openclaw.ai/reference/token-use`

4. Also check the CLI help:
   ```bash
   openclaw <relevant-command> --help 2>/dev/null
   ```

5. Present the information clearly and concisely. Include any relevant CLI commands or config examples.
