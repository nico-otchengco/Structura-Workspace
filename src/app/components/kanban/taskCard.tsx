import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Trash2, Edit, AlertCircle, ArrowUp, ArrowRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import * as Select from '@radix-ui/react-select';
import { X, ChevronDown } from 'lucide-react';
import type { Task } from '../types/type';


interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  isReadOnly: boolean;
}


export function TaskCard({ task, onUpdate, onDelete, isReadOnly }: TaskCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const dragRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isReadOnly,
  }));

  drag(dragRef);

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority,
    });
    setShowEditDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-3 w-3" />;
      case 'medium':
        return <ArrowUp className="h-3 w-3" />;
      case 'low':
        return <ArrowRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        ref={dragRef}
        className={`cursor-move hover:shadow-md transition-shadow ${
          isDragging ? 'opacity-50' : 'opacity-100'
        } ${isReadOnly ? 'cursor-default' : ''}`}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                {getPriorityIcon(task.priority)}
                <span className="ml-1">{task.priority}</span>
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
            )}
            {!isReadOnly && (
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                      <AlertDialog.Title className="text-lg font-semibold mb-2">
                        Delete Task
                      </AlertDialog.Title>
                      <AlertDialog.Description className="text-gray-600 mb-6">
                        Are you sure you want to delete "{task.title}"? This action cannot be undone.
                      </AlertDialog.Description>
                      <div className="flex justify-end space-x-3">
                        <AlertDialog.Cancel asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button variant="destructive" onClick={() => onDelete(task.id)}>
                            Delete
                          </Button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog.Root open={showEditDialog} onOpenChange={setShowEditDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold">Edit Task</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select.Root value={editPriority} onValueChange={(value: any) => setEditPriority(value)}>
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
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
