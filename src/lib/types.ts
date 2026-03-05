import type { Database } from "./database.types";

// ── Kept from Command Center ──────────────────────────────────────────
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentReport = Database["public"]["Tables"]["agent_reports"]["Row"];
export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type ChatConversation = Database["public"]["Tables"]["chat_conversations"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type AgentTokenUsage = Database["public"]["Tables"]["agent_token_usage"]["Row"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type AlertRule = Database["public"]["Tables"]["alert_rules"]["Row"];
export type AlertEvent = Database["public"]["Tables"]["alert_events"]["Row"];
export type Heartbeat = Database["public"]["Tables"]["heartbeats"]["Row"];

// ── New Mission Control types ─────────────────────────────────────────
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"];
export type TaskSubscription = Database["public"]["Tables"]["task_subscriptions"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type QualityReview = Database["public"]["Tables"]["quality_reviews"]["Row"];
export type Webhook = Database["public"]["Tables"]["webhooks"]["Row"];
export type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];
export type ScheduledTask = Database["public"]["Tables"]["scheduled_tasks"]["Row"];
export type StandupReport = Database["public"]["Tables"]["standup_reports"]["Row"];
export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type PipelineRun = Database["public"]["Tables"]["pipeline_runs"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AgentSoul = Database["public"]["Tables"]["agent_souls"]["Row"];
export type AgentComm = Database["public"]["Tables"]["agent_comms"]["Row"];
export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type GithubIssue = Database["public"]["Tables"]["github_issues"]["Row"];
export type SystemConfig = Database["public"]["Tables"]["system_config"]["Row"];

// ── Shared utilities ──────────────────────────────────────────────────
export type ServerActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export const TASK_STATUSES = [
  "inbox", "backlog", "todo", "in_progress", "review", "done",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
