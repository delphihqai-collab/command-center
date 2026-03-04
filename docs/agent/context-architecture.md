# Context Engineering Architecture

This document explains the layered context system used in this repository for AI coding agents (Claude Code, GitHub Copilot).

## The Five Layers

| Layer | File | Purpose | Changes |
|---|---|---|---|
| Task | `.claude/prompts/*.md` | One-off, situational instructions | Frequently |
| Behavior | `.github/copilot-instructions.md` + `CLAUDE.md` | Persistent rules that always apply | Slowly |
| Capability | `.claude/skills/*.md` | Reusable procedural expertise | When patterns are extracted |
| Identity | `CLAUDE.md` (agent section) | Who Claude Code is in this repo | Rarely |
| Enforcement | (future hooks) | Runtime guardrails | When deterministic control is needed |

## Principle
- If an instruction would change per task → prompt
- If a rule is always true → instructions
- If a procedure is reused across tasks → skill
- If something must never be violated → hook

## Status
All files are scaffolded. HERMES will complete all content after the V1 build is finished.
