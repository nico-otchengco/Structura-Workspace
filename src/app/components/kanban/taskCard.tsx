import { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Edit, User, Calendar, AlertCircle, ArrowUp, Minus, X, ChevronDown } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Select from '@radix-ui/react-select';
import type { Task, Member } from '../types/type';
import '@/styles/style.css';

interface TaskCardProps { task: Task; members: Member[]; onUpdate: (taskId: string, updates: Partial<Task>) => void; onDelete: (taskId: string) => void; isReadOnly: boolean; }

const priorityConfig = {
  high: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca', icon: <AlertCircle size={10} /> },
  medium: { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a', icon: <ArrowUp size={10} /> },
  low: { bg: '#f0fdf4', text: '#22c55e', border: '#bbf7d0', icon: <Minus size={10} /> },
};

export function TaskCard({ task, members, onUpdate, onDelete, isReadOnly }: TaskCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editAssigned, setEditAssigned] = useState(task.assigned_to || 'unassigned');
  const [editDue, setEditDue] = useState(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK', item: { id: task.id, status: task.status },
    collect: m => ({ isDragging: m.isDragging() }), canDrag: !isReadOnly,
  }));
  drag(dragRef);

  const handleSave = () => {
    onUpdate(task.id, { title: editTitle, description: editDesc, priority: editPriority, assigned_to: editAssigned === 'unassigned' ? null : editAssigned, due_date: editDue || null });
    setShowEdit(false);
  };

  const getAssigneeName = (userId: string | null) => {
    if (!userId) return null;
    const m = members.find(m => m.user_id === userId);
    return m?.user?.name || m?.name || m?.email || null;
  };

  const pc = priorityConfig[task.priority] || priorityConfig.medium;
  const assigneeName = getAssigneeName(task.assigned_to);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const formattedDue = task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

  return (
    <>
      <div ref={dragRef} className={`tc-card ${isDragging ? 'dragging' : ''} ${isReadOnly ? 'readonly' : ''}`}>
        <div className="tc-top">
          <span className="tc-title">{task.title}</span>
          <span className="tc-priority" style={{ background: pc.bg, color: pc.text, borderColor: pc.border }}>
            {pc.icon} {task.priority}
          </span>
        </div>
        {task.description && <p className="tc-desc">{task.description}</p>}
        {(assigneeName || formattedDue) && (
          <div className="tc-meta">
            {assigneeName && <div className="tc-meta-row"><User size={11} />{assigneeName}</div>}
            {formattedDue && <div className={`tc-meta-row ${isOverdue ? 'overdue' : ''}`}><Calendar size={11} />{isOverdue ? 'Overdue · ' : ''}{formattedDue}</div>}
          </div>
        )}
        {!isReadOnly && (
          <div className="tc-actions">
            <button className="tc-btn" onClick={() => setShowEdit(true)}><Edit size={12} /> Edit</button>
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button className="tc-btn delete"><Trash2 size={12} /> Delete</button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="modal-overlay" />
                <AlertDialog.Content className="modal-content">
                  <AlertDialog.Title className="modal-title" style={{ marginBottom: 10 }}>Delete Task</AlertDialog.Title>
                  <AlertDialog.Description style={{ fontSize: '0.875rem', color: '#6b6b7b', marginBottom: 28 }}>
                    Are you sure you want to delete "{task.title}"? This cannot be undone.
                  </AlertDialog.Description>
                  <div className="modal-actions">
                    <AlertDialog.Cancel asChild><button className="modal-btn-cancel">Cancel</button></AlertDialog.Cancel>
                    <AlertDialog.Action asChild><button className="modal-btn-delete" onClick={() => onDelete(task.id)}>Delete</button></AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        )}
      </div>

      <Dialog.Root open={showEdit} onOpenChange={setShowEdit}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content">
            <div className="modal-header">
              <Dialog.Title className="modal-title">Edit Task</Dialog.Title>
              <Dialog.Close asChild><button className="modal-close"><X size={14} /></button></Dialog.Close>
            </div>
            <div className="modal-field">
              <label className="modal-label">Title</label>
              <input className="modal-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Description</label>
              <textarea className="modal-input modal-textarea" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Priority</label>
              <Select.Root value={editPriority} onValueChange={(v: any) => setEditPriority(v)}>
                <Select.Trigger className="modal-select-trigger"><Select.Value /><Select.Icon><ChevronDown size={14} /></Select.Icon></Select.Trigger>
                <Select.Portal>
                  <Select.Content className="modal-select-content" position="popper">
                    <Select.Viewport>
                      {['low','medium','high'].map(p => <Select.Item key={p} value={p} className="modal-select-item"><Select.ItemText>{p.charAt(0).toUpperCase()+p.slice(1)}</Select.ItemText></Select.Item>)}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            <div className="modal-field">
              <label className="modal-label">Assign To</label>
              <Select.Root value={editAssigned} onValueChange={setEditAssigned}>
                <Select.Trigger className="modal-select-trigger"><Select.Value placeholder="Unassigned" /><Select.Icon><ChevronDown size={14} /></Select.Icon></Select.Trigger>
                <Select.Portal>
                  <Select.Content className="modal-select-content" position="popper">
                    <Select.Viewport>
                      <Select.Item value="unassigned" className="modal-select-item"><Select.ItemText>Unassigned</Select.ItemText></Select.Item>
                      {members.map(m => <Select.Item key={m.user_id} value={m.user_id} className="modal-select-item"><Select.ItemText>{m.user?.name || m.name || m.email || m.user_id}</Select.ItemText></Select.Item>)}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            <div className="modal-field">
              <label className="modal-label">Due Date</label>
              <input type="date" className="modal-input" value={editDue} onChange={e => setEditDue(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="modal-btn-save" onClick={handleSave}>Save Changes</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}