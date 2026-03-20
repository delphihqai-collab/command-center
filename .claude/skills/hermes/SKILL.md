---
name: hermes
description: Send a message to Hermes (the AI Commercial Director) and get a response. Use when you need to communicate with, query, or instruct Hermes.
user-invocable: true
---

# Talk to Hermes

Send a message to Hermes via OpenClaw and return the response.

## Usage

The user's message is: $ARGUMENTS

## Instructions

1. Take the user's message and send it to Hermes using:
   ```bash
   openclaw agent --agent main --message "<the message>" --json --timeout 120
   ```
2. Parse the JSON response and extract the agent's reply
3. Present the response clearly to the user
4. If the command fails, check if the gateway is running (`systemctl --user is-active openclaw-gateway`) and report the error

## Notes
- Hermes is the director agent (`main` / `hermes`)
- Use `--timeout 120` for complex tasks, `--timeout 60` for simple queries
- Use `--local` flag if you don't want the response delivered to Discord
- The `--json` flag returns structured output with `response`, `runId`, `sessionKey`
- You can also target sub-agents: `--agent sdr`, `--agent account-executive`, etc.
