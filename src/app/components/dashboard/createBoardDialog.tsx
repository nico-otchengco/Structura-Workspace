import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import '@/styles/style.css';

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export function CreateBoardDialog({ open, onClose, onCreate }: CreateBoardDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onCreate(name, description);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="cbd-overlay" />
          <Dialog.Content className="cbd-content">
            <div className="cbd-header">
              <Dialog.Title className="cbd-title">Create New Board</Dialog.Title>
              <Dialog.Close asChild>
                <button className="cbd-close"><X size={14} /></button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="cbd-error">{error}</div>}
              <div className="cbd-field">
                <label className="cbd-label" htmlFor="board-name">Board Name</label>
                <input
                  id="board-name"
                  className="cbd-input"
                  placeholder="Development Sprint"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="cbd-field">
                <label className="cbd-label" htmlFor="board-desc">Description (Optional)</label>
                <textarea
                  id="board-desc"
                  className="cbd-input cbd-textarea"
                  placeholder="Sprint planning for Q1..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="cbd-actions">
                <button type="button" className="cbd-btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="cbd-btn-create" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Board →'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}