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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      external_quotes: {
        Row: {
          author: string | null
          external_key: string
          fetched_at: string
          id: string
          relevance_score: number | null
          search_term: string | null
          sentiment: string | null
          source: string
          text: string
          theme: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          external_key: string
          fetched_at?: string
          id?: string
          relevance_score?: number | null
          search_term?: string | null
          sentiment?: string | null
          source: string
          text: string
          theme?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          external_key?: string
          fetched_at?: string
          id?: string
          relevance_score?: number | null
          search_term?: string | null
          sentiment?: string | null
          source?: string
          text?: string
          theme?: string | null
          url?: string | null
        }
        Relationships: []
      }
      kb_sources: {
        Row: {
          created_at: string
          drive_file_id: string | null
          drive_url: string | null
          entries_count: number
          id: string
          kind: string
          last_error: string | null
          last_status: string | null
          last_synced_at: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          drive_file_id?: string | null
          drive_url?: string | null
          entries_count?: number
          id?: string
          kind: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          drive_file_id?: string | null
          drive_url?: string | null
          entries_count?: number
          id?: string
          kind?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      kb_sync_runs: {
        Row: {
          added: number
          error: string | null
          finished_at: string | null
          id: string
          removed: number
          source_id: string | null
          started_at: string
          status: string
          total: number
        }
        Insert: {
          added?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          removed?: number
          source_id?: string | null
          started_at?: string
          status: string
          total?: number
        }
        Update: {
          added?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          removed?: number
          source_id?: string | null
          started_at?: string
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "kb_sync_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_synced_entries: {
        Row: {
          answer: string | null
          category: string | null
          data: Json | null
          external_key: string
          id: string
          question: string | null
          source_id: string
          synced_at: string
          title: string | null
        }
        Insert: {
          answer?: string | null
          category?: string | null
          data?: Json | null
          external_key: string
          id?: string
          question?: string | null
          source_id: string
          synced_at?: string
          title?: string | null
        }
        Update: {
          answer?: string | null
          category?: string | null
          data?: Json | null
          external_key?: string
          id?: string
          question?: string | null
          source_id?: string
          synced_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_synced_entries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_briefs: {
        Row: {
          generated_at: string
          id: string
          intro: string
          items: Json
          month: string
          title: string
        }
        Insert: {
          generated_at?: string
          id?: string
          intro: string
          items?: Json
          month: string
          title: string
        }
        Update: {
          generated_at?: string
          id?: string
          intro?: string
          items?: Json
          month?: string
          title?: string
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
