import { z } from "zod/v4";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["inbox", "backlog", "todo", "in_progress", "review", "done"]).default("inbox"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assigned_to: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  labels: z.array(z.string()).default([]),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().min(8, "Secret must be at least 8 characters"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  enabled: z.boolean().default(true),
});
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  steps: z.array(z.object({
    name: z.string(),
    type: z.enum(["agent_action", "condition", "wait", "webhook"]),
    config: z.record(z.string(), z.unknown()),
  })),
});
export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
