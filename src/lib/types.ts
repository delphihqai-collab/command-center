import type { Database } from "./database.types";

// ── Core types ────────────────────────────────────────────────────────
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type AgentReport = Database["public"]["Tables"]["agent_reports"]["Row"];
export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type AgentTokenUsage = Database["public"]["Tables"]["agent_token_usage"]["Row"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type AlertRule = Database["public"]["Tables"]["alert_rules"]["Row"];
export type AlertEvent = Database["public"]["Tables"]["alert_events"]["Row"];
export type Heartbeat = Database["public"]["Tables"]["heartbeats"]["Row"];

// ── Mission Control types ─────────────────────────────────────────────
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type QualityReview = Database["public"]["Tables"]["quality_reviews"]["Row"];
export type Webhook = Database["public"]["Tables"]["webhooks"]["Row"];
export type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];
export type AgentSoul = Database["public"]["Tables"]["agent_souls"]["Row"];
export type AgentComm = Database["public"]["Tables"]["agent_comms"]["Row"];
export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type SystemConfig = Database["public"]["Tables"]["system_config"]["Row"];
export type PipelineLead = Database["public"]["Tables"]["pipeline_leads"]["Row"];

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

export const PIPELINE_STAGES = [
  "new_lead", "sdr_qualification", "qualified", "discovery",
  "proposal", "negotiation", "closed_won", "closed_lost", "disqualified",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  new_lead: "New Lead",
  sdr_qualification: "SDR Qualification",
  qualified: "Qualified (SQL)",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  disqualified: "Disqualified",
};

/** Stages that agents can move leads to. Closed stages require human action. */
export const AGENT_ALLOWED_STAGES: readonly PipelineStage[] = [
  "new_lead", "sdr_qualification", "qualified", "discovery",
  "proposal", "negotiation",
] as const;
