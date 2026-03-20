---
name: deploy
description: Build the Command Center and restart the service. Use after completing code changes to deploy them.
user-invocable: true
---

# Deploy Command Center

Build and deploy the latest code changes.

## Steps

1. **Build** the project:
   ```bash
   set -a && source .env.local && set +a && npm run build 2>&1 | tail -30
   ```

2. If build **succeeds**, restart the service:
   ```bash
   systemctl --user restart command-center && sleep 2 && systemctl --user is-active command-center
   ```

3. If build **fails**, report the errors. Do NOT restart the service.

4. Verify the service is running:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:9069/ 2>/dev/null
   ```

## Important
- The build bakes `NEXT_PUBLIC_*` env vars at build time — must use `set -a && source .env.local && set +a`
- If `.next` cache is corrupted: `rm -rf .next && set -a && source .env.local && set +a && npm run build`
- The service is `command-center.service` (user unit)
- Port: 9069
