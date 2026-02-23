export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key_encrypted: string | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_encrypted?: string | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_encrypted?: string | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_shares: {
        Row: {
          accepted_at: string | null
          audit_id: string
          created_at: string
          expires_at: string
          id: string
          invited_at: string
          owner_id: string
          shared_with_email: string
          shared_with_user_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          audit_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_at?: string
          owner_id: string
          shared_with_email: string
          shared_with_user_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          audit_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_at?: string
          owner_id?: string
          shared_with_email?: string
          shared_with_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_shares_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          callback_token: string | null
          complexity: number | null
          context_metadata: Json | null
          contract_code: string | null
          contract_count: number
          contracts_completed: number | null
          contracts_total: number | null
          coverage_data: Json | null
          created_at: string
          credits_deducted: number | null
          credits_reserved: number
          current_contract: string | null
          error_message: string | null
          grade: Database["public"]["Enums"]["security_grade"] | null
          id: string
          is_locked: boolean
          last_heartbeat: string | null
          nloc_count: number | null
          project_name: string
          scope_metadata: Json | null
          security_score: number | null
          session_token: string | null
          session_token_hash: string | null
          source: string | null
          status: Database["public"]["Enums"]["audit_status"]
          system_hologram: Json | null
          tier_discount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          callback_token?: string | null
          complexity?: number | null
          context_metadata?: Json | null
          contract_code?: string | null
          contract_count?: number
          contracts_completed?: number | null
          contracts_total?: number | null
          coverage_data?: Json | null
          created_at?: string
          credits_deducted?: number | null
          credits_reserved?: number
          current_contract?: string | null
          error_message?: string | null
          grade?: Database["public"]["Enums"]["security_grade"] | null
          id?: string
          is_locked?: boolean
          last_heartbeat?: string | null
          nloc_count?: number | null
          project_name: string
          scope_metadata?: Json | null
          security_score?: number | null
          session_token?: string | null
          session_token_hash?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          system_hologram?: Json | null
          tier_discount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          callback_token?: string | null
          complexity?: number | null
          context_metadata?: Json | null
          contract_code?: string | null
          contract_count?: number
          contracts_completed?: number | null
          contracts_total?: number | null
          coverage_data?: Json | null
          created_at?: string
          credits_deducted?: number | null
          credits_reserved?: number
          current_contract?: string | null
          error_message?: string | null
          grade?: Database["public"]["Enums"]["security_grade"] | null
          id?: string
          is_locked?: boolean
          last_heartbeat?: string | null
          nloc_count?: number | null
          project_name?: string
          scope_metadata?: Json | null
          security_score?: number | null
          session_token?: string | null
          session_token_hash?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          system_hologram?: Json | null
          tier_discount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_profiles: {
        Row: {
          address_line1: string
          address_line2: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          city: string
          company_name: string | null
          country: string
          created_at: string | null
          id: string
          phone: string
          postal_code: string
          state: string
          tax_id: string | null
          updated_at: string | null
          use_different_billing_address: boolean | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          city: string
          company_name?: string | null
          country?: string
          created_at?: string | null
          id?: string
          phone: string
          postal_code: string
          state: string
          tax_id?: string | null
          updated_at?: string | null
          use_different_billing_address?: boolean | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          city?: string
          company_name?: string | null
          country?: string
          created_at?: string | null
          id?: string
          phone?: string
          postal_code?: string
          state?: string
          tax_id?: string | null
          updated_at?: string | null
          use_different_billing_address?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          started_at: string
          token_budget: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          started_at?: string
          token_budget: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          token_budget?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_txns: {
        Row: {
          amount: number
          audit_id: string | null
          balance_after: number | null
          created_at: string | null
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          audit_id?: string | null
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          audit_id?: string | null
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_txns_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_comments: {
        Row: {
          content: string
          created_at: string
          finding_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          finding_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          finding_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finding_comments_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          comment: string | null
          finding_id: string
          id: string
          new_resolved: boolean
          old_resolved: boolean | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          comment?: string | null
          finding_id: string
          id?: string
          new_resolved: boolean
          old_resolved?: boolean | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          comment?: string | null
          finding_id?: string
          id?: string
          new_resolved?: boolean
          old_resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_status_history_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          audit_id: string
          code_snippet: string | null
          created_at: string
          description: string
          id: string
          is_resolved: boolean
          line_end: number | null
          line_start: number | null
          location: string | null
          remediation: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          title: string
        }
        Insert: {
          audit_id: string
          code_snippet?: string | null
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean
          line_end?: number | null
          line_start?: number | null
          location?: string | null
          remediation?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          title: string
        }
        Update: {
          audit_id?: string
          code_snippet?: string | null
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean
          line_end?: number | null
          line_start?: number | null
          location?: string | null
          remediation?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      github_connections: {
        Row: {
          connected_at: string | null
          github_access_token: string
          github_avatar_url: string | null
          github_username: string
          id: string
          scopes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          github_access_token: string
          github_avatar_url?: string | null
          github_username: string
          id?: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected_at?: string | null
          github_access_token?: string
          github_avatar_url?: string | null
          github_username?: string
          id?: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nloc_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          credits_reserved: number
          credits_used_this_period: number
          id: string
          period_reset_at: string | null
          scans_remaining: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          credits_reserved?: number
          credits_used_this_period?: number
          id?: string
          period_reset_at?: string | null
          scans_remaining?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          credits_reserved?: number
          credits_used_this_period?: number
          id?: string
          period_reset_at?: string | null
          scans_remaining?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          amount_cents: number
          billing_period: string | null
          cf_payment_id: string | null
          created_at: string | null
          credits_amount: number | null
          currency: string | null
          id: string
          metadata: Json | null
          order_id: string
          order_type: string
          payment_session_id: string | null
          plan: string | null
          processed_at: string | null
          rz_order_id: string | null
          rz_payment_id: string | null
          rz_payment_link_id: string | null
          rz_signature: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          billing_period?: string | null
          cf_payment_id?: string | null
          created_at?: string | null
          credits_amount?: number | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          order_type: string
          payment_session_id?: string | null
          plan?: string | null
          processed_at?: string | null
          rz_order_id?: string | null
          rz_payment_id?: string | null
          rz_payment_link_id?: string | null
          rz_signature?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          billing_period?: string | null
          cf_payment_id?: string | null
          created_at?: string | null
          credits_amount?: number | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          order_type?: string
          payment_session_id?: string | null
          plan?: string | null
          processed_at?: string | null
          rz_order_id?: string | null
          rz_payment_id?: string | null
          rz_payment_link_id?: string | null
          rz_signature?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      power_up_purchases: {
        Row: {
          id: string
          nloc_amount: number
          price_cents: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          nloc_amount: number
          price_cents: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          nloc_amount?: number
          price_cents?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          event_id: string | null
          event_type: string
          id: string
          payment_id: string | null
          processed_at: string | null
          raw_payload: Json | null
          status: string | null
          subscription_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payment_id?: string | null
          processed_at?: string | null
          raw_payload?: Json | null
          status?: string | null
          subscription_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payment_id?: string | null
          processed_at?: string | null
          raw_payload?: Json | null
          status?: string | null
          subscription_id?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          changed_at: string
          id: string
          new_plan: Database["public"]["Enums"]["subscription_plan"]
          previous_plan: Database["public"]["Enums"]["subscription_plan"] | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_plan: Database["public"]["Enums"]["subscription_plan"]
          previous_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_plan?: Database["public"]["Enums"]["subscription_plan"]
          previous_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          payment_method_saved: boolean | null
          pending_plan: Database["public"]["Enums"]["subscription_plan"] | null
          pending_plan_effective_date: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          rz_plan_id: string | null
          rz_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          payment_method_saved?: boolean | null
          pending_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          pending_plan_effective_date?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          rz_plan_id?: string | null
          rz_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          payment_method_saved?: boolean | null
          pending_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          pending_plan_effective_date?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          rz_plan_id?: string | null
          rz_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_share_invitation: { Args: { p_share_id: string }; Returns: Json }
      auto_settle_stale_sessions: { Args: never; Returns: undefined }
      cancel_pending_downgrade: { Args: never; Returns: Json }
      cancel_subscription: { Args: never; Returns: Json }
      cli_commit_credits: {
        Args: {
          p_amount: number
          p_audit_id: string
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      cli_deduct_credits: {
        Args: {
          p_amount: number
          p_audit_id: string
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      cli_refund_credits: {
        Args: {
          p_amount: number
          p_audit_id: string
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      cli_release_credits: {
        Args: {
          p_amount: number
          p_audit_id: string
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      cli_reserve_credits: {
        Args: {
          p_amount: number
          p_audit_id: string
          p_description: string
          p_user_id: string
        }
        Returns: Json
      }
      create_payment_order: {
        Args: {
          p_amount_cents: number
          p_billing_period?: string
          p_credits_amount?: number
          p_order_id: string
          p_order_type: string
          p_payment_session_id: string
          p_plan?: string
          p_user_id: string
        }
        Returns: Json
      }
      deduct_credits:
        | {
            Args: { p_is_starter?: boolean; p_nloc_amount: number }
            Returns: Json
          }
        | {
            Args: {
              p_audit_id?: string
              p_description?: string
              p_is_starter?: boolean
              p_nloc_amount: number
            }
            Returns: Json
          }
      get_audit_access_context: { Args: { p_audit_id: string }; Returns: Json }
      get_audit_owner_info: {
        Args: { owner_user_id: string }
        Returns: {
          display_name: string
          email: string
        }[]
      }
      get_my_pending_share_invitations: {
        Args: never
        Returns: {
          audit_id: string
          expires_at: string
          id: string
          invited_at: string
          owner_display_name: string
          owner_email: string
          owner_id: string
          project_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_chat_tokens: {
        Args: { p_session_id: string; p_tokens: number }
        Returns: number
      }
      mark_payment_failed: { Args: { p_order_id: string }; Returns: Json }
      process_payment_success: {
        Args: { p_cf_payment_id: string; p_order_id: string }
        Returns: Json
      }
      purchase_power_up: {
        Args: { p_nloc_amount: number; p_price_cents: number }
        Returns: Json
      }
      purchase_subscription: {
        Args: { p_billing_period: string; p_plan: string }
        Returns: Json
      }
      reactivate_subscription: { Args: never; Returns: Json }
      refund_credits: {
        Args: {
          p_is_starter?: boolean
          p_nloc_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      schedule_downgrade: { Args: { p_target_plan: string }; Returns: Json }
      search_user_by_email: {
        Args: { search_email: string }
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      audit_status:
        | "pending"
        | "analyzing"
        | "secured"
        | "issues"
        | "cancelled"
        | "failed"
      finding_severity: "critical" | "high" | "medium" | "low" | "info"
      security_grade: "A" | "B" | "C" | "D" | "F"
      subscription_plan: "starter" | "pro" | "business"
      subscription_status: "active" | "canceled" | "past_due"
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
    Enums: {
      app_role: ["admin", "user"],
      audit_status: [
        "pending",
        "analyzing",
        "secured",
        "issues",
        "cancelled",
        "failed",
      ],
      finding_severity: ["critical", "high", "medium", "low", "info"],
      security_grade: ["A", "B", "C", "D", "F"],
      subscription_plan: ["starter", "pro", "business"],
      subscription_status: ["active", "canceled", "past_due"],
    },
  },
} as const
