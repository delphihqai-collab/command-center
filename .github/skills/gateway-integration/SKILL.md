# Skill: Gateway Integration

## When to Use
Working with the gateway page, sessions page, or any feature that reads from the OpenClaw Gateway WebSocket/REST API.

## Gateway API

The OpenClaw gateway runs on `http://127.0.0.1:18789`. It exposes REST endpoints:

| Endpoint | Method | Returns |
|----------|--------|---------|
| `/config` | GET | Gateway configuration (JSON) |
| `/sessions` | GET | Active agent sessions |
| `/status` | GET | Health check |

## Access Pattern

**Always** access via Next.js Route Handlers — never from client-side code:

```typescript
// In src/app/api/gateway/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch("http://127.0.0.1:18789/config");
  if (!res.ok) return NextResponse.json({ error: "Gateway unavailable" }, { status: 502 });

  const config = await res.json();
  return NextResponse.json(config);
}
```

## Gateway Configuration

Config is stored in `~/.openclaw/openclaw.json` (JSON5 format):

Key sections:
- **models** — available AI models and their API keys
- **channels** — Discord channel bindings
- **agents** — agent definitions and workspace paths
- **dm** — direct message policies
- **features** — feature flags

Config supports hot-reload — changes take effect without restarting the gateway.

## Sessions Page Pattern

The sessions page uses dual data sources:
1. **Primary:** Gateway API (`/sessions`) for live session data
2. **Fallback:** Supabase `agent_logs` table for historical data

```typescript
try {
  const gatewayRes = await fetch("http://127.0.0.1:18789/sessions");
  if (gatewayRes.ok) return await gatewayRes.json();
} catch {
  // Gateway unavailable — fall back to Supabase
}
const { data } = await supabase.from("agent_logs").select("*");
```
