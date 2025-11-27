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
      pending_activities: {
        Row: {
          id: string
          user_id: string
          provider: string
          provider_activity_id: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          title: string
          description: string | null
          url: string | null
          event_name: string | null
          event_date: string | null
          location: string | null
          attendee_count: number | null
          platform: string | null
          answer_count: number | null
          suggested_points: number
          status: string
          ingested_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          provider_activity_id?: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          title: string
          description?: string | null
          url?: string | null
          event_name?: string | null
          event_date?: string | null
          location?: string | null
          attendee_count?: number | null
          platform?: string | null
          answer_count?: number | null
          suggested_points: number
          status?: string
          ingested_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          provider_activity_id?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          title?: string
          description?: string | null
          url?: string | null
          event_name?: string | null
          event_date?: string | null
          location?: string | null
          attendee_count?: number | null
          platform?: string | null
          answer_count?: number | null
          suggested_points?: number
          status?: string
          ingested_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_activities_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          amplification_url: string | null
          answer_count: number | null
          attendee_count: number | null
          created_at: string
          description: string | null
          event_date: string | null
          event_name: string | null
          id: string
          location: string | null
          platform: string | null
          points: number
          request_amplification: boolean | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          amplification_url?: string | null
          answer_count?: number | null
          attendee_count?: number | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          location?: string | null
          platform?: string | null
          points: number
          request_amplification?: boolean | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          amplification_url?: string | null
          answer_count?: number | null
          attendee_count?: number | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          location?: string | null
          platform?: string | null
          points?: number
          request_amplification?: boolean | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          provider: string
          provider_user_id: string
          provider_username: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          provider: string
          provider_user_id: string
          provider_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          provider?: string
          provider_user_id?: string
          provider_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
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
      activity_type:
        | "blog_post"
        | "cfp_submission"
        | "conference_talk"
        | "meetup_talk"
        | "hosted_meetup"
        | "customer_support"
        | "oss_contribution"
        | "video_tutorial"
        | "documentation"
        | "workshop"
        | "mentorship"
        | "starter_template"
        | "integration"
        | "community_answers"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Activity = Database['public']['Tables']['activities']['Row']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']

export type SocialConnection = Database['public']['Tables']['social_connections']['Row']
export type SocialConnectionInsert = Database['public']['Tables']['social_connections']['Insert']

export type PendingActivity = Database['public']['Tables']['pending_activities']['Row']
export type PendingActivityInsert = Database['public']['Tables']['pending_activities']['Insert']
export type PendingActivityUpdate = Database['public']['Tables']['pending_activities']['Update']

export type ActivityTypeEnum = Database['public']['Enums']['activity_type']

// Activity with profile for feed display
export type ActivityWithProfile = Activity & {
  profiles: Pick<Profile, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar_url'>
}

// Leaderboard entry type
export type LeaderboardEntry = {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  total_points: number
  rank: number
}
