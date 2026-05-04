import { useState, useEffect } from 'react';
import { boardsAPI } from '../../../lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import '@/styles/style.css';

interface Analytics {
  total: number;
  by_status: { todo: number; in_progress: number; done: number; };
  by_priority: { low: number; medium: number; high: number; };
  completion_rate: string;
}

export function TaskAnalytics({ boardId }: { boardId: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, [boardId]);

  const loadAnalytics = async () => {
    try {
      const { analytics: data } = await boardsAPI.getAnalytics(boardId);
      setAnalytics(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: '#f5f4f0', borderRadius: 16, height: 200, animation: 'dash-pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontFamily: 'DM Sans, sans-serif' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p>Failed to load analytics</p>
      </div>
    );
  }

  const statusData = [
    { name: 'To Do', value: analytics.by_status.todo, color: '#4f46e5' },
    { name: 'In Progress', value: analytics.by_status.in_progress, color: '#f59e0b' },
    { name: 'Done', value: analytics.by_status.done, color: '#22c55e' },
  ];

  const priorityData = [
    { name: 'Low', value: analytics.by_priority.low, fill: '#22c55e' },
    { name: 'Medium', value: analytics.by_priority.medium, fill: '#f59e0b' },
    { name: 'High', value: analytics.by_priority.high, fill: '#ef4444' },
  ];

  const summaryCards = [
    { label: 'Total Tasks', value: analytics.total, icon: <TrendingUp size={18} />, bg: '#eef2ff', color: '#4f46e5' },
    { label: 'To Do', value: analytics.by_status.todo, icon: <Clock size={18} />, bg: '#eef2ff', color: '#4f46e5' },
    { label: 'In Progress', value: analytics.by_status.in_progress, icon: <AlertCircle size={18} />, bg: '#fffbeb', color: '#f59e0b' },
    { label: 'Completed', value: analytics.by_status.done, icon: <CheckCircle size={18} />, bg: '#f0fdf4', color: '#22c55e' },
  ];

  return (
    <>
      <div className="ta-root">
        {/* Summary */}
        <div className="ta-summary">
          {summaryCards.map((s, i) => (
            <div className="ta-stat" key={i}>
              <div>
                <div className="ta-stat-num">{s.value}</div>
                <div className="ta-stat-label">{s.label}</div>
              </div>
              <div className="ta-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Completion Rate */}
        <div className="ta-card">
          <div className="ta-card-title">Completion Rate</div>
          <div className="ta-completion">
            <div style={{ position: 'relative', width: 180, height: 180 }}>
              <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="90" cy="90" r="75" stroke="#f0efeb" strokeWidth="14" fill="none" />
                <circle
                  cx="90" cy="90" r="75"
                  stroke="#22c55e" strokeWidth="14" fill="none"
                  strokeDasharray={`${(parseFloat(analytics.completion_rate) / 100) * 471.2} 471.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ta-completion-num">{analytics.completion_rate}%</div>
                <div className="ta-completion-label">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="ta-card">
          <div className="ta-card-title">Task Status Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(10,10,15,0.1)', fontFamily: 'DM Sans' }} />
              <Legend wrapperStyle={{ fontFamily: 'DM Sans', fontSize: '0.825rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="ta-card">
          <div className="ta-card-title">Task Priority Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priorityData} barSize={40}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontFamily: 'DM Sans', fontSize: '0.825rem' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontFamily: 'DM Sans', fontSize: '0.825rem' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(10,10,15,0.1)', fontFamily: 'DM Sans' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}