import { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { TaskCard } from './taskCard';
import type { Task, Member } from '../types/type';
import '@/styles/style.css';

type TaskStatus = 'todo' | 'in_progress' | 'done';
interface KanbanColumnProps { title: string; status: TaskStatus; tasks: Task[]; members: Member[]; onMoveTask: (taskId: string, newStatus: TaskStatus) => void; onUpdateTask: (taskId: string, updates: Partial<Task>) => void; onDeleteTask: (taskId: string) => void; onAddTask: () => void; isReadOnly: boolean; }

const colConfig = {
  todo: { accent: '#4f46e5', bg: '#eef2ff', label: '#4f46e5', dot: '#818cf8' },
  in_progress: { accent: '#f59e0b', bg: '#fffbeb', label: '#d97706', dot: '#fbbf24' },
  done: { accent: '#22c55e', bg: '#f0fdf4', label: '#16a34a', dot: '#4ade80' },
};

export function KanbanColumn({ title, status, tasks, members, onMoveTask, onUpdateTask, onDeleteTask, onAddTask, isReadOnly }: KanbanColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; status: TaskStatus }) => { if (item.status !== status) onMoveTask(item.id, status); },
    collect: monitor => ({ isOver: monitor.isOver() }),
  }));
  drop(ref);

  const cfg = colConfig[status];

  return (
    <>
      <div ref={ref} className={`kc-col ${isOver ? 'over' : ''}`}>
        <div className="kc-header">
          <div className="kc-header-left">
            <div className="kc-dot" style={{ background: cfg.dot }} />
            <span className="kc-title">{title}</span>
            <span className="kc-count" style={{ background: cfg.bg, color: cfg.label }}>{tasks.length}</span>
          </div>
          {!isReadOnly && (
            <button className="kc-add" onClick={onAddTask}><Plus size={13} /></button>
          )}
        </div>
        <div className="kc-body">
          {tasks.length === 0 && <div className="kc-empty">Drop tasks here</div>}
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} members={members} onUpdate={onUpdateTask} onDelete={onDeleteTask} isReadOnly={isReadOnly} />
          ))}
        </div>
      </div>
    </>
  );
}