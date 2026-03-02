import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { X, ChevronDown } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (taskData: any) => Promise<void>;
  initialStatus: string;
}

export function CreateTaskDialog({ open, onClose, onCreate, initialStatus }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
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
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
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
            <Dialog.Title className="text-xl font-semibold">Create New Task</Dialog.Title>
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
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Fix login bug"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description (Optional)</Label>
              <textarea
                id="task-description"
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Users are unable to log in with social authentication..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select.Root value={priority} onValueChange={setPriority}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200 z-[60]">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="low"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                      >
                        <Select.ItemText>Low</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="medium"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                      >
                        <Select.ItemText>Medium</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="high"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                      >
                        <Select.ItemText>High</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
