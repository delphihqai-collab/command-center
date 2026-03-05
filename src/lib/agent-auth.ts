import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Validate the agent API key from the Authorization header.
 * Returns null if valid, or a 401 NextResponse if invalid.
 */
export function validateAgentKey(req: NextRequest): NextResponse | null {
  const key = process.env.AGENT_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Agent API not configured" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <key>" },
      { status: 401 }
    );
  }

  const provided = auth.slice(7);
  if (provided.length !== key.length) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const valid = timingSafeEqual(
    Buffer.from(provided, "utf8"),
    Buffer.from(key, "utf8")
  );

  if (!valid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  return null;
}
