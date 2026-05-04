import React, { useState, useEffect } from 'react';
import { boardsAPI } from '../../../lib/api';
import { ChevronLeft, ChevronRight, AlertCircle, ArrowUp, ArrowRight as ArrowRightIcon } from 'lucide-react';
import type { Task } from '../types/type';
import '@/styles/style.css';

interface Board { id: string; name: string; }
interface CalendarViewProps { organizationId: string; boards: Board[]; }
interface TaskWithBoard extends Task { boardName: string; }

const priorityConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  high: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca', icon: <AlertCircle size={9} /> },
  medium: { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a', icon: <ArrowUp size={9} /> },
  low: { bg: '#f0fdf4', text: '#22c55e', border: '#bbf7d0', icon: <ArrowRightIcon size={9} /> },
};

export function CalendarView({ organizationId, boards }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskWithBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAllTasks(); }, [boards]);

  const loadAllTasks = async () => {
    setLoading(true);
    try {
      const allTasks: TaskWithBoard[] = [];
      for (const board of boards) {
        const { tasks: boardTasks } = await boardsAPI.getTasks(board.id);
        boardTasks.filter((t: Task) => t.due_date).forEach((t: Task) => allTasks.push({ ...t, boardName: board.name }));
      }
      setTasks(allTasks);
    } catch (error) { console.error('Failed to load tasks:', error); }
    finally { setLoading(false); }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getTasksForDay = (day: number) =>
    tasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      <div className="cv-root">
        <div className="cv-header">
          <div>
            <h2 className="cv-title">Calendar</h2>
            <p className="cv-sub">Task deadlines across all boards</p>
          </div>
          <div className="cv-nav">
            <button className="cv-nav-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft size={15} />
            </button>
            <span className="cv-month">{monthName}</span>
            <button className="cv-nav-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="cv-skeleton">
            {Array(35).fill(null).map((_, i) => <div key={i} className="cv-skel-cell" />)}
          </div>
        ) : (
          <>
            <div className="cv-day-headers">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="cv-day-header">{d}</div>
              ))}
            </div>

            <div className="cv-grid">
              {blanks.map((_, i) => <div key={`b-${i}`} className="cv-blank" />)}
              {days.map(day => {
                const dayTasks = getTasksForDay(day);
                return (
                  <div key={day} className={`cv-cell ${isToday(day) ? 'today' : ''}`}>
                    <div className={`cv-day-num ${isToday(day) ? 'today' : ''}`}>{day}</div>
                    <div className="cv-tasks">
                      {dayTasks.slice(0, 3).map(task => {
                        const pc = priorityConfig[task.priority] || priorityConfig.medium;
                        return (
                          <div
                            key={task.id}
                            className="cv-task"
                            style={{ background: pc.bg, color: pc.text, borderColor: pc.border }}
                            title={`${task.title} — ${task.boardName}`}
                          >
                            {pc.icon}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && <div className="cv-more">+{dayTasks.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cv-legend">
              <span className="cv-legend-label">Priority:</span>
              {['high', 'medium', 'low'].map(p => {
                const pc = priorityConfig[p];
                return (
                  <span key={p} className="cv-legend-item" style={{ background: pc.bg, color: pc.text, borderColor: pc.border }}>
                    {pc.icon} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}