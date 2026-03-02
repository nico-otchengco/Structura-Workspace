import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { LayoutDashboard, Trash2 } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface Board {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface BoardsListProps {
  boards: Board[];
  loading: boolean;
  onSelectBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  isReadOnly: boolean;
}

export function BoardsList({ boards, loading, onSelectBoard, onDeleteBoard, isReadOnly }: BoardsListProps) {
  const [deletingBoard, setDeletingBoard] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <LayoutDashboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-600">Create your first board to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((board) => (
        <Card
          key={board.id}
          className="hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div onClick={() => onSelectBoard(board)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{board.name}</CardTitle>
                  {board.description && (
                    <CardDescription className="mt-2">{board.description}</CardDescription>
                  )}
                </div>
                <LayoutDashboard className="h-8 w-8 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Created {new Date(board.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </div>
          {!isReadOnly && (
            <div className="px-6 pb-4">
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingBoard(board.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Board
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                  <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                    <AlertDialog.Title className="text-lg font-semibold mb-2">
                      Delete Board
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-gray-600 mb-6">
                      Are you sure you want to delete "{board.name}"? This action cannot be undone and will delete all tasks in this board.
                    </AlertDialog.Description>
                    <div className="flex justify-end space-x-3">
                      <AlertDialog.Cancel asChild>
                        <Button variant="outline">Cancel</Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            onDeleteBoard(board.id);
                            setDeletingBoard(null);
                          }}
                        >
                          Delete
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
