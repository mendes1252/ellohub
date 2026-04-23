export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MemberRole = "admin" | "member" | "child"
export type EventCategory = "saude" | "lazer" | "escola" | "trabalho" | "outro"
export type TaskStatus = "pending" | "done"
export type InvitationStatus = "pending" | "accepted" | "expired"
export type SubscriptionStatus = "free" | "trial" | "active" | "cancelled" | "past_due"
export type NotificationType = "morning_summary" | "event_reminder" | "conflict_alert" | "task_assigned" | "member_joined" | "weekly_report"

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          created_by: string
          subscription_status: SubscriptionStatus
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          subscription_status?: SubscriptionStatus
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["families"]["Insert"]>
      }
      members: {
        Row: {
          id: string
          family_id: string
          user_id: string | null
          role: MemberRole
          display_name: string
          color: string
          avatar_url: string | null
          quiet_hours_start: string
          quiet_hours_end: string
          max_daily_notifications: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id?: string | null
          role?: MemberRole
          display_name: string
          color: string
          avatar_url?: string | null
          quiet_hours_start?: string
          quiet_hours_end?: string
          max_daily_notifications?: number
        }
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>
      }
      events: {
        Row: {
          id: string
          family_id: string
          member_id: string
          created_by: string
          title: string
          description: string | null
          starts_at: string
          ends_at: string
          all_day: boolean
          category: EventCategory
          location: string | null
          synced_from: string | null
          external_id: string | null
          recurrence_rule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          member_id: string
          created_by: string
          title: string
          description?: string | null
          starts_at: string
          ends_at: string
          all_day?: boolean
          category?: EventCategory
          location?: string | null
          synced_from?: string | null
          external_id?: string | null
          recurrence_rule?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>
      }
      tasks: {
        Row: {
          id: string
          family_id: string
          list_name: string
          assigned_to: string | null
          created_by: string
          title: string
          notes: string | null
          status: TaskStatus
          due_date: string | null
          completed_at: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          list_name?: string
          assigned_to?: string | null
          created_by: string
          title: string
          notes?: string | null
          status?: TaskStatus
          due_date?: string | null
          position?: number
        }
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>
      }
      invitations: {
        Row: {
          id: string
          family_id: string
          invited_by: string
          email: string
          token: string
          status: InvitationStatus
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          invited_by: string
          email: string
          token?: string
          status?: InvitationStatus
          expires_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>
      }
      notifications: {
        Row: {
          id: string
          member_id: string
          family_id: string
          type: NotificationType
          title: string
          message: string
          data: Json | null
          read_at: string | null
          sent_at: string
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          family_id: string
          type: NotificationType
          title: string
          message: string
          data?: Json | null
          read_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
      }
      push_subscriptions: {
        Row: {
          id: string
          member_id: string
          endpoint: string
          p256dh: string
          auth_key: string
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          endpoint: string
          p256dh: string
          auth_key: string
        }
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>
      }
      google_calendar_tokens: {
        Row: {
          id: string
          member_id: string
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          calendar_id: string
          synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          calendar_id?: string
          synced_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["google_calendar_tokens"]["Insert"]>
      }
    }
    Functions: {
      detect_conflicts: {
        Args: { p_family_id: string; p_date: string }
        Returns: {
          event_a_id: string
          event_a_title: string
          event_a_member: string
          event_b_id: string
          event_b_title: string
          event_b_member: string
          overlap_start: string
          overlap_end: string
        }[]
      }
      find_quality_windows: {
        Args: { p_family_id: string; p_date: string; p_min_duration?: string }
        Returns: { window_start: string; window_end: string; duration: string }[]
      }
      count_today_notifications: {
        Args: { p_member_id: string }
        Returns: number
      }
      count_monthly_events: {
        Args: { p_family_id: string }
        Returns: number
      }
      accept_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: string
      }
      get_user_family_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      get_user_member_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
    }
  }
}
