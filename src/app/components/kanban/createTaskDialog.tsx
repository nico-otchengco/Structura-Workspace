import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown } from 'lucide-react';
import type { Member } from '../types/type';
import '@/styles/style.css';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (taskData: any) => Promise<void>;
  initialStatus?: 'todo' | 'in_progress' | 'done';
  members: Member[];
}

export function CreateTaskDialog({ open, onClose, onCreate, initialStatus, members }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onCreate({
        title,
        description: description || null,
        priority,
        assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
        status: initialStatus ?? 'todo',
        due_date: dueDate || null,
      });
      setTitle(''); setDescription(''); setPriority('medium');
      setAssignedTo('unassigned'); setDueDate('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="ctd-overlay" />
          <Dialog.Content className="ctd-content">
            <div className="ctd-header">
              <Dialog.Title className="ctd-title">Create New Task</Dialog.Title>
              <Dialog.Close asChild>
                <button className="ctd-close"><X size={14} /></button>
              </Dialog.Close>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="ctd-error">{error}</div>}
              <div className="ctd-field">
                <label className="ctd-label">Title</label>
                <input className="ctd-input" placeholder="Fix login bug" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
              </div>
              <div className="ctd-field">
                <label className="ctd-label">Description (Optional)</label>
                <textarea className="ctd-input ctd-textarea" placeholder="Describe the task..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="ctd-field">
                <label className="ctd-label">Priority</label>
                <Select.Root value={priority} onValueChange={setPriority}>
                  <Select.Trigger className="ctd-select-trigger">
                    <Select.Value />
                    <Select.Icon><ChevronDown size={14} /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="ctd-select-content" position="popper" sideOffset={4}>
                      <Select.Viewport>
                        {['low', 'medium', 'high'].map(p => (
                          <Select.Item key={p} value={p} className="ctd-select-item">
                            <Select.ItemText>{p.charAt(0).toUpperCase() + p.slice(1)}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div className="ctd-field">
                <label className="ctd-label">Assign To</label>
                <Select.Root value={assignedTo} onValueChange={setAssignedTo}>
                  <Select.Trigger className="ctd-select-trigger">
                    <Select.Value placeholder="Unassigned" />
                    <Select.Icon><ChevronDown size={14} /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="ctd-select-content" position="popper" sideOffset={4}>
                      <Select.Viewport>
                        <Select.Item value="unassigned" className="ctd-select-item">
                          <Select.ItemText>Unassigned</Select.ItemText>
                        </Select.Item>
                        {members.map(m => (
                          <Select.Item key={m.user_id} value={m.user_id} className="ctd-select-item">
                            <Select.ItemText>{m.user?.name || m.name || m.email || m.user_id}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div className="ctd-field">
                <label className="ctd-label">Due Date (Optional)</label>
                <input type="date" className="ctd-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="ctd-actions">
                <button type="button" className="ctd-btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="ctd-btn-create" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Task →'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}