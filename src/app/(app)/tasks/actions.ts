"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServerActionResult } from "@/lib/types";
import type { TaskStatus } from "@/lib/types";
import { createTaskSchema, type CreateTaskInput } from "@/lib/schemas";

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}

export async function createTask(
  input: CreateTaskInput
): Promise<ServerActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Generate ticket ref
  const projectId = parsed.data.project_id;
  let ticketRef: string | undefined;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("ticket_prefix, ticket_counter")
      .eq("id", projectId)
      .single();
    if (project) {
      const nextNum = project.ticket_counter + 1;
      ticketRef = `${project.ticket_prefix}-${nextNum}`;
      await supabase
        .from("projects")
        .update({ ticket_counter: nextNum })
        .eq("id", projectId);
    }
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...parsed.data,
      ticket_ref: ticketRef,
      created_by: user.email ?? user.id,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/tasks");
  return { success: true, data: { id: data.id } };
}

export async function updateTask(
  taskId: string,
  updates: Record<string, unknown>
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}

export async function archiveTask(taskId: string): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}

export async function addComment(
  taskId: string,
  content: string
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      content,
      author: user.email ?? user.id,
    });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

export async function submitReview(
  taskId: string,
  status: string,
  notes?: string
): Promise<ServerActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("quality_reviews")
    .insert({
      task_id: taskId,
      reviewer: user.email ?? user.id,
      status,
      notes,
    });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}
