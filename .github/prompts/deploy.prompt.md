# Deploy

Build, deploy, and verify Mission Control.

## Steps

1. Ensure all changes are committed: `git status`
2. Build with env vars:
   ```bash
   source .env.local 2>/dev/null
   NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" npm run build
   ```
3. Verify zero build errors
4. Restart the service: `systemctl --user restart command-center`
5. Check logs: `journalctl --user -u command-center -f`
6. Verify health: `curl -s http://localhost:9069/api/status`
7. Check OpenClaw is running: `openclaw status`

## After Schema Changes

If migrations were applied:
```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```
Then rebuild and restart.
