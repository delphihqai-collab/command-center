Connecting to db.bplgfzymyinggwebvcqv.supabase.co 5432
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
      agent_pools: {
        Row: {
          base_agent_id: string
          capability: string
          created_at: string
          current_instances: number
          description: string | null
          display_name: string
          enabled: boolean
          id: string
          max_instances: number
          min_instances: number
          scaling_config: Json | null
          scaling_strategy: string
          updated_at: string
        }
        Insert: {
          base_agent_id: string
          capability: string
          created_at?: string
          current_instances?: number
          description?: string | null
          display_name: string
          enabled?: boolean
          id?: string
          max_instances?: number
          min_instances?: number
          scaling_config?: Json | null
          scaling_strategy?: string
          updated_at?: string
        }
        Update: {
          base_agent_id?: string
          capability?: string
          created_at?: string
          current_instances?: number
          description?: string | null
          display_name?: string
          enabled?: boolean
          id?: string
          max_instances?: number
          min_instances?: number
          scaling_config?: Json | null
          scaling_strategy?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_pools_base_agent_id_fkey"
            columns: ["base_agent_id"]
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
      daily_targets: {
        Row: {
          created_at: string
          date: string
          id: string
          leads_actual: number | null
          leads_target: number | null
          meetings_actual: number | null
          meetings_target: number | null
          notes: string | null
          outreach_actual: number | null
          outreach_target: number | null
          revenue_actual: number | null
          revenue_target: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          leads_actual?: number | null
          leads_target?: number | null
          meetings_actual?: number | null
          meetings_target?: number | null
          notes?: string | null
          outreach_actual?: number | null
          outreach_target?: number | null
          revenue_actual?: number | null
          revenue_target?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          leads_actual?: number | null
          leads_target?: number | null
          meetings_actual?: number | null
          meetings_target?: number | null
          notes?: string | null
          outreach_actual?: number | null
          outreach_target?: number | null
          revenue_actual?: number | null
          revenue_target?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fleet_experiments: {
        Row: {
          agent_id: string | null
          category: string
          completed_at: string | null
          config: Json | null
          created_at: string
          hypothesis: string
          id: string
          name: string
          results: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          category: string
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          hypothesis: string
          id?: string
          name: string
          results?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          category?: string
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          hypothesis?: string
          id?: string
          name?: string
          results?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_experiments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
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
      outreach_sequences: {
        Row: {
          channel: string
          clicked_at: string | null
          created_at: string
          id: string
          lead_id: string
          message_preview: string | null
          opened_at: string | null
          replied_at: string | null
          reply_sentiment: string | null
          sent_at: string | null
          status: string
          step_number: number
          template_id: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          message_preview?: string | null
          opened_at?: string | null
          replied_at?: string | null
          reply_sentiment?: string | null
          sent_at?: string | null
          status?: string
          step_number: number
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          message_preview?: string | null
          opened_at?: string | null
          replied_at?: string | null
          reply_sentiment?: string | null
          sent_at?: string | null
          status?: string
          step_number?: number
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_sequences_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "outreach_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_templates: {
        Row: {
          active: boolean | null
          avg_open_rate: number | null
          avg_reply_rate: number | null
          body: string
          category: string
          channel: string
          created_at: string
          id: string
          name: string
          subject: string | null
          times_used: number | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          active?: boolean | null
          avg_open_rate?: number | null
          avg_reply_rate?: number | null
          body: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          times_used?: number | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          active?: boolean | null
          avg_open_rate?: number | null
          avg_reply_rate?: number | null
          body?: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          times_used?: number | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      pipeline_leads: {
        Row: {
          assigned_agent_id: string | null
          channel: string | null
          closed_at: string | null
          company_industry: string | null
          company_location: string | null
          company_name: string
          company_revenue: string | null
          company_size: string | null
          company_tech_stack: string[] | null
          company_website: string | null
          confidence: number | null
          contact_email: string | null
          contact_name: string
          contact_role: string | null
          created_at: string
          deal_value_eur: number | null
          discovery_notes: string | null
          disqualify_reason: string | null
          email_clicks: number | null
          email_opens: number | null
          icp_score: number | null
          id: string
          intent_score: number | null
          last_touch_at: string | null
          linkedin_url: string | null
          lost_reason: string | null
          meeting_notes: string | null
          meeting_scheduled_at: string | null
          metadata: Json
          next_touch_at: string | null
          outreach_status: string | null
          proposal_url: string | null
          re_engage_after: string | null
          reply_sentiment: string | null
          review_decision: string | null
          reviewed_at: string | null
          sdr_brief: string | null
          sequence_started_at: string | null
          sequence_step: number | null
          source: string
          stage: string
          touch_count: number | null
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          channel?: string | null
          closed_at?: string | null
          company_industry?: string | null
          company_location?: string | null
          company_name: string
          company_revenue?: string | null
          company_size?: string | null
          company_tech_stack?: string[] | null
          company_website?: string | null
          confidence?: number | null
          contact_email?: string | null
          contact_name: string
          contact_role?: string | null
          created_at?: string
          deal_value_eur?: number | null
          discovery_notes?: string | null
          disqualify_reason?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          icp_score?: number | null
          id?: string
          intent_score?: number | null
          last_touch_at?: string | null
          linkedin_url?: string | null
          lost_reason?: string | null
          meeting_notes?: string | null
          meeting_scheduled_at?: string | null
          metadata?: Json
          next_touch_at?: string | null
          outreach_status?: string | null
          proposal_url?: string | null
          re_engage_after?: string | null
          reply_sentiment?: string | null
          review_decision?: string | null
          reviewed_at?: string | null
          sdr_brief?: string | null
          sequence_started_at?: string | null
          sequence_step?: number | null
          source?: string
          stage?: string
          touch_count?: number | null
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          channel?: string | null
          closed_at?: string | null
          company_industry?: string | null
          company_location?: string | null
          company_name?: string
          company_revenue?: string | null
          company_size?: string | null
          company_tech_stack?: string[] | null
          company_website?: string | null
          confidence?: number | null
          contact_email?: string | null
          contact_name?: string
          contact_role?: string | null
          created_at?: string
          deal_value_eur?: number | null
          discovery_notes?: string | null
          disqualify_reason?: string | null
          email_clicks?: number | null
          email_opens?: number | null
          icp_score?: number | null
          id?: string
          intent_score?: number | null
          last_touch_at?: string | null
          linkedin_url?: string | null
          lost_reason?: string | null
          meeting_notes?: string | null
          meeting_scheduled_at?: string | null
          metadata?: Json
          next_touch_at?: string | null
          outreach_status?: string | null
          proposal_url?: string | null
          re_engage_after?: string | null
          reply_sentiment?: string | null
          review_decision?: string | null
          reviewed_at?: string | null
          sdr_brief?: string | null
          sequence_started_at?: string | null
          sequence_step?: number | null
          source?: string
          stage?: string
          touch_count?: number | null
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
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
      review_queue: {
        Row: {
          context: string | null
          created_at: string
          decided_at: string | null
          decision: string | null
          decision_notes: string | null
          id: string
          lead_id: string
          requested_by: string | null
          review_type: string
          status: string
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_notes?: string | null
          id?: string
          lead_id: string
          requested_by?: string | null
          review_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_notes?: string | null
          id?: string
          lead_id?: string
          requested_by?: string | null
          review_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_requested_by_fkey"
            columns: ["requested_by"]
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
      team_topology: {
        Row: {
          channel_type: string
          created_at: string
          description: string | null
          enabled: boolean
          from_agent_id: string
          id: string
          to_agent_id: string
          updated_at: string
        }
        Insert: {
          channel_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          from_agent_id: string
          id?: string
          to_agent_id: string
          updated_at?: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          from_agent_id?: string
          id?: string
          to_agent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_topology_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_topology_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      war_room_activity: {
        Row: {
          action: string
          agent_id: string | null
          created_at: string
          detail: string | null
          id: string
          metadata: Json | null
          war_room_id: string
        }
        Insert: {
          action: string
          agent_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          metadata?: Json | null
          war_room_id: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          metadata?: Json | null
          war_room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_room_activity_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "war_room_activity_war_room_id_fkey"
            columns: ["war_room_id"]
            isOneToOne: false
            referencedRelation: "war_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      war_room_agents: {
        Row: {
          agent_id: string
          id: string
          joined_at: string
          role: string
          war_room_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          joined_at?: string
          role?: string
          war_room_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          joined_at?: string
          role?: string
          war_room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_room_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "war_room_agents_war_room_id_fkey"
            columns: ["war_room_id"]
            isOneToOne: false
            referencedRelation: "war_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      war_rooms: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          lead_id: string | null
          name: string
          objective: string | null
          priority: string
          resolved_at: string | null
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          lead_id?: string | null
          name: string
          objective?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          lead_id?: string | null
          name?: string
          objective?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_rooms_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pipeline_leads"
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

