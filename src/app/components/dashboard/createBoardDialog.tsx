import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { X } from 'lucide-react';

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
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold">Create New Board</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                placeholder="Development Sprint"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-description">Description (Optional)</Label>
              <textarea
                id="board-description"
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Sprint planning for Q1..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Board'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
