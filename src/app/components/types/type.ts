export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  position: number;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
}

export interface Organization {
  id: string;
  name: string;
  userRole: string;
}

export interface Member {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'project_manager' | 'admin' | 'member' | 'client';
  created_at: string;
}