export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_logs: {
        Row: {
          action: string
          agent_id: string
          created_at: string
          detail: string | null
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
        }
        Insert: {
          action: string
          agent_id: string
          created_at?: string
          detail?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Update: {
          action?: string
          agent_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reports: {
        Row: {
          agent_id: string
          content: Json
          created_at: string
          flag_level: string | null
          flagged: boolean
          id: string
          related_entity_id: string | null
          related_entity_type: string | null
          report_type: string
        }
        Insert: {
          agent_id: string
          content: Json
          created_at?: string
          flag_level?: string | null
          flagged?: boolean
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          report_type: string
        }
        Update: {
          agent_id?: string
          content?: Json
          created_at?: string
          flag_level?: string | null
          flagged?: boolean
          id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          id: string
          model: string
          name: string
          notes: string | null
          slug: string
          status: string
          type: string
          updated_at: string
          workspace_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model: string
          name: string
          notes?: string | null
          slug: string
          status: string
          type: string
          updated_at?: string
          workspace_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          name?: string
          notes?: string | null
          slug?: string
          status?: string
          type?: string
          updated_at?: string
          workspace_path?: string | null
        }
        Relationships: []
      }
      approvals: {
        Row: {
          action_summary: string
          alternatives: string | null
          approved_by_user_id: string | null
          context: string | null
          created_at: string
          created_by_agent_id: string | null
          decision_at: string | null
          discord_message_id: string | null
          draft_content: string | null
          id: string
          recipient: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          risk_if_delayed: string | null
          risks_if_approved: string | null
          risks_if_rejected: string | null
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          action_summary: string
          alternatives?: string | null
          approved_by_user_id?: string | null
          context?: string | null
          created_at?: string
          created_by_agent_id?: string | null
          decision_at?: string | null
          discord_message_id?: string | null
          draft_content?: string | null
          id?: string
          recipient?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          risk_if_delayed?: string | null
          risks_if_approved?: string | null
          risks_if_rejected?: string | null
          status?: string
          updated_at?: string
          urgency: string
        }
        Update: {
          action_summary?: string
          alternatives?: string | null
          approved_by_user_id?: string | null
          context?: string | null
          created_at?: string
          created_by_agent_id?: string | null
          decision_at?: string | null
          discord_message_id?: string | null
          draft_content?: string | null
          id?: string
          recipient?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          risk_if_delayed?: string | null
          risks_if_approved?: string | null
          risks_if_rejected?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_created_by_agent_id_fkey"
            columns: ["created_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_history: {
        Row: {
          client_id: string
          communication_signal: string | null
          created_at: string
          health_status: string
          id: string
          invoice_status_signal: string | null
          note: string | null
          product_activity_signal: string | null
          recorded_by_agent_id: string | null
          sentiment_signal: string | null
        }
        Insert: {
          client_id: string
          communication_signal?: string | null
          created_at?: string
          health_status: string
          id?: string
          invoice_status_signal?: string | null
          note?: string | null
          product_activity_signal?: string | null
          recorded_by_agent_id?: string | null
          sentiment_signal?: string | null
        }
        Update: {
          client_id?: string
          communication_signal?: string | null
          created_at?: string
          health_status?: string
          id?: string
          invoice_status_signal?: string | null
          note?: string | null
          product_activity_signal?: string | null
          recorded_by_agent_id?: string | null
          sentiment_signal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_health_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_history_recorded_by_agent_id_fkey"
            columns: ["recorded_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          assigned_am_id: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contract_end: string
          contract_start: string
          country: string | null
          created_at: string
          health_status: string
          id: string
          lead_id: string | null
          monthly_value: number
          onboarding_complete: boolean | null
          onboarding_completed_at: string | null
          proposal_id: string | null
          renewal_flagged_30d: boolean | null
          renewal_flagged_90d: boolean | null
          sector: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_am_id?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contract_end: string
          contract_start: string
          country?: string | null
          created_at?: string
          health_status?: string
          id?: string
          lead_id?: string | null
          monthly_value: number
          onboarding_complete?: boolean | null
          onboarding_completed_at?: string | null
          proposal_id?: string | null
          renewal_flagged_30d?: boolean | null
          renewal_flagged_90d?: boolean | null
          sector?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_am_id?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contract_end?: string
          contract_start?: string
          country?: string | null
          created_at?: string
          health_status?: string
          id?: string
          lead_id?: string | null
          monthly_value?: number
          onboarding_complete?: boolean | null
          onboarding_completed_at?: string | null
          proposal_id?: string | null
          renewal_flagged_30d?: boolean | null
          renewal_flagged_90d?: boolean | null
          sector?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_am_id_fkey"
            columns: ["assigned_am_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_learnings: {
        Row: {
          champion_effectiveness: string | null
          champion_role: string | null
          competitor_involved: boolean | null
          competitor_name: string | null
          competitor_win_reason: string | null
          created_at: string
          deal_velocity_days: number | null
          icp_match_notes: string | null
          icp_match_quality: string | null
          id: string
          key_learning: string
          lead_id: string
          loss_reason_primary: string | null
          loss_reason_secondary: string | null
          loss_type: string | null
          margin_achieved: number | null
          objections: Json | null
          outcome: string
          stage_lost_at: string | null
          velocity_by_stage: Json | null
        }
        Insert: {
          champion_effectiveness?: string | null
          champion_role?: string | null
          competitor_involved?: boolean | null
          competitor_name?: string | null
          competitor_win_reason?: string | null
          created_at?: string
          deal_velocity_days?: number | null
          icp_match_notes?: string | null
          icp_match_quality?: string | null
          id?: string
          key_learning: string
          lead_id: string
          loss_reason_primary?: string | null
          loss_reason_secondary?: string | null
          loss_type?: string | null
          margin_achieved?: number | null
          objections?: Json | null
          outcome: string
          stage_lost_at?: string | null
          velocity_by_stage?: Json | null
        }
        Update: {
          champion_effectiveness?: string | null
          champion_role?: string | null
          competitor_involved?: boolean | null
          competitor_name?: string | null
          competitor_win_reason?: string | null
          created_at?: string
          deal_velocity_days?: number | null
          icp_match_notes?: string | null
          icp_match_quality?: string | null
          id?: string
          key_learning?: string
          lead_id?: string
          loss_reason_primary?: string | null
          loss_reason_secondary?: string | null
          loss_type?: string | null
          margin_achieved?: number | null
          objections?: Json | null
          outcome?: string
          stage_lost_at?: string | null
          velocity_by_stage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_learnings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      heartbeats: {
        Row: {
          created_at: string
          fired_at: string
          id: string
          job_name: string
          scheduled_at: string
          status: string
          summary: string | null
        }
        Insert: {
          created_at?: string
          fired_at: string
          id?: string
          job_name: string
          scheduled_at: string
          status: string
          summary?: string | null
        }
        Update: {
          created_at?: string
          fired_at?: string
          id?: string
          job_name?: string
          scheduled_at?: string
          status?: string
          summary?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          archived_at: string | null
          client_id: string
          created_at: string
          due_date: string
          flag_level: string | null
          flag_note: string | null
          flagged: boolean | null
          id: string
          invoice_reference: string | null
          overdue_days: number | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          archived_at?: string | null
          client_id: string
          created_at?: string
          due_date: string
          flag_level?: string | null
          flag_note?: string | null
          flagged?: boolean | null
          id?: string
          invoice_reference?: string | null
          overdue_days?: number | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          archived_at?: string | null
          client_id?: string
          created_at?: string
          due_date?: string
          flag_level?: string | null
          flag_note?: string | null
          flagged?: boolean | null
          id?: string
          invoice_reference?: string | null
          overdue_days?: number | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_history: {
        Row: {
          changed_by_agent_id: string | null
          created_at: string
          from_stage: string | null
          id: string
          lead_id: string
          note: string | null
          to_stage: string
        }
        Insert: {
          changed_by_agent_id?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          lead_id: string
          note?: string | null
          to_stage: string
        }
        Update: {
          changed_by_agent_id?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_changed_by_agent_id_fkey"
            columns: ["changed_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          assigned_agent_id: string | null
          company_name: string
          contact_name: string | null
          contact_role: string | null
          country: string | null
          created_at: string
          disqualified_reason: string | null
          id: string
          last_activity_at: string | null
          meddic: Json | null
          qualified: boolean | null
          sdr_brief: Json | null
          sector: string | null
          source: string | null
          stage: string
          stall_flagged: boolean | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_agent_id?: string | null
          company_name: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          disqualified_reason?: string | null
          id?: string
          last_activity_at?: string | null
          meddic?: Json | null
          qualified?: boolean | null
          sdr_brief?: Json | null
          sector?: string | null
          source?: string | null
          stage: string
          stall_flagged?: boolean | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_agent_id?: string | null
          company_name?: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string | null
          created_at?: string
          disqualified_reason?: string | null
          id?: string
          last_activity_at?: string | null
          meddic?: Json | null
          qualified?: boolean | null
          sdr_brief?: Json | null
          sector?: string | null
          source?: string | null
          stage?: string
          stall_flagged?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_patterns: {
        Row: {
          client_id: string
          created_at: string
          day7_signals: string | null
          escalations: number | null
          friction_points: Json | null
          health_at_day30: string
          id: string
          key_learning: string
          time_to_value_days: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          day7_signals?: string | null
          escalations?: number | null
          friction_points?: Json | null
          health_at_day30: string
          id?: string
          key_learning: string
          time_to_value_days?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          day7_signals?: string | null
          escalations?: number | null
          friction_points?: Json | null
          health_at_day30?: string
          id?: string
          key_learning?: string
          time_to_value_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_patterns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          archived_at: string | null
          boss_approved: boolean | null
          boss_approved_at: string | null
          created_at: string
          follow_up_10d_sent: boolean | null
          follow_up_48h_sent: boolean | null
          follow_up_5d_sent: boolean | null
          gate_atlas_cleared: boolean | null
          gate_atlas_cleared_at: string | null
          gate_atlas_required: boolean | null
          gate_finance_cleared: boolean | null
          gate_finance_cleared_at: string | null
          gate_finance_notes: string | null
          gate_legal_cleared: boolean | null
          gate_legal_cleared_at: string | null
          gate_legal_notes: string | null
          id: string
          lead_id: string
          monthly_value: number | null
          outcome: string | null
          outcome_at: string | null
          payment_terms: string | null
          scope_summary: string | null
          sent_at: string | null
          status: string
          updated_at: string
          value: number | null
          version: number
        }
        Insert: {
          archived_at?: string | null
          boss_approved?: boolean | null
          boss_approved_at?: string | null
          created_at?: string
          follow_up_10d_sent?: boolean | null
          follow_up_48h_sent?: boolean | null
          follow_up_5d_sent?: boolean | null
          gate_atlas_cleared?: boolean | null
          gate_atlas_cleared_at?: string | null
          gate_atlas_required?: boolean | null
          gate_finance_cleared?: boolean | null
          gate_finance_cleared_at?: string | null
          gate_finance_notes?: string | null
          gate_legal_cleared?: boolean | null
          gate_legal_cleared_at?: string | null
          gate_legal_notes?: string | null
          id?: string
          lead_id: string
          monthly_value?: number | null
          outcome?: string | null
          outcome_at?: string | null
          payment_terms?: string | null
          scope_summary?: string | null
          sent_at?: string | null
          status: string
          updated_at?: string
          value?: number | null
          version?: number
        }
        Update: {
          archived_at?: string | null
          boss_approved?: boolean | null
          boss_approved_at?: string | null
          created_at?: string
          follow_up_10d_sent?: boolean | null
          follow_up_48h_sent?: boolean | null
          follow_up_5d_sent?: boolean | null
          gate_atlas_cleared?: boolean | null
          gate_atlas_cleared_at?: string | null
          gate_atlas_required?: boolean | null
          gate_finance_cleared?: boolean | null
          gate_finance_cleared_at?: string | null
          gate_finance_notes?: string | null
          gate_legal_cleared?: boolean | null
          gate_legal_cleared_at?: string | null
          gate_legal_notes?: string | null
          id?: string
          lead_id?: string
          monthly_value?: number | null
          outcome?: string | null
          outcome_at?: string | null
          payment_terms?: string | null
          scope_summary?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          value?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      valid_stage_transitions: {
        Row: {
          created_at: string
          from_stage: string
          id: string
          to_stage: string
        }
        Insert: {
          created_at?: string
          from_stage: string
          id?: string
          to_stage: string
        }
        Update: {
          created_at?: string
          from_stage?: string
          id?: string
          to_stage?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

