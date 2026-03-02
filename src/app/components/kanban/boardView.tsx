import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { boardsAPI, tasksAPI } from '../../../lib/api';
import { Button } from '../ui/Button';
import { ArrowLeft, Plus, BarChart3 } from 'lucide-react';
import { KanbanColumn } from './kanbanColumn';
import { CreateTaskDialog } from './createTaskDialog';
import { TaskAnalytics } from './taskAnalytics';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface Board {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
}

interface Organization {
  id: string;
  name: string;
  userRole: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  position: number;
}

interface BoardViewProps {
  board: Board;
  organization: Organization;
  onBack: () => void;
}

export function BoardView({ board, organization, onBack }: BoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  useEffect(() => {
    loadTasks();
  }, [board.id]);

  const loadTasks = async () => {
    try {
      const { tasks: tasksList } = await boardsAPI.getTasks(board.id);
      setTasks(tasksList);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      await tasksAPI.create({
        board_id: board.id,
        ...taskData,
        status: selectedStatus,
      });
      await loadTasks();
      setShowCreateTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await tasksAPI.update(taskId, updates);
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksAPI.delete(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const isReadOnly = organization.userRole === 'client';

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <DndProvider backend={HTML5Backend}>
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
                  <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
                  {board.description && (
                    <p className="text-sm text-gray-600 mt-0.5">{board.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={() => setShowAnalytics(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                {!isReadOnly && (
                  <Button onClick={() => {
                    setSelectedStatus('todo');
                    setShowCreateTask(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex space-x-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1">
                  <div className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="h-24 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KanbanColumn
                title="To Do"
                status="todo"
                tasks={todoTasks}
                onMoveTask={handleMoveTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddTask={() => {
                  setSelectedStatus('todo');
                  setShowCreateTask(true);
                }}
                isReadOnly={isReadOnly}
              />
              <KanbanColumn
                title="In Progress"
                status="in_progress"
                tasks={inProgressTasks}
                onMoveTask={handleMoveTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddTask={() => {
                  setSelectedStatus('in_progress');
                  setShowCreateTask(true);
                }}
                isReadOnly={isReadOnly}
              />
              <KanbanColumn
                title="Done"
                status="done"
                tasks={doneTasks}
                onMoveTask={handleMoveTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddTask={() => {
                  setSelectedStatus('done');
                  setShowCreateTask(true);
                }}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
        </main>

        <CreateTaskDialog
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          onCreate={handleCreateTask}
          initialStatus={selectedStatus}
        />

        {/* Analytics Dialog */}
        <Dialog.Root open={showAnalytics} onOpenChange={setShowAnalytics}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-xl font-semibold">Task Analytics</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              <TaskAnalytics boardId={board.id} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </DndProvider>
  );
}
