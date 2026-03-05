# Pre-Commit QA

Full quality check before committing changes.

## Steps

1. Build: `NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..." npm run build`
2. Check for TypeScript errors: zero tolerance
3. Verify no `any` types introduced
4. Verify no `exec()` calls (must be `execFile()`)
5. Verify no server client imports in `"use client"` files
6. Verify no browser client imports in Server Components
7. Verify no edits to `src/components/ui/` or `src/lib/database.types.ts`
8. Create HERMES report: `docs/hermes-reports/hermes-report-vX.md`
9. Commit: `git add -A && git commit -m "..."`
10. Push: `git push`
11. Restart if code changed: `systemctl --user restart command-center`
