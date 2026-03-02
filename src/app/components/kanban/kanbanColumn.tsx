import React from 'react';
import { useDrop } from 'react-dnd';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { TaskCard } from './taskCard';
import type { Task } from '../types/type';

type TaskStatus = 'todo' | 'in_progress' | 'done';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: () => void;
  isReadOnly: boolean;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  isReadOnly,
}: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; status: TaskStatus }) => {
      if (item.status !== status) {
        onMoveTask(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getColumnColor = () => {
    switch (status) {
      case 'todo':
        return 'border-t-4 border-t-blue-500';
      case 'in_progress':
        return 'border-t-4 border-t-yellow-500';
      case 'done':
        return 'border-t-4 border-t-green-500';
      default:
        return 'border-t-4 border-t-gray-500';
    }
  };

  return (
    <div
      ref={drop}
      className={`flex flex-col h-full ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50 rounded-lg' : ''}`}
    >
      <Card className={`flex-1 ${getColumnColor()}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
            </div>
            {!isReadOnly && (
              <Button variant="ghost" size="icon" onClick={onAddTask}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
