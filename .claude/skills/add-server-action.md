---
{"name": "add-server-action", "description": "Create a Next.js Server Action for form submissions or mutations", "version": "1.0"}
---
# Skill: Add Server Action

## When to use
Server actions handle form submissions, mutations (create/update/delete), and any operation that writes to the database.

## File location
Create in `src/app/(app)/<route>/actions.ts` for route-specific actions.
Shared actions go in `src/lib/actions/`.

## Template

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function <actionName>(formData: FormData) {
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Extract and validate form data
  const value = formData.get("<field>") as string;
  if (!value) return { error: "Field is required" };

  // Perform the mutation
  const { error } = await supabase
    .from("<table>")
    .insert({ <field>: value });

  if (error) return { error: error.message };

  // Revalidate the page cache
  revalidatePath("/<route>");
  return { success: true };
}
```

## Rules
- Always verify authentication before any mutation
- Always return `{ error: string }` on failure — never throw to the client
- Always call `revalidatePath()` after mutations that affect page data
- Use the server Supabase client (not browser client)
