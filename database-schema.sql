-- ============================================
-- MULTI-TENANT PROJECT MANAGEMENT DATABASE SCHEMA
-- ============================================
-- 
-- IMPORTANT: This application uses Supabase's Key-Value store (kv_store_f4781e65 table)
-- which is already created and managed by Figma Make.
-- 
-- The application stores data using the following key patterns:
-- 
-- USERS:
--   user:{userId} - User profile data
--   user:{userId}:orgs - Array of organization IDs the user belongs to
-- 
-- ORGANIZATIONS:
--   org:{orgId} - Organization data
--   org:{orgId}:member:{userId} - Organization member data
--   org:{orgId}:boards - Array of board IDs in the organization
--   org:{orgId}:activities - Array of activity log IDs
-- 
-- BOARDS:
--   board:{boardId} - Board data
--   board:{boardId}:tasks - Array of task IDs in the board
-- 
-- TASKS:
--   task:{taskId} - Task data
-- 
-- ACTIVITIES:
--   activity:{activityId} - Activity log data
-- 
-- ============================================
-- NO ADDITIONAL SETUP REQUIRED
-- ============================================
-- 
-- The KV store is already configured with Row Level Security (RLS)
-- and is ready to use. The application handles all data operations
-- through the Supabase Edge Functions API.
-- 
-- For production use cases requiring traditional relational tables,
-- you can create the following schema (optional):

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    position INTEGER NOT NULL DEFAULT 0
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_org_id ON boards(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they are members of"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Organization members policies
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can add members"
    ON organization_members FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can remove members"
    ON organization_members FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Boards policies
CREATE POLICY "Users can view boards in their organizations"
    ON boards FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can create boards"
    ON boards FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'member')
        )
    );

CREATE POLICY "Members can delete boards"
    ON boards FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'member')
        )
    );

-- Tasks policies
CREATE POLICY "Users can view tasks in accessible boards"
    ON tasks FOR SELECT
    USING (
        board_id IN (
            SELECT b.id 
            FROM boards b
            INNER JOIN organization_members om ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (
        board_id IN (
            SELECT b.id 
            FROM boards b
            INNER JOIN organization_members om ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'member')
        )
    );

CREATE POLICY "Members can update tasks"
    ON tasks FOR UPDATE
    USING (
        board_id IN (
            SELECT b.id 
            FROM boards b
            INNER JOIN organization_members om ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'member')
        )
    );

CREATE POLICY "Members can delete tasks"
    ON tasks FOR DELETE
    USING (
        board_id IN (
            SELECT b.id 
            FROM boards b
            INNER JOIN organization_members om ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'member')
        )
    );

-- Activity logs policies
CREATE POLICY "Users can view activity logs in their organizations"
    ON activity_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- NOTES
-- ============================================
-- 
-- This SQL schema is OPTIONAL and for reference only.
-- The application is already fully functional using the KV store.
-- 
-- If you want to use traditional SQL tables instead:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Modify the server code to use SQL queries instead of KV operations
-- 3. Update the RLS policies to match your security requirements
-- 
-- For prototyping and development, the KV store approach is 
-- recommended as it requires no additional setup.
