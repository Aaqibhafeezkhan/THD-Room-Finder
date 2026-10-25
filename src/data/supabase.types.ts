// Generated from the local database: npx supabase gen types typescript --local --schema public
// Do not edit by hand; regenerate after changing supabase/migrations.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "cancel_gathering":
{ Args: { "p_link": string }; Returns: Json
                           },
"cancel_table":
{ Args: { "p_link": string }; Returns: Json
                           },
"change_gathering":
{ Args: { "p_approval_ref": string,"p_capacity": number,"p_description": string,"p_expected_version": number,"p_kind": string,"p_link": string,"p_minutes": number,"p_room_key": string,"p_starts_at": string,"p_title": string }; Returns: Json
                           },
"change_table":
{ Args: { "p_break_minutes": number,"p_expected_version": number,"p_focus_minutes": number,"p_link": string,"p_long_break_minutes"?: number,"p_long_every"?: number,"p_minutes": number,"p_room_key": string,"p_seats": number,"p_show_name"?: boolean,"p_starts_at": string,"p_topic": string }; Returns: Json
                           },
"clear_focus_history":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"create_organizer_invite":
{ Args: { "p_slug": string }; Returns: Json
                           },
"delete_identity":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"end_focus":
{ Args: { "p_session_id": string }; Returns: Json
                           },
"gathering_people":
{ Args: { "p_link": string }; Returns: Json
                           },
"gathering_preview":
{ Args: { "p_link": string }; Returns: Json
                           },
"get_focus":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_focus_history":
{ Args: { "p_since"?: string }; Returns: Json
                           },
"get_gathering":
{ Args: { "p_link": string }; Returns: Json
                           },
"get_identity":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_organization":
{ Args: { "p_slug": string }; Returns: Json
                           },
"get_table":
{ Args: { "p_link": string }; Returns: Json
                           },
"join_organization":
{ Args: { "p_token": string }; Returns: Json
                           },
"list_programmes":
{ Args: Record<PropertyKey, never>; Returns: {
              "campus": (string)[],"code": string,"id": string,"intake_terms": (string)[],"level": string,"name_de": string,"name_en": string
            }[]
                           },
"my_gatherings":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_organizations":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"my_tables":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"put_focus_history":
{ Args: { "p_entries": Json }; Returns: number
                           },
"registry_set_status":
{ Args: { "p_issue"?: number,"p_no": number,"p_status": string }; Returns: Json
                           },
"renew_focus":
{ Args: { "p_expected_version": number,"p_session_id": string }; Returns: Json
                           },
"reply_gathering":
{ Args: { "p_answer": string,"p_consent"?: boolean,"p_link": string }; Returns: Json
                           },
"reply_table":
{ Args: { "p_answer": string,"p_link": string,"p_show_name"?: boolean }; Returns: Json
                           },
"request_organization":
{ Args: { "p_description"?: string,"p_name": string,"p_slug": string,"p_support_url"?: string,"p_website"?: string }; Returns: Json
                           },
"room_gatherings":
{ Args: { "p_from": string,"p_room_key": string,"p_to": string }; Returns: Json
                           },
"room_summaries":
{ Args: { "p_campus": string }; Returns: {
              "batch_count": number,"batch_names": (string)[],"batch_rhythm": Json,"batch_since": string,"claim_since": string,"claims": number,"expires_at": string,"own": boolean,"room_key": string,"server_now": string
            }[]
                           },
"save_identity":
{ Args: { "p_default_visibility": string,"p_display_name": string,"p_expected_version"?: number,"p_intake_term": string,"p_intake_year": number,"p_programme_id": string,"p_show_name": boolean }; Returns: Json
                           },
"set_gathering":
{ Args: { "p_approval_ref": string,"p_capacity": number,"p_description": string,"p_kind": string,"p_minutes": number,"p_room_key": string,"p_slug": string,"p_starts_at": string,"p_title": string }; Returns: Json
                           },
"set_table":
{ Args: { "p_break_minutes": number,"p_focus_minutes": number,"p_long_break_minutes"?: number,"p_long_every"?: number,"p_minutes": number,"p_room_key": string,"p_seats": number,"p_show_name"?: boolean,"p_starts_at": string,"p_topic": string }; Returns: Json
                           },
"start_focus":
{ Args: { "p_anchor_at"?: string,"p_break_minutes"?: number,"p_focus_minutes"?: number,"p_long_break_minutes"?: number,"p_long_every"?: number,"p_planned_minutes": number,"p_replace"?: boolean,"p_request_id": string,"p_room_key": string,"p_show_name": boolean,"p_visibility": string }; Returns: Json
                           },
"table_from_session":
{ Args: { "p_break_minutes": number,"p_ends_at": string,"p_focus_minutes": number,"p_long_break_minutes"?: number,"p_long_every"?: number,"p_request_id": string,"p_room_key": string,"p_seats": number,"p_session_id"?: string,"p_starts_at": string,"p_topic": string }; Returns: Json
                           },
"table_preview":
{ Args: { "p_link": string }; Returns: Json
                           },
"update_focus":
{ Args: { "p_expected_version": number,"p_session_id": string,"p_show_name": boolean,"p_visibility": string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
