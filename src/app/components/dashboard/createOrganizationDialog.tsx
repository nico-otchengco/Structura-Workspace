import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { X } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, tier: string) => Promise<void>;
}

export function CreateOrganizationDialog({ open, onClose, onCreate }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onCreate(name, tier);
      setName('');
      setTier('free');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
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
            <Dialog.Title className="text-xl font-semibold">
              Create New Organization
            </Dialog.Title>
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
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select.Root value={tier} onValueChange={setTier}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="free"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                      >
                        <Select.ItemText>Free</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="pro"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                      >
                        <Select.ItemText>Pro</Select.ItemText>
                      </Select.Item>
                      <Select.Item
                        value="enterprise"
                        className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                      >
                        <Select.ItemText>Enterprise</Select.ItemText>
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
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
