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
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Webhook = Database["public"]["Tables"]["webhooks"]["Row"];
export type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];
export type AgentSoul = Database["public"]["Tables"]["agent_souls"]["Row"];
export type AgentComm = Database["public"]["Tables"]["agent_comms"]["Row"];
export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type SystemConfig = Database["public"]["Tables"]["system_config"]["Row"];
export type PipelineLead = Database["public"]["Tables"]["pipeline_leads"]["Row"];
export type ReviewQueueItem = Database["public"]["Tables"]["review_queue"]["Row"];
export type DailyTarget = Database["public"]["Tables"]["daily_targets"]["Row"];
export type OutreachSequence = Database["public"]["Tables"]["outreach_sequences"]["Row"];
export type OutreachTemplate = Database["public"]["Tables"]["outreach_templates"]["Row"];

// ── Shared utilities ──────────────────────────────────────────────────
export type ServerActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// V8 Pipeline Stages
export const PIPELINE_STAGES = [
  "discovery", "enrichment", "human_review", "outreach",
  "engaged", "meeting_booked", "meeting_completed",
  "proposal_sent", "won", "lost", "disqualified",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  discovery: "Discovery",
  enrichment: "Enrichment",
  human_review: "Review",
  outreach: "Outreach",
  engaged: "Engaged",
  meeting_booked: "Meeting Booked",
  meeting_completed: "Meeting Done",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
  disqualified: "Disqualified",
};

/** Active pipeline stages shown on the kanban board. */
export const ACTIVE_PIPELINE_STAGES: readonly PipelineStage[] = [
  "discovery", "enrichment", "human_review", "outreach",
  "engaged", "meeting_booked",
] as const;

/** Terminal stages — deal has ended. */
export const TERMINAL_STAGES: readonly PipelineStage[] = [
  "won", "lost", "disqualified",
] as const;

/** Stages agents can move leads to. Agents cannot mark won/lost — only humans. */
export const AGENT_ALLOWED_STAGES: readonly PipelineStage[] = [
  "discovery", "enrichment", "human_review", "outreach",
  "engaged", "meeting_booked", "meeting_completed",
  "proposal_sent", "disqualified",
] as const;
