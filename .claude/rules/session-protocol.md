---
description: Session completion protocol — mandatory steps after every implementation session
globs: ["**"]
---

# Session Completion Protocol

After every implementation session that changes code, follow these steps:

1. **Build passes** — `set -a && source .env.local && set +a && npm run build` with zero errors
2. **HERMES.md updated** — update `docs/HERMES.md` to reflect any changes to pages, components, data sources, or APIs
3. **Git commit + push** — commit changes with descriptive message
4. **Service restart** — `systemctl --user restart command-center` if code changed

Use `/deploy` to run steps 1 and 4 automatically.
