import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../../../lib/api';
import { Activity, Plus, Edit2, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import '@/styles/style.css';

interface ActivityItem { id: string; action: string; resource_type: string; resource_id: string; metadata: Record<string, any>; created_at: string; user: { name: string; email: string; }; }
interface ActivityLogProps { organizationId: string; }

const actionConfig: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  created: { icon: <Plus size={13} />, bg: '#f0fdf4', color: '#16a34a' },
  updated: { icon: <Edit2 size={13} />, bg: '#eff6ff', color: '#2563eb' },
  deleted: { icon: <Trash2 size={13} />, bg: '#fef2f2', color: '#dc2626' },
  added_member: { icon: <UserPlus size={13} />, bg: '#fdf4ff', color: '#9333ea' },
  removed_member: { icon: <UserMinus size={13} />, bg: '#fff7ed', color: '#ea580c' },
};

export function ActivityLog({ organizationId }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadActivities(); }, [organizationId]);

  const loadActivities = async () => {
    try { const { activities: list } = await organizationsAPI.getActivities(organizationId, 50); setActivities(list); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getDescription = (a: ActivityItem) => {
    const name = a.user?.name || 'Someone';
    const { action, resource_type: rt, metadata: m } = a;
    if (action === 'created') {
      if (rt === 'organization') return `${name} created this organization`;
      if (rt === 'board') return `${name} created board "${m.name}"`;
      if (rt === 'task') return `${name} created task "${m.title}"`;
    }
    if (action === 'updated' && rt === 'task') return `${name} updated task "${m.title}"`;
    if (action === 'deleted') {
      if (rt === 'board') return `${name} deleted board "${m.name}"`;
      if (rt === 'task') return `${name} deleted task "${m.title}"`;
    }
    if (action === 'added_member') return `${name} invited ${m.invited_user} as ${m.role}`;
    if (action === 'removed_member') return `${name} removed a team member`;
    return `${name} ${action} ${rt}`;
  };

  return (
    <>
      <div className="al-root">
        <div className="al-header">
          <h2 className="al-title">Activity Log</h2>
          <p className="al-sub">Recent activity across your organization</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid rgba(10,10,15,0.06)' }}>
                <div className="al-skel" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="al-skel" style={{ height: 13, width: '65%', marginBottom: 8 }} />
                  <div className="al-skel" style={{ height: 10, width: '25%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="al-empty">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Activity size={20} color="#9ca3af" />
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0a0a0f', marginBottom: 6 }}>No activity yet</div>
            <div style={{ fontSize: '0.875rem', color: '#6b6b7b' }}>Activity will appear here as your team works</div>
          </div>
        ) : (
          <div className="al-list">
            {activities.map(a => {
              const cfg = actionConfig[a.action] || { icon: <Activity size={13} />, bg: '#f3f4f6', color: '#6b7280' };
              return (
                <div className="al-item" key={a.id}>
                  <div className="al-icon" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
                  <div className="al-body">
                    <div className="al-desc">{getDescription(a)}</div>
                    <div className="al-time">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}