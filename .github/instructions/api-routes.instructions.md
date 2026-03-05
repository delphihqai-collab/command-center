---
applyTo: "src/app/api/**"
---

# API Route Instructions

## Auth Pattern

Every API Route Handler must verify the user session:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... proceed
}
```

## OpenClaw CLI Calls

When calling the OpenClaw CLI from Route Handlers:

```typescript
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// CORRECT — safe from injection
const { stdout } = await execFileAsync("openclaw", ["cron", "list", "--json"]);

// WRONG — never use exec()
// const { stdout } = await exec(`openclaw cron list --json`);
```

## Gateway API Calls

For OpenClaw Gateway API:

```typescript
// Always local-only, via Route Handler — never from client components
const res = await fetch("http://127.0.0.1:18789/config");
```

## Filesystem Access

When reading OpenClaw workspace files:
- Validate all path parameters
- Prevent directory traversal (`..` in paths)
- Use `MEMORY_PATHS` from `@/lib/memory-paths.ts` for base directories
- Never expose absolute filesystem paths to the client

## Error Responses

Always return structured JSON errors:
```typescript
return NextResponse.json({ error: "Description" }, { status: 4xx });
```
