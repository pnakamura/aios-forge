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
          changelog: Json
          commands: Json
          created_at: string
          created_in_library: boolean
          definition_md: string
          id: string
          is_custom: boolean
          is_public: boolean
          llm_model: string
          name: string
          parent_id: string | null
          project_id: string
          published_at: string | null
          role: string
          skills: Json
          slug: string
          status: string
          system_prompt: string
          tags: Json
          tools: Json
          updated_at: string
          usage_count: number
          version: string
          visibility: string
        }
        Insert: {
          changelog?: Json
          commands?: Json
          created_at?: string
          created_in_library?: boolean
          definition_md?: string
          id?: string
          is_custom?: boolean
          is_public?: boolean
          llm_model?: string
          name: string
          parent_id?: string | null
          project_id: string
          published_at?: string | null
          role: string
          skills?: Json
          slug: string
          status?: string
          system_prompt?: string
          tags?: Json
          tools?: Json
          updated_at?: string
          usage_count?: number
          version?: string
          visibility?: string
        }
        Update: {
          changelog?: Json
          commands?: Json
          created_at?: string
          created_in_library?: boolean
          definition_md?: string
          id?: string
          is_custom?: boolean
          is_public?: boolean
          llm_model?: string
          name?: string
          parent_id?: string | null
          project_id?: string
          published_at?: string | null
          role?: string
          skills?: Json
          slug?: string
          status?: string
          system_prompt?: string
          tags?: Json
          tools?: Json
          updated_at?: string
          usage_count?: number
          version?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_entries: {
        Row: {
          context: Json | null
          created_at: string
          data: Json
          id: string
          project_id: string | null
          score: number | null
          session_id: string | null
          type: Database["public"]["Enums"]["feedback_type"]
        }
        Insert: {
          context?: Json | null
          created_at?: string
          data?: Json
          id?: string
          project_id?: string | null
          score?: number | null
          session_id?: string | null
          type: Database["public"]["Enums"]["feedback_type"]
        }
        Update: {
          context?: Json | null
          created_at?: string
          data?: Json
          id?: string
          project_id?: string | null
          score?: number | null
          session_id?: string | null
          type?: Database["public"]["Enums"]["feedback_type"]
        }
        Relationships: [
          {
            foreignKeyName: "feedback_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "wizard_sessions"
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
      generation_audits: {
        Row: {
          created_at: string
          errors: Json
          file_count: number
          generated_files: Json
          generation_time_ms: number
          id: string
          install_test: Json | null
          is_valid: boolean
          project_id: string
          total_size_bytes: number
          validation_result: Json
          warnings: Json
        }
        Insert: {
          created_at?: string
          errors?: Json
          file_count?: number
          generated_files?: Json
          generation_time_ms?: number
          id?: string
          install_test?: Json | null
          is_valid?: boolean
          project_id: string
          total_size_bytes?: number
          validation_result?: Json
          warnings?: Json
        }
        Update: {
          created_at?: string
          errors?: Json
          file_count?: number
          generated_files?: Json
          generation_time_ms?: number
          id?: string
          install_test?: Json | null
          is_valid?: boolean
          project_id?: string
          total_size_bytes?: number
          validation_result?: Json
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "generation_audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      improvements: {
        Row: {
          after_value: string
          applied_at: string | null
          before_value: string
          confidence: number
          created_at: string
          description: string
          id: string
          impact_score: number | null
          reason: string
          reverted_at: string | null
          status: Database["public"]["Enums"]["improvement_status"]
          target: Database["public"]["Enums"]["improvement_target"]
          target_id: string | null
          updated_at: string
        }
        Insert: {
          after_value?: string
          applied_at?: string | null
          before_value?: string
          confidence?: number
          created_at?: string
          description: string
          id?: string
          impact_score?: number | null
          reason?: string
          reverted_at?: string | null
          status?: Database["public"]["Enums"]["improvement_status"]
          target: Database["public"]["Enums"]["improvement_target"]
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          after_value?: string
          applied_at?: string | null
          before_value?: string
          confidence?: number
          created_at?: string
          description?: string
          id?: string
          impact_score?: number | null
          reason?: string
          reverted_at?: string | null
          status?: Database["public"]["Enums"]["improvement_status"]
          target?: Database["public"]["Enums"]["improvement_target"]
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      library_editor_sessions: {
        Row: {
          ai_context: Json
          ai_messages: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          last_saved_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_context?: Json
          ai_messages?: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          last_saved_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_context?: Json
          ai_messages?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_saved_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      library_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
          workflows: Json
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
          workflows?: Json
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
          workflows?: Json
        }
        Relationships: []
      }
      quality_metrics: {
        Row: {
          created_at: string
          dimensions: Json | null
          id: string
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
          sample_size: number
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_value: number
          period_end: string
          period_start: string
          sample_size?: number
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_value?: number
          period_end?: string
          period_start?: string
          sample_size?: number
        }
        Relationships: []
      }
      skills: {
        Row: {
          agent_id: string | null
          category: string
          changelog: Json
          created_at: string
          created_in_library: boolean
          description: string
          examples: Json
          id: string
          inputs: Json
          is_public: boolean
          name: string
          outputs: Json
          parent_id: string | null
          project_id: string
          prompt: string
          published_at: string | null
          slug: string
          status: string
          tags: Json
          updated_at: string
          usage_count: number
          version: string
        }
        Insert: {
          agent_id?: string | null
          category?: string
          changelog?: Json
          created_at?: string
          created_in_library?: boolean
          description?: string
          examples?: Json
          id?: string
          inputs?: Json
          is_public?: boolean
          name: string
          outputs?: Json
          parent_id?: string | null
          project_id: string
          prompt?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: Json
          updated_at?: string
          usage_count?: number
          version?: string
        }
        Update: {
          agent_id?: string | null
          category?: string
          changelog?: Json
          created_at?: string
          created_in_library?: boolean
          description?: string
          examples?: Json
          id?: string
          inputs?: Json
          is_public?: boolean
          name?: string
          outputs?: Json
          parent_id?: string | null
          project_id?: string
          prompt?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: Json
          updated_at?: string
          usage_count?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          agent_ids: Json
          changelog: Json
          created_at: string
          created_in_library: boolean
          description: string | null
          id: string
          is_public: boolean
          is_validated: boolean
          manifest_yaml: string
          name: string
          parent_id: string | null
          project_id: string
          published_at: string | null
          slug: string
          status: string
          tags: Json
          tasks: Json
          updated_at: string
          usage_count: number
          version: string
          workflows: Json
        }
        Insert: {
          agent_ids?: Json
          changelog?: Json
          created_at?: string
          created_in_library?: boolean
          description?: string | null
          id?: string
          is_public?: boolean
          is_validated?: boolean
          manifest_yaml?: string
          name: string
          parent_id?: string | null
          project_id: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: Json
          tasks?: Json
          updated_at?: string
          usage_count?: number
          version?: string
          workflows?: Json
        }
        Update: {
          agent_ids?: Json
          changelog?: Json
          created_at?: string
          created_in_library?: boolean
          description?: string | null
          id?: string
          is_public?: boolean
          is_validated?: boolean
          manifest_yaml?: string
          name?: string
          parent_id?: string | null
          project_id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: Json
          tasks?: Json
          updated_at?: string
          usage_count?: number
          version?: string
          workflows?: Json
        }
        Relationships: [
          {
            foreignKeyName: "squads_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
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
      workflows_library: {
        Row: {
          changelog: Json
          created_at: string
          created_in_library: boolean
          description: string
          id: string
          is_public: boolean
          name: string
          outputs: Json
          parent_id: string | null
          pattern: string
          project_id: string
          published_at: string | null
          slug: string
          squad_id: string | null
          status: string
          steps: Json
          tags: Json
          triggers: Json
          updated_at: string
          usage_count: number
          version: string
        }
        Insert: {
          changelog?: Json
          created_at?: string
          created_in_library?: boolean
          description?: string
          id?: string
          is_public?: boolean
          name: string
          outputs?: Json
          parent_id?: string | null
          pattern?: string
          project_id: string
          published_at?: string | null
          slug: string
          squad_id?: string | null
          status?: string
          steps?: Json
          tags?: Json
          triggers?: Json
          updated_at?: string
          usage_count?: number
          version?: string
        }
        Update: {
          changelog?: Json
          created_at?: string
          created_in_library?: boolean
          description?: string
          id?: string
          is_public?: boolean
          name?: string
          outputs?: Json
          parent_id?: string | null
          pattern?: string
          project_id?: string
          published_at?: string | null
          slug?: string
          squad_id?: string | null
          status?: string
          steps?: Json
          tags?: Json
          triggers?: Json
          updated_at?: string
          usage_count?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_library_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workflows_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_library_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_library_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
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
      feedback_type:
        | "WIZARD_STEP_COMPLETION"
        | "AGENT_SELECTION"
        | "AGENT_CUSTOMIZATION"
        | "SQUAD_CREATION"
        | "GENERATION_SUCCESS"
        | "GENERATION_FAILURE"
        | "EXPORT_SUCCESS"
        | "EXPORT_FAILURE"
        | "VALIDATION_RESULT"
        | "USER_RATING"
        | "INSTALLATION_TEST"
        | "PROMPT_EFFECTIVENESS"
      improvement_status:
        | "PROPOSED"
        | "APPROVED"
        | "APPLIED"
        | "REVERTED"
        | "REJECTED"
      improvement_target:
        | "SYSTEM_PROMPT"
        | "AGENT_TEMPLATE"
        | "SQUAD_TEMPLATE"
        | "GENERATION_TEMPLATE"
        | "VALIDATION_RULE"
        | "ORCHESTRATION_PATTERN"
        | "UI_DEFAULT"
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
      feedback_type: [
        "WIZARD_STEP_COMPLETION",
        "AGENT_SELECTION",
        "AGENT_CUSTOMIZATION",
        "SQUAD_CREATION",
        "GENERATION_SUCCESS",
        "GENERATION_FAILURE",
        "EXPORT_SUCCESS",
        "EXPORT_FAILURE",
        "VALIDATION_RESULT",
        "USER_RATING",
        "INSTALLATION_TEST",
        "PROMPT_EFFECTIVENESS",
      ],
      improvement_status: [
        "PROPOSED",
        "APPROVED",
        "APPLIED",
        "REVERTED",
        "REJECTED",
      ],
      improvement_target: [
        "SYSTEM_PROMPT",
        "AGENT_TEMPLATE",
        "SQUAD_TEMPLATE",
        "GENERATION_TEMPLATE",
        "VALIDATION_RULE",
        "ORCHESTRATION_PATTERN",
        "UI_DEFAULT",
      ],
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
