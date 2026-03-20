#!/bin/bash
# Stop hook: send desktop notification when Claude finishes a task
notify-send "Claude Code" "Task completed" --icon=dialog-information 2>/dev/null || true
exit 0
