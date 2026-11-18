
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "ai_usage": {
                  Row: {
                    "count": number,"day": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "count"?: number,"day": string,"user_id": string
                  }
                  Update: {
                    "count"?: number,"day"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"pose_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"pose_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"pose_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_pose_id_fkey"
      columns: ["pose_id"]
isOneToOne: false
      referencedRelation: "poses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"places": {
                  Row: {
                    "address": string | null,"created_at": string,"created_by": string,"id": string,"maps_url": string | null,"name": string,"note": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"maps_url"?: string | null,"name": string,"note"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"maps_url"?: string | null,"name"?: string,"note"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "places_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"pose_images": {
                  Row: {
                    "dominant_color": string | null,"full_path": string,"height": number | null,"id": string,"pose_id": string,"position": number,"thumb_path": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "dominant_color"?: string | null,"full_path": string,"height"?: number | null,"id"?: string,"pose_id": string,"position"?: number,"thumb_path": string,"width"?: number | null
                  }
                  Update: {
                    "dominant_color"?: string | null,"full_path"?: string,"height"?: number | null,"id"?: string,"pose_id"?: string,"position"?: number,"thumb_path"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pose_images_pose_id_fkey"
      columns: ["pose_id"]
isOneToOne: false
      referencedRelation: "poses"
      referencedColumns: ["id"]
    }
                  ]
                },"poses": {
                  Row: {
                    "camera_height": string | null,"camera_tilt": string | null,"created_at": string,"created_by": string,"description": string | null,"distance_m": number | null,"grid": Json | null,"id": string,"model_steps": (string)[],"orientation": string | null,"people_count": string | null,"photographer_position": string | null,"place_id": string | null,"posture": string | null,"scenes": (string)[],"search_text": string,"source_credit": string | null,"source_url": string | null,"status": string,"tags": (string)[],"tips": string | null,"title": string,"updated_at": string,"zoom": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "camera_height"?: string | null,"camera_tilt"?: string | null,"created_at"?: string,"created_by"?: string,"description"?: string | null,"distance_m"?: number | null,"grid"?: Json | null,"id"?: string,"model_steps"?: (string)[],"orientation"?: string | null,"people_count"?: string | null,"photographer_position"?: string | null,"place_id"?: string | null,"posture"?: string | null,"scenes"?: (string)[],"search_text"?: string,"source_credit"?: string | null,"source_url"?: string | null,"status"?: string,"tags"?: (string)[],"tips"?: string | null,"title": string,"updated_at"?: string,"zoom"?: string | null
                  }
                  Update: {
                    "camera_height"?: string | null,"camera_tilt"?: string | null,"created_at"?: string,"created_by"?: string,"description"?: string | null,"distance_m"?: number | null,"grid"?: Json | null,"id"?: string,"model_steps"?: (string)[],"orientation"?: string | null,"people_count"?: string | null,"photographer_position"?: string | null,"place_id"?: string | null,"posture"?: string | null,"scenes"?: (string)[],"search_text"?: string,"source_credit"?: string | null,"source_url"?: string | null,"status"?: string,"tags"?: (string)[],"tips"?: string | null,"title"?: string,"updated_at"?: string,"zoom"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "poses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "poses_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_color": string,"avatar_emoji": string,"created_at": string,"display_name": string,"id": string,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_color"?: string,"avatar_emoji"?: string,"created_at"?: string,"display_name": string,"id": string,"role"?: string
                  }
                  Update: {
                    "avatar_color"?: string,"avatar_emoji"?: string,"created_at"?: string,"display_name"?: string,"id"?: string,"role"?: string
                  }
                  Relationships: [
                    
                  ]
                },"shoot_items": {
                  Row: {
                    "done": boolean,"pose_id": string,"position": number,"shoot_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "done"?: boolean,"pose_id": string,"position"?: number,"shoot_id": string
                  }
                  Update: {
                    "done"?: boolean,"pose_id"?: string,"position"?: number,"shoot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shoot_items_pose_id_fkey"
      columns: ["pose_id"]
isOneToOne: false
      referencedRelation: "poses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shoot_items_shoot_id_fkey"
      columns: ["shoot_id"]
isOneToOne: false
      referencedRelation: "shoots"
      referencedColumns: ["id"]
    }
                  ]
                },"shoots": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"name": string,"place_id": string | null,"shoot_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"name": string,"place_id"?: string | null,"shoot_date"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"name"?: string,"place_id"?: string | null,"shoot_date"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shoots_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shoots_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"team_settings": {
                  Row: {
                    "id": number,"invite_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: number,"invite_code": string
                  }
                  Update: {
                    "id"?: number,"invite_code"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "pose_favorite_counts": {
                  Row: {
                    "favorite_count": number | null,"pose_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "favorites_pose_id_fkey"
      columns: ["pose_id"]
isOneToOne: false
      referencedRelation: "poses"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "immutable_unaccent":
{ Args: { "input": string }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"join_team":
{ Args: { "display_name": string,"invite_code": string }; Returns: {
              "avatar_color": string,
"avatar_emoji": string,
"created_at": string,
"display_name": string,
"id": string,
"role": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } }
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
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
