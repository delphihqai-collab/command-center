---
applyTo: "src/app/(app)/**/actions.ts"
---

# Server Action Instructions

## Template

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actionName(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const value = formData.get("field") as string;
  if (!value) return { error: "Field is required" };

  const { error } = await supabase
    .from("table")
    .insert({ field: value });

  if (error) return { error: error.message };

  revalidatePath("/route");
  return { success: true };
}
```

## Rules

- Always verify authentication before any mutation
- Always return `{ error: string }` on failure — never throw to the client
- Always call `revalidatePath()` after mutations that affect page data
- Use the server Supabase client — never the browser client
- Name with camelCase verbs: `createTask`, `moveTask`, `toggleWebhook`
- Destructure `.data` and `.error` from all Supabase responses
