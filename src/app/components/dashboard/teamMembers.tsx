import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../../../lib/api';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Plus, Mail, UserX, Crown, User, Eye } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Select from '@radix-ui/react-select';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { X, ChevronDown } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

interface TeamMembersProps {
  organizationId: string;
  userRole: string;
}

export function TeamMembers({ organizationId, userRole }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  const loadMembers = async () => {
    try {
      const response = await organizationsAPI.getMembers(organizationId);
      setMembers(response?.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
};

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    try {
      await organizationsAPI.addMember(organizationId, inviteEmail, inviteRole);
      await loadMembers();
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteDialog(false);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to invite member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await organizationsAPI.removeMember(organizationId, userId);
      await loadMembers();
      setRemovingMember(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'project_manager':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'member':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'client':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'project_manager':
        return 'bg-purple-100 text-purple-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageMembers = userRole === 'owner' || userRole === 'project_manager';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-600 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {member.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{member.user?.name || `User (${member.user_id.slice(0,5)}...)`}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{member.role}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {member.user?.email || 'No email available'}
                    </p>
                  </div>
                </div>
                {canManageMembers && member.role !== 'owner' && (
                  <AlertDialog.Root>
                    <AlertDialog.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Portal>
                      <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                      <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                        <AlertDialog.Title className="text-lg font-semibold mb-2">
                          Remove Member
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-gray-600 mb-6">
                          Are you sure you want to remove {member.user?.name || 'this member'} from this organization?
                        </AlertDialog.Description>
                        <div className="flex justify-end space-x-3">
                          <AlertDialog.Cancel asChild>
                            <Button variant="outline">Cancel</Button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleRemove(member.user_id)}
                            >
                              Remove
                            </Button>
                          </AlertDialog.Action>
                        </div>
                      </AlertDialog.Content>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Dialog */}
      <Dialog.Root open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold">Invite Team Member</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {inviteError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">User must already have an account</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select.Root value={inviteRole} onValueChange={setInviteRole}>
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
                          value="project_manager"
                          className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                        >
                          <Select.ItemText>Project Manager - Can manage boards and members</Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          value="member"
                          className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                        >
                          <Select.ItemText>Member - Can create and edit boards</Select.ItemText>
                        </Select.Item>
                        <Select.Item
                          value="client"
                          className="relative flex items-center px-8 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 outline-none"
                        >
                          <Select.ItemText>Client - Read-only access</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
