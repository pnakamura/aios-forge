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
      agents: {
        Row: {
          commands: Json
          created_at: string
          definition_md: string
          id: string
          is_custom: boolean
          llm_model: string
          name: string
          project_id: string
          role: string
          skills: Json
          slug: string
          system_prompt: string
          tools: Json
          updated_at: string
          visibility: string
        }
        Insert: {
          commands?: Json
          created_at?: string
          definition_md?: string
          id?: string
          is_custom?: boolean
          llm_model?: string
          name: string
          project_id: string
          role: string
          skills?: Json
          slug: string
          system_prompt?: string
          tools?: Json
          updated_at?: string
          visibility?: string
        }
        Update: {
          commands?: Json
          created_at?: string
          definition_md?: string
          id?: string
          is_custom?: boolean
          llm_model?: string
          name?: string
          project_id?: string
          role?: string
          skills?: Json
          slug?: string
          system_prompt?: string
          tools?: Json
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_files: {
        Row: {
          compliance_notes: string | null
          compliance_status: string
          content: string
          created_at: string
          file_type: string
          id: string
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          compliance_notes?: string | null
          compliance_status?: string
          content: string
          created_at?: string
          file_type?: string
          id?: string
          path: string
          project_id: string
          updated_at?: string
        }
        Update: {
          compliance_notes?: string | null
          compliance_status?: string
          content?: string
          created_at?: string
          file_type?: string
          id?: string
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["integration_status"]
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["integration_status"]
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["integration_status"]
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          domain: string
          id: string
          name: string
          orchestration_pattern: Database["public"]["Enums"]["orchestration_pattern"]
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          name: string
          orchestration_pattern?: Database["public"]["Enums"]["orchestration_pattern"]
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          name?: string
          orchestration_pattern?: Database["public"]["Enums"]["orchestration_pattern"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      squads: {
        Row: {
          agent_ids: Json
          created_at: string
          description: string | null
          id: string
          is_validated: boolean
          manifest_yaml: string
          name: string
          project_id: string
          slug: string
          tasks: Json
          updated_at: string
          workflows: Json
        }
        Insert: {
          agent_ids?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_validated?: boolean
          manifest_yaml?: string
          name: string
          project_id: string
          slug: string
          tasks?: Json
          updated_at?: string
          workflows?: Json
        }
        Update: {
          agent_ids?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_validated?: boolean
          manifest_yaml?: string
          name?: string
          project_id?: string
          slug?: string
          tasks?: Json
          updated_at?: string
          workflows?: Json
        }
        Relationships: [
          {
            foreignKeyName: "squads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wizard_sessions: {
        Row: {
          completed: boolean
          created_at: string
          current_step: number
          id: string
          messages: Json
          project_id: string | null
          updated_at: string
          user_id: string
          wizard_state: Json
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_step?: number
          id?: string
          messages?: Json
          project_id?: string | null
          updated_at?: string
          user_id: string
          wizard_state?: Json
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_step?: number
          id?: string
          messages?: Json
          project_id?: string | null
          updated_at?: string
          user_id?: string
          wizard_state?: Json
        }
        Relationships: [
          {
            foreignKeyName: "wizard_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      integration_status: "CONFIGURED" | "TESTED" | "FAILED"
      integration_type:
        | "N8N"
        | "CLAUDE_API"
        | "MCP_SERVER"
        | "NOTION"
        | "MIRO"
        | "OPENAI_API"
      orchestration_pattern:
        | "SEQUENTIAL_PIPELINE"
        | "PARALLEL_SWARM"
        | "HIERARCHICAL"
        | "WATCHDOG"
        | "COLLABORATIVE"
        | "TASK_FIRST"
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
      integration_status: ["CONFIGURED", "TESTED", "FAILED"],
      integration_type: [
        "N8N",
        "CLAUDE_API",
        "MCP_SERVER",
        "NOTION",
        "MIRO",
        "OPENAI_API",
      ],
      orchestration_pattern: [
        "SEQUENTIAL_PIPELINE",
        "PARALLEL_SWARM",
        "HIERARCHICAL",
        "WATCHDOG",
        "COLLABORATIVE",
        "TASK_FIRST",
      ],
    },
  },
} as const
