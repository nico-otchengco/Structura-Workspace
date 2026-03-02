import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string; 
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  organizations: {
    id: string;
    name: string;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    created_at: string;
    created_by: string;
  };
  organization_members: {
    id: string;
    organization_id: string;
    user_id: string;
    role: 'owner' | 'member' | 'client';
    created_at: string;
  };
  boards: {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    created_at: string;
    created_by: string;
  };
  tasks: {
    id: string;
    board_id: string;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigned_to: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    position: number;
  };
  activity_logs: {
    id: string;
    organization_id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    metadata: Record<string, any>;
    created_at: string;
  };
};

export type Organization = Database['organizations'];
export type OrganizationMember = Database['organization_members'];
export type Board = Database['boards'];
export type Task = Database['tasks'];
export type ActivityLog = Database['activity_logs'];
export type UserRole = 'owner' | 'member' | 'client';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
