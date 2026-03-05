export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_comms: {
        Row: {
          channel: string | null
          created_at: string
          from_agent_id: string
          id: string
          message: string
          metadata: Json | null
          to_agent_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          from_agent_id: string
          id?: string
          message: string
          metadata?: Json | null
          to_agent_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          from_agent_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          to_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_comms_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_comms_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
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
      agent_souls: {
        Row: {
          agent_id: string
          content: string
          id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          content?: string
          id?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          content?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_souls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_token_usage: {
        Row: {
          agent_id: string | null
          cost_usd: number
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          recorded_at: string
          session_key: string | null
          task_description: string | null
        }
        Insert: {
          agent_id?: string | null
          cost_usd?: number
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          recorded_at?: string
          session_key?: string | null
          task_description?: string | null
        }
        Update: {
          agent_id?: string | null
          cost_usd?: number
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          recorded_at?: string
          session_key?: string | null
          task_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_token_usage_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          capabilities: Json | null
          created_at: string
          id: string
          last_seen: string | null
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
          capabilities?: Json | null
          created_at?: string
          id?: string
          last_seen?: string | null
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
          capabilities?: Json | null
          created_at?: string
          id?: string
          last_seen?: string | null
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
      alert_events: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          resolved: boolean
          resolved_at: string | null
          rule_id: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          resolved?: boolean
          resolved_at?: string | null
          rule_id?: string | null
          severity: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          resolved?: boolean
          resolved_at?: string | null
          rule_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string
          description: string | null
          enabled: boolean
          entity_type: string
          id: string
          name: string
          severity: string
        }
        Insert: {
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          entity_type: string
          id?: string
          name: string
          severity?: string
        }
        Update: {
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          entity_type?: string
          id?: string
          name?: string
          severity?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          change_reason: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          agent_id: string
          archived_at: string | null
          created_at: string
          id: string
          title: string | null
        }
        Insert: {
          agent_id: string
          archived_at?: string | null
          created_at?: string
          id?: string
          title?: string | null
        }
        Update: {
          agent_id?: string
          archived_at?: string | null
          created_at?: string
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      github_issues: {
        Row: {
          assignee: string | null
          body: string | null
          id: string
          integration_id: string | null
          issue_number: number
          labels: string[] | null
          repo: string
          state: string
          synced_at: string
          task_id: string | null
          title: string
        }
        Insert: {
          assignee?: string | null
          body?: string | null
          id?: string
          integration_id?: string | null
          issue_number: number
          labels?: string[] | null
          repo: string
          state?: string
          synced_at?: string
          task_id?: string | null
          title: string
        }
        Update: {
          assignee?: string | null
          body?: string | null
          id?: string
          integration_id?: string | null
          issue_number?: number
          labels?: string[] | null
          repo?: string
          state?: string
          synced_at?: string
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_issues_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_issues_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      integrations: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          last_sync_at: string | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_sync_at?: string | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_sync_at?: string | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean
          recipient: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          recipient?: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          recipient?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          completed_at: string | null
          error: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string
          status: string
          trigger_type: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string
          status?: string
          trigger_type?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string
          status?: string
          trigger_type?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          ticket_counter: number
          ticket_prefix: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          ticket_counter?: number
          ticket_prefix?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          ticket_counter?: number
          ticket_prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      quality_reviews: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reviewer: string
          status: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewer: string
          status?: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewer?: string
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_tasks: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          handler: string
          id: string
          last_run: string | null
          last_status: string | null
          name: string
          next_run: string | null
          schedule: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          handler: string
          id?: string
          last_run?: string | null
          last_status?: string | null
          name: string
          next_run?: string | null
          schedule: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          handler?: string
          id?: string
          last_run?: string | null
          last_status?: string | null
          name?: string
          next_run?: string | null
          schedule?: string
        }
        Relationships: []
      }
      standup_reports: {
        Row: {
          content: Json
          generated_at: string
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
        }
        Insert: {
          content: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
        }
        Update: {
          content?: Json
          generated_at?: string
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "standup_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          task_id: string
        }
        Insert: {
          author?: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          task_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_subscriptions: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_subscriptions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          labels: string[] | null
          metadata: Json | null
          priority: string
          project_id: string | null
          search_vector: unknown
          status: string
          ticket_ref: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[] | null
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          search_vector?: unknown
          status?: string
          ticket_ref?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[] | null
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          search_vector?: unknown
          status?: string
          ticket_ref?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          payload: Json
          response: string | null
          status_code: number | null
          success: boolean
          webhook_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          payload: Json
          response?: string | null
          status_code?: number | null
          success?: boolean
          webhook_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          payload?: Json
          response?: string | null
          status_code?: number | null
          success?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          consecutive_failures: number
          created_at: string
          enabled: boolean
          events: string[]
          id: string
          last_failure_at: string | null
          name: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          consecutive_failures?: number
          created_at?: string
          enabled?: boolean
          events?: string[]
          id?: string
          last_failure_at?: string | null
          name: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          consecutive_failures?: number
          created_at?: string
          enabled?: boolean
          events?: string[]
          id?: string
          last_failure_at?: string | null
          name?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          steps?: Json
          updated_at?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

