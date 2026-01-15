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
      audits: {
        Row: {
          contract_code: string
          contract_count: number
          coverage_data: Json | null
          created_at: string
          grade: Database["public"]["Enums"]["security_grade"] | null
          id: string
          nloc_count: number | null
          project_name: string
          security_score: number | null
          status: Database["public"]["Enums"]["audit_status"]
          system_hologram: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_code: string
          contract_count?: number
          coverage_data?: Json | null
          created_at?: string
          grade?: Database["public"]["Enums"]["security_grade"] | null
          id?: string
          nloc_count?: number | null
          project_name: string
          security_score?: number | null
          status?: Database["public"]["Enums"]["audit_status"]
          system_hologram?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_code?: string
          contract_count?: number
          coverage_data?: Json | null
          created_at?: string
          grade?: Database["public"]["Enums"]["security_grade"] | null
          id?: string
          nloc_count?: number | null
          project_name?: string
          security_score?: number | null
          status?: Database["public"]["Enums"]["audit_status"]
          system_hologram?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      nloc_credits: {
        Row: {
          created_at: string
          credits_remaining: number
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
          credits_used_this_period?: number
          id?: string
          period_reset_at?: string | null
          scans_remaining?: number
          updated_at?: string
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
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
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
      deduct_credits: {
        Args: { p_is_starter?: boolean; p_nloc_amount: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purchase_power_up: {
        Args: { p_nloc_amount: number; p_price_cents: number }
        Returns: Json
      }
      refund_credits: {
        Args: {
          p_is_starter?: boolean
          p_nloc_amount: number
          p_user_id: string
        }
        Returns: Json
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
      subscription_plan: "starter" | "pro"
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
      subscription_plan: ["starter", "pro"],
      subscription_status: ["active", "canceled", "past_due"],
    },
  },
} as const
