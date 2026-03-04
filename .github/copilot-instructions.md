# Command Center — GitHub Copilot Instructions

## Project Identity

Internal operations backoffice for Delphi. Next.js 16 + Supabase. Dark theme. Port 9069 on a private Linux machine.

## Stack

Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Supabase SSR · Recharts · date-fns · Lucide icons · Sonner

## Coding Style

- TypeScript strict — no `any`, no unnecessary `!` assertions
- Functional React components only — no class components
- Server Components by default — add `"use client"` only when browser APIs or event handlers are required
- Async Server Components for data fetching — no `useEffect` for data, no client-side fetching unless realtime
- `Promise.all()` for parallel Supabase queries on a single page
- Always destructure `.data` and `.error` from Supabase responses
- Use `?? []` or `?? null` fallbacks — never assume Supabase returned data

## Import Conventions

```typescript
// Server component — server Supabase client
import { createClient } from "@/lib/supabase/server";

// Client component — browser Supabase client
import { createClient } from "@/lib/supabase/client";

// Types — always use generated Database type
import type { Database } from "@/lib/database.types";

// UI components — shadcn/ui from @/components/ui/
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Icons — lucide-react
import { Bot, Target, Users } from "lucide-react";
```

## File Structure

- Pages: `src/app/(app)/<route>/page.tsx`
- Server actions: `src/app/(app)/<route>/actions.ts`
- Page-specific components: `src/app/(app)/<route>/_components/`
- Shared components: `src/components/`
- shadcn/ui primitives: `src/components/ui/` — do not edit
- Supabase clients: `src/lib/supabase/client.ts` and `server.ts`
- Generated types: `src/lib/database.types.ts` — do not edit manually

## Tailwind Conventions

Dark theme only. Zinc palette:
- Background: `bg-zinc-950`
- Cards/surfaces: `bg-zinc-900`
- Borders: `border-zinc-800`
- Primary text: `text-zinc-50`
- Secondary text: `text-zinc-400`
- Accent: `bg-indigo-600` / `text-indigo-400`

Status colours:
- Healthy/active/paid/approved: `emerald-500`
- Warning/idle/pending/at-risk: `amber-500`
- Critical/failed/overdue/rejected: `red-500`
- Offline/archived/expired: `zinc-500`

## Naming Conventions

- Components: PascalCase (`StatusBadge`, `AgentCard`)
- Files: kebab-case (`status-badge.tsx`, `agent-card.tsx`)
- Database columns: snake_case (matches Supabase schema)
- TypeScript interfaces: PascalCase (`Lead`, `Agent`, `Proposal`)
- Server actions: camelCase verb (`createLead`, `updateProposalStatus`)

## Do Not

- Do not import server client in Client Components
- Do not import browser client in Server Components
- Do not modify `src/lib/database.types.ts` manually
- Do not modify files in `src/components/ui/`
- Do not use `getServerSideProps` or `getStaticProps` — this is App Router
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle
- Do not write raw SQL in application code — use the Supabase query builder
- Do not add `console.log` in production paths — use structured error handling
- Do not skip the `.error` check from Supabase responses
