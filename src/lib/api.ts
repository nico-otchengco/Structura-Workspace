import { supabase } from './supabase';

const API_BASE = `https://ziifllmvwpewkfeuwlfl.supabase.co/functions/v1/server`;

async function getAuthToken(): Promise<string> {
  // Get from Supabase auth
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  console.log('Token being sent:', token);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const text = await response.text();
  console.log('Raw response:', text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${response.status}): ${text}`);
  }

  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Organizations
export const organizationsAPI = {
  list: () => apiRequest('/organizations'),
  get: (id: string) => apiRequest(`/organizations/${id}`),
  create: (name: string, subscription_tier?: string) =>
    apiRequest('/organizations', { method: 'POST', body: JSON.stringify({ name, subscription_tier }) }),
  getMembers: (id: string) => apiRequest(`/organizations/${id}/members`),
  addMember: (id: string, email: string, role: string) =>
    apiRequest(`/organizations/${id}/members`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  removeMember: (orgId: string, userId: string) =>
    apiRequest(`/organizations/${orgId}/members/${userId}`, { method: 'DELETE' }),
  getActivities: (id: string, limit?: number) =>
    apiRequest(`/organizations/${id}/activities${limit ? `?limit=${limit}` : ''}`),
  getBoards: (id: string) => apiRequest(`/organizations/${id}/boards`),
};

// Boards
export const boardsAPI = {
  create: (organization_id: string, name: string, description?: string) =>
    apiRequest('/boards', { method: 'POST', body: JSON.stringify({ organization_id, name, description }) }),
  get: (id: string) => apiRequest(`/boards/${id}`),
  delete: (id: string) => apiRequest(`/boards/${id}`, { method: 'DELETE' }),
  getTasks: (id: string) => apiRequest(`/boards/${id}/tasks`),
  getAnalytics: (id: string) => apiRequest(`/boards/${id}/analytics`),
};

// Tasks
export const tasksAPI = {
  create: (taskData: {
    board_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigned_to?: string;
  }) => apiRequest('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
  update: (id: string, updates: Partial<any>) =>
    apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  delete: (id: string) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
};

// Profile
export const profileAPI = {
  get: () => apiRequest('/profile'),
};
