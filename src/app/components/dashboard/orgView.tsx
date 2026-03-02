import React, { useState, useEffect } from 'react';
import { organizationsAPI, boardsAPI } from '../../../lib/api';
import { Button } from '../ui/Button';
import { ArrowLeft, Plus, Users, Activity, BarChart3, LayoutDashboard } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { BoardsList } from './boardsList';
import { TeamMembers } from './teamMembers';
import { ActivityLog } from './activityLog';
import { CreateBoardDialog } from './createBoardDialog';
import { BoardView } from '../kanban/boardView';

interface Organization {
  id: string;
  name: string;
  subscription_tier: string;
  userRole: string;
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
}

interface OrganizationViewProps {
  organization: Organization;
  onBack: () => void;
}

export function OrganizationView({ organization, onBack }: OrganizationViewProps) {
  const [activeTab, setActiveTab] = useState('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, [organization.id]);

  const loadBoards = async () => {
    try {
      const { boards: boardsList } = await organizationsAPI.getBoards(organization.id);
      setBoards(boardsList);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (name: string, description: string) => {
    try {
      await boardsAPI.create(organization.id, name, description);
      await loadBoards();
      setShowCreateBoard(false);
    } catch (error) {
      console.error('Failed to create board:', error);
      throw error;
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await boardsAPI.delete(boardId);
      await loadBoards();
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  if (selectedBoard) {
    return (
      <BoardView
        board={selectedBoard}
        organization={organization}
        onBack={() => setSelectedBoard(null)}
      />
    );
  }

  const isReadOnly = organization.userRole === 'client';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {organization.subscription_tier}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                    {organization.userRole}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs.List className="flex space-x-1 border-b border-gray-200 mt-6">
          <Tabs.Trigger
            value="boards"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 inline-block mr-2" />
            Boards
          </Tabs.Trigger>
          <Tabs.Trigger
            value="team"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Team
          </Tabs.Trigger>
          <Tabs.Trigger
            value="activity"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
          >
            <Activity className="h-4 w-4 inline-block mr-2" />
            Activity
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="boards" className="py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Boards</h2>
              <p className="text-gray-600 mt-1">Manage your project boards</p>
            </div>
            {!isReadOnly && (
              <Button onClick={() => setShowCreateBoard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </Button>
            )}
          </div>
          <BoardsList
            boards={boards}
            loading={loading}
            onSelectBoard={setSelectedBoard}
            onDeleteBoard={handleDeleteBoard}
            isReadOnly={isReadOnly}
          />
        </Tabs.Content>

        <Tabs.Content value="team" className="py-6">
          <TeamMembers organizationId={organization.id} userRole={organization.userRole} />
        </Tabs.Content>

        <Tabs.Content value="activity" className="py-6">
          <ActivityLog organizationId={organization.id} />
        </Tabs.Content>
      </Tabs.Root>

      <CreateBoardDialog
        open={showCreateBoard}
        onClose={() => setShowCreateBoard(false)}
        onCreate={handleCreateBoard}
      />
    </div>
  );
}
