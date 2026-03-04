import type { Database } from "./database.types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Agent = Database["public"]["Tables"]["agents"]["Row"];
export type Approval = Database["public"]["Tables"]["approvals"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type DealLearning = Database["public"]["Tables"]["deal_learnings"]["Row"];
export type OnboardingPattern = Database["public"]["Tables"]["onboarding_patterns"]["Row"];
export type AgentReport = Database["public"]["Tables"]["agent_reports"]["Row"];
export type AgentLog = Database["public"]["Tables"]["agent_logs"]["Row"];
export type LeadStageHistory = Database["public"]["Tables"]["lead_stage_history"]["Row"];
export type ClientHealthHistory = Database["public"]["Tables"]["client_health_history"]["Row"];
export type ChatConversation = Database["public"]["Tables"]["chat_conversations"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type AgentTokenUsage = Database["public"]["Tables"]["agent_token_usage"]["Row"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type AlertRule = Database["public"]["Tables"]["alert_rules"]["Row"];
export type AlertEvent = Database["public"]["Tables"]["alert_events"]["Row"];
export type CalibrationGate = Database["public"]["Tables"]["calibration_gates"]["Row"];
export type WeeklyReport = Database["public"]["Tables"]["weekly_reports"]["Row"];
export type ClientNote = Database["public"]["Tables"]["client_notes"]["Row"];
export type NotificationPreference = Database["public"]["Tables"]["notification_preferences"]["Row"];
export type PipelineConfig = Database["public"]["Tables"]["pipeline_config"]["Row"];

export type ServerActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export const PIPELINE_STAGES = [
  "prospecting",
  "qualification",
  "initial_contact",
  "demo",
  "needs_analysis",
  "proposal_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
