#!/bin/bash
# SessionStart hook: inject fleet context at session start
# Provides Claude Code with current fleet state without needing to ask

GATEWAY_STATUS=$(openclaw health 2>/dev/null | head -5 || echo "Gateway: unreachable")
SERVICES=$(systemctl --user is-active openclaw-gateway 2>/dev/null && echo "openclaw: running" || echo "openclaw: stopped")
MC_STATUS=$(systemctl --user is-active command-center 2>/dev/null && echo "command-center: running" || echo "command-center: stopped")
CRON_STATUS=$(openclaw cron status 2>/dev/null | head -3 || echo "Cron: unknown")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Fleet Context (auto-injected):\n- Services: ${SERVICES}, ${MC_STATUS}\n- ${GATEWAY_STATUS}\n- ${CRON_STATUS}\n\nUse /fleet-status for full details. Use /hermes <message> to talk to Hermes."
  }
}
EOF
