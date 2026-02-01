export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'team_leader' | 'staff'
          created_at: string
          staff_type: 'closer' | 'operator' | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'team_leader' | 'staff'
          created_at?: string
          staff_type?: 'closer' | 'operator' | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'team_leader' | 'staff'
          created_at?: string
          staff_type?: 'closer' | 'operator' | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      accounts: {
        Row: {
          id: string
          platform: 'instagram' | 'threads' | 'tiktok' | 'xiaohongshu' | 'rss' | 'web' | null
          account_name: string
          account_handle: string | null
          status: 'active' | 'banned' | 'verification_needed' | null
          assigned_to: string | null
          persona_id: string | null
          login_credentials: { password?: string; [key: string]: any } | null
          created_at: string
        }
        Insert: {
          id?: string
          platform?: 'instagram' | 'threads' | 'tiktok' | 'xiaohongshu' | 'rss' | 'web' | null
          account_name: string
          account_handle?: string | null
          status?: 'active' | 'banned' | 'verification_needed' | null
          assigned_to?: string | null
          persona_id?: string | null
          login_credentials?: { password?: string; [key: string]: any } | null
          created_at?: string
        }
        Update: {
          id?: string
          platform?: 'instagram' | 'threads' | 'tiktok' | 'xiaohongshu' | 'rss' | 'web' | null
          account_name?: string
          account_handle?: string | null
          status?: 'active' | 'banned' | 'verification_needed' | null
          assigned_to?: string | null
          persona_id?: string | null
          login_credentials?: { password?: string; [key: string]: any } | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      assets: {
        Row: {
          id: string
          type: 'image' | 'video' | 'text' | null
          asset_type: string | null
          source_platform: string | null
          content_url: string | null
          thumbnail_url: string | null
          title: string | null
          description: string | null
          tags: string[] | null
          status: 'new' | 'adopted' | 'archived' | null
          adopted_by: string | null
          created_at: string
          category: string | null
          sub_category: string | null
          raw_content: string | null
          processed_content: string | null
          risk_level: number | null
          last_used_at: string | null
          source_url: string | null
          fingerprint: string | null
          visibility: 'private' | 'shared' | 'public' | null
          owner_id: string | null
          upload_method: string | null
          media_urls: string[] | null
          file_size: number | null
          original_filename: string | null
          verify_status: 'verified' | 'unverified' | 'rejected' | null
          persona_id: string | null
        }
        Insert: {
          id?: string
          type?: 'image' | 'video' | 'text' | null
          asset_type?: string | null
          source_platform?: string | null
          content_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          description?: string | null
          tags?: string[] | null
          status?: 'new' | 'adopted' | 'archived' | null
          adopted_by?: string | null
          created_at?: string
          category?: string | null
          sub_category?: string | null
          raw_content?: string | null
          processed_content?: string | null
          risk_level?: number | null
          last_used_at?: string | null
          source_url?: string | null
          fingerprint?: string | null
          visibility?: 'private' | 'public' | 'team' | 'shared' | null
          owner_id?: string | null
          upload_method?: string | null
          media_urls?: string[] | null
          file_size?: number | null
          original_filename?: string | null
          verify_status?: 'verified' | 'unverified' | 'rejected' | null
          persona_id?: string | null
        }
        Update: {
          id?: string
          type?: 'image' | 'video' | 'text' | null
          asset_type?: string | null
          source_platform?: string | null
          content_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          description?: string | null
          tags?: string[] | null
          status?: 'new' | 'adopted' | 'archived' | null
          adopted_by?: string | null
          created_at?: string
          category?: string | null
          sub_category?: string | null
          raw_content?: string | null
          processed_content?: string | null
          risk_level?: number | null
          last_used_at?: string | null
          source_url?: string | null
          fingerprint?: string | null
          visibility?: 'private' | 'public' | 'team' | 'shared' | null
          owner_id?: string | null
          upload_method?: string | null
          media_urls?: string[] | null
          file_size?: number | null
          original_filename?: string | null
          verify_status?: 'verified' | 'unverified' | 'rejected' | null
          persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_adopted_by_fkey"
            columns: ["adopted_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      personas: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          type: string | null
          tone: string | null
          persona_state: 'newbie' | 'growth' | 'veteran'
          gender: 'male' | 'female' | 'neutral'
          perspective_id: 'male' | 'female' | 'neutral'
          created_at: string
          [key: string]: any // Allow dynamic fields
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          type?: string | null
          tone?: string | null
          persona_state?: 'newbie' | 'growth' | 'veteran'
          gender?: 'male' | 'female' | 'neutral'
          perspective_id?: 'male' | 'female' | 'neutral'
          created_at?: string
          [key: string]: any
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          type?: string | null
          tone?: string | null
          persona_state?: 'newbie' | 'growth' | 'veteran'
          gender?: 'male' | 'female' | 'neutral'
          perspective_id?: 'male' | 'female' | 'neutral'
          created_at?: string
          [key: string]: any
        }
        Relationships: []
      }
      contents: {
        Row: {
          id: string
          asset_id: string | null
          persona: string | null
          content_text: string | null
          status: 'draft' | 'scheduled' | 'published' | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id?: string | null
          persona?: string | null
          content_text?: string | null
          status?: 'draft' | 'scheduled' | 'published' | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string | null
          persona?: string | null
          content_text?: string | null
          status?: 'draft' | 'scheduled' | 'published' | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_asset_id_fkey"
            columns: ["asset_id"]
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      interactions: {
        Row: {
          id: string
          account_id: string | null
          customer_id: string | null
          stage: 'cold' | 'contacted' | 'warmed_up' | 'intent' | 'deal' | 'repurchase' | null
          last_interaction_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id?: string | null
          customer_id?: string | null
          stage?: 'cold' | 'contacted' | 'warmed_up' | 'intent' | 'deal' | 'repurchase' | null
          last_interaction_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string | null
          customer_id?: string | null
          stage?: 'cold' | 'contacted' | 'warmed_up' | 'intent' | 'deal' | 'repurchase' | null
          last_interaction_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      },
      work_tasks: {
        Row: {
          id: string
          persona_id: string | null
          assigned_asset_id: string | null
          staff_id: string | null
          account_id: string | null
          platform: string | null
          content_text: string | null
          status: string | null
          post_url: string | null
          task_type: string | null
          task_kind: string | null
          task_date: string | null
          scheduled_time: string | null
          time_block: string | null
          priority: number | null
          payload: Json | null
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          persona_id?: string | null
          assigned_asset_id?: string | null
          staff_id?: string | null
          account_id?: string | null
          platform?: string | null
          content_text?: string | null
          status?: string | null
          post_url?: string | null
          task_type?: string | null
          task_kind?: string | null
          task_date?: string | null
          scheduled_time?: string | null
          time_block?: string | null
          priority?: number | null
          payload?: Json | null
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          persona_id?: string | null
          assigned_asset_id?: string | null
          staff_id?: string | null
          account_id?: string | null
          platform?: string | null
          content_text?: string | null
          status?: string | null
          post_url?: string | null
          task_type?: string | null
          task_kind?: string | null
          task_date?: string | null
          scheduled_time?: string | null
          time_block?: string | null
          priority?: number | null
          payload?: Json | null
          created_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_persona_id_fkey"
            columns: ["persona_id"]
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_assigned_asset_id_fkey"
            columns: ["assigned_asset_id"]
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_staff_id_fkey"
            columns: ["staff_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_tasks_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      },
      work_task_logs: {
        Row: {
          id: string
          task_id: string | null
          staff_id: string | null
          result_status: string | null
          evidence_url: string | null
          notes: string | null
          counts: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          staff_id?: string | null
          result_status?: string | null
          evidence_url?: string | null
          notes?: string | null
          counts?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string | null
          staff_id?: string | null
          result_status?: string | null
          evidence_url?: string | null
          notes?: string | null
          counts?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_task_logs_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_task_logs_staff_id_fkey"
            columns: ["staff_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
