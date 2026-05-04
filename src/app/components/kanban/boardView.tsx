import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { boardsAPI, tasksAPI, organizationsAPI } from '../../../lib/api';
import { ArrowLeft, Plus, BarChart3, X } from 'lucide-react';
import { KanbanColumn } from './kanbanColumn';
import { CreateTaskDialog } from './createTaskDialog';
import { TaskAnalytics } from './taskAnalytics';
import * as Dialog from '@radix-ui/react-dialog';
import type { Task, Board, Organization, Member } from '../types/type';
import '@/styles/style.css';

interface BoardViewProps { board: Board; organization: Organization; onBack: () => void; }

export function BoardView({ board, organization, onBack }: BoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  useEffect(() => { loadTasks(); loadMembers(); }, [board.id]);

  const loadTasks = async () => {
    try { const { tasks: t } = await boardsAPI.getTasks(board.id); setTasks(t); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadMembers = async () => {
    try { const { members: m } = await organizationsAPI.getMembers(organization.id); setMembers(m); }
    catch (e) { console.error(e); }
  };
  const handleCreateTask = async (taskData: any) => {
    try { await tasksAPI.create({ board_id: board.id, ...taskData, status: selectedStatus }); await loadTasks(); setShowCreateTask(false); }
    catch (e) { console.error(e); throw e; }
  };
  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try { await tasksAPI.update(taskId, { status: newStatus }); await loadTasks(); } catch (e) { console.error(e); }
  };
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try { await tasksAPI.update(taskId, updates); await loadTasks(); } catch (e) { console.error(e); }
  };
  const handleDeleteTask = async (taskId: string) => {
    try { await tasksAPI.delete(taskId); await loadTasks(); } catch (e) { console.error(e); }
  };

  const isReadOnly = organization.userRole === 'client';
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="bv-root">
          <header className="bv-header">
            <div className="bv-header-inner">
              <div className="bv-header-left">
                <button className="bv-back" onClick={onBack}><ArrowLeft size={16} /></button>
                <div>
                  <div className="bv-board-name">{board.name}</div>
                  {board.description && <div className="bv-board-desc">{board.description}</div>}
                </div>
              </div>
              <div className="bv-header-actions">
                <button className="bv-analytics-btn" onClick={() => setShowAnalytics(true)}>
                  <BarChart3 size={14} /> Analytics
                </button>
                {!isReadOnly && (
                  <button className="bv-new-task-btn" onClick={() => { setSelectedStatus('todo'); setShowCreateTask(true); }}>
                    <Plus size={14} /> New Task
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="bv-main">
            <div className="bv-stats">
              {[
                { num: tasks.length, label: 'Total Tasks', color: '#0a0a0f' },
                { num: todoTasks.length, label: 'To Do', color: '#4f46e5' },
                { num: inProgressTasks.length, label: 'In Progress', color: '#f59e0b' },
                { num: doneTasks.length, label: 'Done', color: '#22c55e' },
              ].map((s, i) => (
                <div className="bv-stat" key={i}>
                  <div className="bv-stat-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="bv-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="bv-columns">
                {[1,2,3].map(i => (
                  <div className="bv-skeleton" key={i}>
                    <div className="bv-skel" style={{ height: 20, width: 80, marginBottom: 16 }} />
                    {[1,2].map(j => <div className="bv-skel" key={j} style={{ height: 80, marginBottom: 10 }} />)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bv-columns">
                <KanbanColumn title="To Do" status="todo" tasks={todoTasks} members={members} onMoveTask={handleMoveTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddTask={() => { setSelectedStatus('todo'); setShowCreateTask(true); }} isReadOnly={isReadOnly} />
                <KanbanColumn title="In Progress" status="in_progress" tasks={inProgressTasks} members={members} onMoveTask={handleMoveTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddTask={() => { setSelectedStatus('in_progress'); setShowCreateTask(true); }} isReadOnly={isReadOnly} />
                <KanbanColumn title="Done" status="done" tasks={doneTasks} members={members} onMoveTask={handleMoveTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddTask={() => { setSelectedStatus('done'); setShowCreateTask(true); }} isReadOnly={isReadOnly} />
              </div>
            )}
          </main>

          <CreateTaskDialog open={showCreateTask} onClose={() => setShowCreateTask(false)} onCreate={handleCreateTask} initialStatus={selectedStatus} members={members} />

          <Dialog.Root open={showAnalytics} onOpenChange={setShowAnalytics}>
            <Dialog.Portal>
              <Dialog.Overlay className="bv-analytics-overlay" />
              <Dialog.Content className="bv-analytics-modal">
                <div className="bv-modal-header">
                  <Dialog.Title className="bv-modal-title">Task Analytics</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="bv-modal-close"><X size={14} /></button>
                  </Dialog.Close>
                </div>
                <TaskAnalytics boardId={board.id} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </DndProvider>
    </>
  );
}