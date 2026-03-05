# Debug Production

Diagnose and fix production issues in Mission Control.

## Steps

1. Check service status: `systemctl --user status command-center`
2. Tail logs: `journalctl --user -u command-center --since "10 min ago" --no-pager`
3. Check OpenClaw gateway: `openclaw status`
4. If gateway down: `systemctl --user restart openclaw`
5. Check for build errors: look for TypeScript or runtime errors in logs
6. If Supabase errors: verify `.env.local` has correct keys
7. If filesystem errors: verify `~/.openclaw/workspace/` exists and is readable
8. Fix the issue
9. Rebuild if code changed: `npm run build`
10. Restart: `systemctl --user restart command-center`
11. Monitor: `journalctl --user -u command-center -f`

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 502 on sessions | Gateway down | `systemctl --user restart openclaw` |
| Empty cron page | Reading from Supabase instead of OpenClaw | Fix to use `openclaw cron list` |
| Memory browser empty | Wrong paths in `memory-paths.ts` | Update `MEMORY_PATHS` |
| Auth errors | Session expired | Clear cookies, re-login |
| Build fails | Missing env vars | Set `NEXT_PUBLIC_*` vars |
