import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono().basePath('/server');

app.use('*', cors());
app.use('*', logger(console.log));

app.all('*', async (c, next) => {
  console.log('Incoming path:', c.req.path);
  await next();
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token || token === supabaseAnonKey) return null;
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getUserRole(organizationId: string, userId: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role || null;
}

async function logActivity(
  organizationId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, any>,
  userName?: string,
  userEmail?: string,
) {
  await adminSupabase.from('activity_logs').insert({
    organization_id: organizationId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    user_name: userName,
    user_email: userEmail,
  });
}

// ============================================
// OPTIONS
// ============================================

app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) return c.json({ error: error.message }, 400);
    return c.json({ user: data.user });
  } catch (error) {
    return c.json({ error: 'Failed to sign up' }, 500);
  }
});

// ============================================
// ORGANIZATION ROUTES
// ============================================

app.post('/organizations', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { name, subscription_tier = 'free' } = await c.req.json();
    if (!name) return c.json({ error: 'Organization name is required' }, 400);

    const { data: org, error: orgError } = await adminSupabase
      .from('organizations')
      .insert({ name, subscription_tier, created_by: user.id })
      .select()
      .single();

    if (orgError) return c.json({ error: orgError.message }, 500);

    const userName = user.user_metadata?.name || user.email;

    const { data: member, error: memberError } = await adminSupabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        name: userName,
        email: user.email,
      })
      .select()
      .single();

    if (memberError) return c.json({ error: memberError.message }, 500);

    await logActivity(org.id, user.id, 'created', 'organization', org.id, { name }, userName, user.email);

    return c.json({ organization: org, member });
  } catch (error) {
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

app.get('/organizations', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { data, error } = await adminSupabase
      .from('organization_members')
      .select('role, organizations(*)')
      .eq('user_id', user.id);

    if (error) return c.json({ error: error.message }, 500);

    const organizations = data.map((row: any) => ({
      ...row.organizations,
      userRole: row.role,
    }));

    return c.json({ organizations });
  } catch (error) {
    return c.json({ error: 'Failed to get organizations' }, 500);
  }
});

app.get('/organizations/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('id');
    const role = await getUserRole(orgId, user.id);
    if (!role) return c.json({ error: 'Not a member of this organization' }, 403);

    const { data: org, error } = await adminSupabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error || !org) return c.json({ error: 'Organization not found' }, 404);

    return c.json({ organization: { ...org, userRole: role } });
  } catch (error) {
    return c.json({ error: 'Failed to get organization' }, 500);
  }
});

// ============================================
// ORGANIZATION MEMBER ROUTES
// ============================================

app.post('/organizations/:id/members', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    if (!userRole || !['owner', 'project_manager'].includes(userRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const { email, role = 'member' } = await c.req.json();
    if (!email) return c.json({ error: 'Email is required' }, 400);

    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
    if (usersError) return c.json({ error: 'Failed to look up users' }, 500);

    const authUser = users.find(u => u.email === email);
    if (!authUser) return c.json({ error: 'User not found. They must sign up first.' }, 404);

    const { data: existing } = await adminSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (existing) return c.json({ error: 'User is already a member' }, 400);

    const invitedName = authUser.user_metadata?.name || authUser.email;

    const { data: member, error: memberError } = await adminSupabase
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id: authUser.id,
        role,
        name: invitedName,
        email: authUser.email,
      })
      .select()
      .single();

    if (memberError) return c.json({ error: memberError.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(orgId, user.id, 'added_member', 'organization', orgId,
      { invited_user: email, role }, userName, user.email);

    return c.json({ member });
  } catch (error) {
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

app.get('/organizations/:id/members', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    if (!userRole) return c.json({ error: 'Not a member of this organization' }, 403);

    const { data: members, error } = await adminSupabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId);

    if (error) return c.json({ error: error.message }, 500);

    const enriched = members.map((member: any) => ({
      ...member,
      user: { id: member.user_id, email: member.email, name: member.name },
    }));

    return c.json({ members: enriched });
  } catch (error) {
    return c.json({ error: 'Failed to get members' }, 500);
  }
});

app.delete('/organizations/:orgId/members/:userId', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('orgId');
    const targetUserId = c.req.param('userId');
    const userRole = await getUserRole(orgId, user.id);

    if (!userRole || (userRole !== 'owner' && user.id !== targetUserId)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const { error } = await adminSupabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId);

    if (error) return c.json({ error: error.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(orgId, user.id, 'removed_member', 'organization', orgId,
      { removed_user_id: targetUserId }, userName, user.email);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// ============================================
// BOARD ROUTES
// ============================================

app.post('/boards', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { organization_id, name, description = null } = await c.req.json();
    if (!organization_id || !name) return c.json({ error: 'Organization ID and name are required' }, 400);

    const userRole = await getUserRole(organization_id, user.id);
    if (!userRole || userRole === 'client') return c.json({ error: 'Insufficient permissions' }, 403);

    const { data: board, error } = await adminSupabase
      .from('boards')
      .insert({ organization_id, name, description, created_by: user.id })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(organization_id, user.id, 'created', 'board', board.id, { name }, userName, user.email);

    return c.json({ board });
  } catch (error) {
    return c.json({ error: 'Failed to create board' }, 500);
  }
});

app.get('/organizations/:id/boards', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    if (!userRole) return c.json({ error: 'Not a member of this organization' }, 403);

    const { data: boards, error } = await adminSupabase
      .from('boards')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ boards });
  } catch (error) {
    return c.json({ error: 'Failed to get boards' }, 500);
  }
});

app.get('/boards/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { data: board, error } = await adminSupabase
      .from('boards')
      .select('*')
      .eq('id', c.req.param('id'))
      .single();

    if (error || !board) return c.json({ error: 'Board not found' }, 404);

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole) return c.json({ error: 'Not a member of this organization' }, 403);

    return c.json({ board });
  } catch (error) {
    return c.json({ error: 'Failed to get board' }, 500);
  }
});

app.delete('/boards/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const boardId = c.req.param('id');
    const { data: board, error: boardError } = await adminSupabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (boardError || !board) return c.json({ error: 'Board not found' }, 404);

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole || !['owner', 'project_manager'].includes(userRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await adminSupabase.from('tasks').delete().eq('board_id', boardId);

    const { error } = await adminSupabase.from('boards').delete().eq('id', boardId);
    if (error) return c.json({ error: error.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(board.organization_id, user.id, 'deleted', 'board', boardId,
      { name: board.name }, userName, user.email);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete board' }, 500);
  }
});

// ============================================
// TASK ROUTES
// ============================================

app.post('/tasks', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { board_id, title, description = null, status = 'todo', priority = 'medium', assigned_to = null } = await c.req.json();
    if (!board_id || !title) return c.json({ error: 'Board ID and title are required' }, 400);

    const { data: board } = await adminSupabase
      .from('boards')
      .select('organization_id')
      .eq('id', board_id)
      .single();
    if (!board) return c.json({ error: 'Board not found' }, 404);

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole || userRole === 'client') return c.json({ error: 'Insufficient permissions' }, 403);

    const { count } = await adminSupabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', board_id);

    const { data: task, error } = await adminSupabase
      .from('tasks')
      .insert({
        board_id,
        organization_id: board.organization_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        created_by: user.id,
        position: count || 0,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(board.organization_id, user.id, 'created', 'task', task.id,
      { title, board_id }, userName, user.email);

    return c.json({ task });
  } catch (error) {
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

app.get('/boards/:id/tasks', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const boardId = c.req.param('id');
    const { data: board } = await adminSupabase
      .from('boards')
      .select('organization_id')
      .eq('id', boardId)
      .single();
    if (!board) return c.json({ error: 'Board not found' }, 404);

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole) return c.json({ error: 'Not a member of this organization' }, 403);

    const { data: tasks, error } = await adminSupabase
      .from('tasks')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ tasks });
  } catch (error) {
    return c.json({ error: 'Failed to get tasks' }, 500);
  }
});

app.put('/tasks/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const taskId = c.req.param('id');
    const { data: task } = await adminSupabase
      .from('tasks')
      .select('*, boards(organization_id)')
      .eq('id', taskId)
      .single();
    if (!task) return c.json({ error: 'Task not found' }, 404);

    const userRole = await getUserRole(task.boards.organization_id, user.id);
    if (!userRole || userRole === 'client') return c.json({ error: 'Insufficient permissions' }, 403);

    const body = await c.req.json();
    const { data: updated, error } = await adminSupabase
      .from('tasks')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(task.boards.organization_id, user.id, 'updated', 'task', taskId,
      { title: updated.title, changes: body }, userName, user.email);

    return c.json({ task: updated });
  } catch (error) {
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

app.delete('/tasks/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const taskId = c.req.param('id');
    const { data: task } = await adminSupabase
      .from('tasks')
      .select('*, boards(organization_id)')
      .eq('id', taskId)
      .single();
    if (!task) return c.json({ error: 'Task not found' }, 404);

    const userRole = await getUserRole(task.boards.organization_id, user.id);
    if (!userRole || userRole === 'client') return c.json({ error: 'Insufficient permissions' }, 403);

    const { error } = await adminSupabase.from('tasks').delete().eq('id', taskId);
    if (error) return c.json({ error: error.message }, 500);

    const userName = user.user_metadata?.name || user.email;
    await logActivity(task.boards.organization_id, user.id, 'deleted', 'task', taskId,
      { title: task.title }, userName, user.email);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// ============================================
// ACTIVITY ROUTES
// ============================================

app.get('/organizations/:id/activities', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    if (!userRole) return c.json({ error: 'Not a member of this organization' }, 403);

    const limit = parseInt(c.req.query('limit') || '50');

    const { data: activities, error } = await adminSupabase
      .from('activity_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return c.json({ error: error.message }, 500);

    const enriched = activities.map((activity: any) => ({
      ...activity,
      user: {
        id: activity.user_id,
        name: activity.user_name,
        email: activity.user_email,
      },
    }));

    return c.json({ activities: enriched });
  } catch (error) {
    return c.json({ error: 'Failed to get activities' }, 500);
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

app.get('/boards/:id/analytics', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const boardId = c.req.param('id');
    const { data: board } = await adminSupabase
      .from('boards')
      .select('organization_id')
      .eq('id', boardId)
      .single();
    if (!board) return c.json({ error: 'Board not found' }, 404);

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole) return c.json({ error: 'Not a member of this organization' }, 403);

    const { data: tasks } = await adminSupabase
      .from('tasks')
      .select('status, priority')
      .eq('board_id', boardId);

    const t = tasks || [];

    return c.json({
      analytics: {
        total: t.length,
        by_status: {
          todo: t.filter(t => t.status === 'todo').length,
          in_progress: t.filter(t => t.status === 'in_progress').length,
          done: t.filter(t => t.status === 'done').length,
        },
        by_priority: {
          low: t.filter(t => t.priority === 'low').length,
          medium: t.filter(t => t.priority === 'medium').length,
          high: t.filter(t => t.priority === 'high').length,
        },
        completion_rate: t.length > 0
          ? (t.filter(t => t.status === 'done').length / t.length * 100).toFixed(1)
          : 0,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// ============================================
// PROFILE ROUTE
// ============================================

app.get('/profile', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    return c.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// ============================================
// DELETE ORGANIZATION ROUTE
// ============================================

app.delete('/organizations/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    if (userRole !== 'owner') return c.json({ error: 'Only owners can delete organizations' }, 403);

    // Delete in order: tasks → boards → members → activities → org
    const { data: boards } = await adminSupabase.from('boards').select('id').eq('organization_id', orgId);
    for (const board of boards || []) {
      await adminSupabase.from('tasks').delete().eq('board_id', board.id);
    }
    await adminSupabase.from('boards').delete().eq('organization_id', orgId);
    await adminSupabase.from('organization_members').delete().eq('organization_id', orgId);
    await adminSupabase.from('activity_logs').delete().eq('organization_id', orgId);
    await adminSupabase.from('organizations').delete().eq('id', orgId);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete organization' }, 500);
  }
});

Deno.serve(app.fetch);