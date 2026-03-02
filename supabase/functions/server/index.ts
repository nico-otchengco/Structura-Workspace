import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kvStore.ts';

const app = new Hono().basePath('/server');

app.use('*', cors());
app.use('*', logger(console.log));

app.all('*', async (c, next) => {
  console.log('Incoming path:', c.req.path);
  await next();
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('VITE_SUPABASE_ANON_KEY') ?? '';

// Helper to get authenticated user
async function getAuthenticatedUser(authHeader: string | null) {  
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token || token === supabaseAnonKey) return null;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Helper to check user role in organization
async function getUserRole(organizationId: string, userId: string): Promise<string | null> {
  const memberKey = `org:${organizationId}:member:${userId}`;
  const member = await kv.get(memberKey);
  return member?.role || null;
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/auth/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    if (data.user) {
      await kv.set(`user:${data.user.id}`, {
        id: data.user.id,
        email,
        name,
        created_at: new Date().toISOString(),
      });
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Failed to sign up' }, 500);
  }
});

// ============================================
// ORGANIZATION ROUTES
// ============================================

app.post('/organizations', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {return c.json({ error: 'Unauthorized' }, 401);}

    const body = await c.req.json();
    const { name, subscription_tier = 'free' } = body;

    if (!name) {
      return c.json({ error: 'Organization name is required' }, 400);
    }

    const orgId = crypto.randomUUID();
    const organization = {
      id: orgId,
      name,
      subscription_tier,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };

    // Store organization
    await kv.set(`org:${orgId}`, organization);

    await kv.set(`user:${user.id}`, {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'New User'
    });

    // Add creator as owner
    const memberId = crypto.randomUUID();
    const member = {
      id: memberId,
      organization_id: orgId,
      user_id: user.id,
      role: 'owner',
      created_at: new Date().toISOString(),
    };
    await kv.set(`org:${orgId}:member:${user.id}`, member);

    // Add to user's organizations list
    const userOrgs: string[] = ((await kv.get(`user:${user.id}:orgs`)) as string[] | null) ?? [];
    userOrgs.push(orgId);
    await kv.set(`user:${user.id}:orgs`, userOrgs);

    // Log activity
    await logActivity(orgId, user.id, 'created', 'organization', orgId, { name });

    return c.json({ organization, member });
  } catch (error) {
    console.log('Create organization error:', error);
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

app.get('/organizations', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userOrgs = (await kv.get(`user:${user.id}:orgs`)) || [];
    const organizations = [];

    for (const orgId of userOrgs) {
      const org = await kv.get(`org:${orgId}`);
      const role = await getUserRole(orgId, user.id);
      if (org) {
        organizations.push({ ...org, userRole: role });
      }
    }

    return c.json({ organizations });
  } catch (error) {
    console.log('Get organizations error:', error);
    return c.json({ error: 'Failed to get organizations' }, 500);
  }
});

app.get('/organizations/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const role = await getUserRole(orgId, user.id);
    
    if (!role) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    const organization = await kv.get(`org:${orgId}`);
    if (!organization) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json({ organization: { ...organization, userRole: role } });
  } catch (error) {
    console.log('Get organization error:', error);
    return c.json({ error: 'Failed to get organization' }, 500);
  }
});

// ============================================
// ORGANIZATION MEMBER ROUTES
// ============================================

app.post('/organizations/:id/members', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    
    if (!userRole || !['owner', 'project_manager'].includes(userRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const body = await c.req.json();
    const { email, role = 'member' } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();

    if (usersError) {
      return c.json({ error: 'Failed to look up users' }, 500);
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      return c.json({ error: 'User not found. They must sign up first.' }, 404);
    }

    let invitedUser = await kv.get(`user:${authUser.id}`);
    if (!invitedUser) {
      invitedUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member',
        created_at: authUser.created_at,
      };
      await kv.set(`user:${authUser.id}`, invitedUser);
    }

    const existingMember = await kv.get(`org:${orgId}:member:${invitedUser.id}`);
    if (existingMember) {
      return c.json({ error: 'User is already a member' }, 400);
    }

    const memberId = crypto.randomUUID();
    const member = {
      id: memberId,
      organization_id: orgId,
      user_id: invitedUser.id,
      role,
      created_at: new Date().toISOString(),
    };

    await kv.set(`org:${orgId}:member:${invitedUser.id}`, member);

    const userOrgs = (await kv.get(`user:${invitedUser.id}:orgs`)) || [];
    userOrgs.push(orgId);
    await kv.set(`user:${invitedUser.id}:orgs`, userOrgs);

    await logActivity(orgId, user.id, 'added_member', 'organization', orgId, {
      invited_user: email,
      role,
    });

    return c.json({ member });
  } catch (error) {
    console.log('Add member error FULL:', error);
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

app.get('/organizations/:id/members', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    
    if (!userRole) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    const members = await kv.getByPrefix(`org:${orgId}:member:`);
    
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        let userData = await kv.get(`user:${member.user_id}`);

        if (!userData && member.user_id === user.id) {
          userData = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Member'
          };
          await kv.set(`user:${user.id}`, userData);
        };

        return { ...member, user: userData || { name: 'Pending User', email: 'N/A' }};
      })
    );

    return c.json({ members: enrichedMembers });
  } catch (error) {
    console.log('Get members error:', error);
    return c.json({ error: 'Failed to get members' }, 500);
  }
});

app.delete('/organizations/:orgId/members/:userId', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('orgId');
    const targetUserId = c.req.param('userId');
    const userRole = await getUserRole(orgId, user.id);
    
    if (!userRole || (userRole !== 'owner' && user.id !== targetUserId)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await kv.del(`org:${orgId}:member:${targetUserId}`);

    // Remove from user's organizations list
    const userOrgs = (await kv.get(`user:${targetUserId}:orgs`)) || [];
    const updatedOrgs = userOrgs.filter((id: string) => id !== orgId);
    await kv.set(`user:${targetUserId}:orgs`, updatedOrgs);

    // Log activity
    await logActivity(orgId, user.id, 'removed_member', 'organization', orgId, {
      removed_user_id: targetUserId,
    });

    return c.json({ success: true });
  } catch (error) {
    console.log('Remove member error:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// ============================================
// BOARD ROUTES
// ============================================

app.post('/boards', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { organization_id, name, description = null } = body;

    if (!organization_id || !name) {
      return c.json({ error: 'Organization ID and name are required' }, 400);
    }

    const userRole = await getUserRole(organization_id, user.id);
    if (!userRole || userRole === 'client') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const boardId = crypto.randomUUID();
    const board = {
      id: boardId,
      organization_id,
      name,
      description,
      created_at: new Date().toISOString(),
      created_by: user.id,
    };

    await kv.set(`board:${boardId}`, board);

    // Add to organization's boards list
    const orgBoards = (await kv.get(`org:${organization_id}:boards`)) || [];
    orgBoards.push(boardId);
    await kv.set(`org:${organization_id}:boards`, orgBoards);

    // Log activity
    await logActivity(organization_id, user.id, 'created', 'board', boardId, { name });

    return c.json({ board });
  } catch (error) {
    console.log('Create board error:', error);
    return c.json({ error: 'Failed to create board' }, 500);
  }
});

app.get('/organizations/:id/boards', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    
    if (!userRole) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    const boardIds = (await kv.get(`org:${orgId}:boards`)) || [];
    const boards = [];

    for (const boardId of boardIds) {
      const board = await kv.get(`board:${boardId}`);
      if (board) {
        boards.push(board);
      }
    }

    return c.json({ boards });
  } catch (error) {
    console.log('Get boards error:', error);
    return c.json({ error: 'Failed to get boards' }, 500);
  }
});

app.get('/boards/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boardId = c.req.param('id');
    const board = await kv.get(`board:${boardId}`);
    
    if (!board) {
      return c.json({ error: 'Board not found' }, 404);
    }

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    return c.json({ board });
  } catch (error) {
    console.log('Get board error:', error);
    return c.json({ error: 'Failed to get board' }, 500);
  }
});

app.delete('/boards/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boardId = c.req.param('id');
    const board = await kv.get(`board:${boardId}`);
    
    if (!board) {
      return c.json({ error: 'Board not found' }, 404);
    }

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole || !['owner', 'project_manager'].includes(userRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Delete all tasks
    const taskIds = (await kv.get(`board:${boardId}:tasks`)) || [];
    for (const taskId of taskIds) {
      await kv.del(`task:${taskId}`);
    }
    await kv.del(`board:${boardId}:tasks`);

    const orgBoards = (await kv.get(`org:${board.organization_id}:boards`)) || [];
    const updatedBoards = orgBoards.filter((id: string) => id !== boardId);
    await kv.set(`org:${board.organization_id}:boards`, updatedBoards);

    await kv.del(`board:${boardId}`);

    await logActivity(board.organization_id, user.id, 'deleted', 'board', boardId, {
      name: board.name,
    });

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete board error:', error);
    return c.json({ error: 'Failed to delete board' }, 500);
  }
});

// ============================================
// TASK ROUTES
// ============================================

app.post('/tasks', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const {
      board_id,
      title,
      description = null,
      status = 'todo',
      priority = 'medium',
      assigned_to = null,
    } = body;

    if (!board_id || !title) {
      return c.json({ error: 'Board ID and title are required' }, 400);
    }

    const board = await kv.get(`board:${board_id}`);
    if (!board) {
      return c.json({ error: 'Board not found' }, 404);
    }

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole || userRole === 'client') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Get current tasks to determine position
    const taskIds = (await kv.get(`board:${board_id}:tasks`)) || [];
    const position = taskIds.length;

    const taskId = crypto.randomUUID();
    const task = {
      id: taskId,
      board_id,
      title,
      description,
      status,
      priority,
      assigned_to,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      position,
    };

    await kv.set(`task:${taskId}`, task);

    // Add to board's tasks list
    taskIds.push(taskId);
    await kv.set(`board:${board_id}:tasks`, taskIds);

    // Log activity
    await logActivity(board.organization_id, user.id, 'created', 'task', taskId, {
      title,
      board_id,
    });

    return c.json({ task });
  } catch (error) {
    console.log('Create task error:', error);
    return c.json({ error: 'Failed to create task' }, 500);
  }
});

app.get('/boards/:id/tasks', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boardId = c.req.param('id');
    const board = await kv.get(`board:${boardId}`);
    
    if (!board) {
      return c.json({ error: 'Board not found' }, 404);
    }

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    const taskIds = (await kv.get(`board:${boardId}:tasks`)) || [];
    const tasks = [];

    for (const taskId of taskIds) {
      const task = await kv.get(`task:${taskId}`);
      if (task) {
        tasks.push(task);
      }
    }

    return c.json({ tasks });
  } catch (error) {
    console.log('Get tasks error:', error);
    return c.json({ error: 'Failed to get tasks' }, 500);
  }
});

app.put('/tasks/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const task = await kv.get(`task:${taskId}`);
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const board = await kv.get(`board:${task.board_id}`);
    const userRole = await getUserRole(board.organization_id, user.id);
    
    if (!userRole || userRole === 'client') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const body = await c.req.json();
    const updatedTask = {
      ...task,
      ...body,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`task:${taskId}`, updatedTask);

    // Log activity
    await logActivity(board.organization_id, user.id, 'updated', 'task', taskId, {
      title: updatedTask.title,
      changes: body,
    });

    return c.json({ task: updatedTask });
  } catch (error) {
    console.log('Update task error:', error);
    return c.json({ error: 'Failed to update task' }, 500);
  }
});

app.delete('/tasks/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('id');
    const task = await kv.get(`task:${taskId}`);
    
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const board = await kv.get(`board:${task.board_id}`);
    const userRole = await getUserRole(board.organization_id, user.id);
    
    if (!userRole || userRole === 'client') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Remove from board's tasks list
    const taskIds = (await kv.get(`board:${task.board_id}:tasks`)) || [];
    const updatedTasks = taskIds.filter((id: string) => id !== taskId);
    await kv.set(`board:${task.board_id}:tasks`, updatedTasks);

    await kv.del(`task:${taskId}`);

    // Log activity
    await logActivity(board.organization_id, user.id, 'deleted', 'task', taskId, {
      title: task.title,
    });

    return c.json({ success: true });
  } catch (error) {
    console.log('Delete task error:', error);
    return c.json({ error: 'Failed to delete task' }, 500);
  }
});

// ============================================
// ACTIVITY LOG ROUTES
// ============================================

async function logActivity(
  organizationId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, any>
) {
  const activityId = crypto.randomUUID();
  const activity = {
    id: activityId,
    organization_id: organizationId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
    created_at: new Date().toISOString(),
  };

  await kv.set(`activity:${activityId}`, activity);

  // Add to organization's activity log
  const orgActivities = (await kv.get(`org:${organizationId}:activities`)) || [];
  orgActivities.unshift(activityId); // Add to beginning
  
  // Keep only last 1000 activities
  if (orgActivities.length > 1000) {
    const removed = orgActivities.splice(1000);
    // Clean up old activities
    for (const oldId of removed) {
      await kv.del(`activity:${oldId}`);
    }
  }
  
  await kv.set(`org:${organizationId}:activities`, orgActivities);
}

app.get('/organizations/:id/activities', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const orgId = c.req.param('id');
    const userRole = await getUserRole(orgId, user.id);
    
    if (!userRole) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const activityIds = (await kv.get(`org:${orgId}:activities`)) || [];
    const activities = [];

    for (const activityId of activityIds.slice(0, limit)) {
      const activity = await kv.get(`activity:${activityId}`);
      if (activity) {
        // Enrich with user data
        const userData = await kv.get(`user:${activity.user_id}`);
        activities.push({
          ...activity,
          user: userData,
        });
      }
    }

    return c.json({ activities });
  } catch (error) {
    console.log('Get activities error:', error);
    return c.json({ error: 'Failed to get activities' }, 500);
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

app.get('/boards/:id/analytics', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const boardId = c.req.param('id');
    const board = await kv.get(`board:${boardId}`);
    
    if (!board) {
      return c.json({ error: 'Board not found' }, 404);
    }

    const userRole = await getUserRole(board.organization_id, user.id);
    if (!userRole) {
      return c.json({ error: 'Not a member of this organization' }, 403);
    }

    const taskIds = (await kv.get(`board:${boardId}:tasks`)) || [];
    const tasks = [];

    for (const taskId of taskIds) {
      const task = await kv.get(`task:${taskId}`);
      if (task) {
        tasks.push(task);
      }
    }

    // Calculate analytics
    const analytics = {
      total: tasks.length,
      by_status: {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
      },
      by_priority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
      },
      completion_rate: tasks.length > 0 
        ? (tasks.filter(t => t.status === 'done').length / tasks.length * 100).toFixed(1)
        : 0,
    };

    return c.json({ analytics });
  } catch (error) {
    console.log('Get analytics error:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// ============================================
// USER PROFILE ROUTE
// ============================================

app.get('/profile', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.header('Authorization') ?? null);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    return c.json({ profile: profile || { id: user.id, email: user.email } });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

Deno.serve(app.fetch);
