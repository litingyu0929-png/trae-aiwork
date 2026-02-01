import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export interface Account {
  id: string;
  platform: 'instagram' | 'threads' | 'tiktok' | 'xiaohongshu' | 'rss' | 'web' | 'youtube';
  account_name: string;
  account_handle: string | null;
  account_url?: string | null; // Optional link
  status: 'active' | 'banned' | 'verification_needed';
  onboarding_status?: 'assigned' | 'notified' | 'binding' | 'setting_persona' | 'completed';
  assigned_to: string | null; // Staff ID
  persona_id: string | null; // Persona ID
  login_credentials?: { password?: string; [key: string]: any } | null;
  created_at: string;
}

export type AccountWithStaff = Account & {
  assigned_staff?: { full_name: string } | string | null;
  persona?: { id: string, name: string } | null;
};

export type Asset = Database['public']['Tables']['assets']['Row'];
export type Content = Database['public']['Tables']['contents']['Row'];
export type Persona = Database['public']['Tables']['personas']['Row'];

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  content: any;
  status: 'unread' | 'read';
  created_at: string;
}

// DB Schema Match
export interface WorkTask {
  id: string;
  persona_id?: string;
  assigned_asset_id?: string;
  staff_id?: string;
  account_id?: string;
  platform?: string;
  content_text?: string;
  status: string; // 'pending_publish' | 'completed' | 'skipped'
  post_url?: string;
  task_type?: string;
  task_kind?: string; // 'ops_reply' | 'ops_hype' | 'ops_intercept' | 'content_post'
  task_date?: string;
  scheduled_time?: string;
  time_block?: string; // 'wake_up' | 'warm_up' | 'production' | 'war' | 'closing'
  priority?: number;
  payload?: any; // JSONB
  created_at?: string;
  completed_at?: string | null;
  
  // Joins (Optional)
  persona?: {
    name: string;
    avatar_url?: string;
  };
  asset?: Asset;
  account?: Account;
}

// Legacy UI Type (can be deprecated later)
export interface Task {
  id: string;
  persona: {
    name: string;
    avatar: string;
  };
  platform: 'instagram' | 'threads' | 'tiktok' | 'xiaohongshu';
  asset: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  content: {
    text: string;
  };
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueTime: string;
}
