import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../../../lib/api';
import { Plus, Mail, UserX, Crown, Shield, User, Eye, X, ChevronDown } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Select from '@radix-ui/react-select';
import '@/styles/style.css';

interface TeamMember { id: string; user_id: string; role: string; created_at: string; user: { name: string; email: string; }; }
interface TeamMembersProps { organizationId: string; userRole: string; }

const roleConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  owner: { bg: '#fef9c3', text: '#713f12', icon: <Crown size={11} /> },
  project_manager: { bg: '#ede9fe', text: '#4c1d95', icon: <Shield size={11} /> },
  member: { bg: '#eff6ff', text: '#1e3a5f', icon: <User size={11} /> },
  client: { bg: '#f3f4f6', text: '#374151', icon: <Eye size={11} /> },
};

export function TeamMembers({ organizationId, userRole }: TeamMembersProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => { loadMembers(); }, [organizationId]);

  const loadMembers = async () => {
    try { const r = await organizationsAPI.getMembers(organizationId); setMembers(r?.members || []); }
    catch (e) { console.error(e); setMembers([]); } finally { setLoading(false); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault(); setInviteError(''); setInviteLoading(true);
    try { await organizationsAPI.addMember(organizationId, inviteEmail, inviteRole); await loadMembers(); setInviteEmail(''); setInviteRole('member'); setShowInvite(false); }
    catch (err: any) { setInviteError(err.message || 'Failed to invite member'); }
    finally { setInviteLoading(false); }
  };

  const handleRemove = async (userId: string) => {
    try { await organizationsAPI.removeMember(organizationId, userId); await loadMembers(); }
    catch (e) { console.error(e); }
  };

  const canManage = userRole === 'owner' || userRole === 'project_manager';

  return (
    <>
      <div className="tm-root">
        <div className="tm-header">
          <div>
            <h2 className="tm-title">Team Members</h2>
            <p className="tm-sub">{members.length} member{members.length !== 1 ? 's' : ''} in this organization</p>
          </div>
          {canManage && (
            <button className="tm-invite-btn" onClick={() => setShowInvite(true)}>
              <Plus size={14} /> Invite Member
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div className="tm-skeleton" key={i}>
                <div className="tm-skel" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="tm-skel" style={{ height: 14, width: '30%', marginBottom: 8 }} />
                  <div className="tm-skel" style={{ height: 11, width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tm-list">
            {members.map((member, idx) => {
              const rc = roleConfig[member.role] || roleConfig.member;
              const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706'];
              const avatarColor = colors[idx % colors.length];
              return (
                <div className="tm-card" key={member.id}>
                  <div className="tm-left">
                    <div className="tm-avatar" style={{ background: avatarColor }}>
                      {(member.user?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="tm-name">
                        {member.user?.name || `User (${member.user_id.slice(0,5)}...)`}
                        <span className="tm-role-badge" style={{ background: rc.bg, color: rc.text }}>
                          {rc.icon} {member.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="tm-email">
                        <Mail size={11} />{member.user?.email || 'No email available'}
                      </div>
                    </div>
                  </div>
                  {canManage && member.role !== 'owner' && (
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <button className="tm-remove-btn"><UserX size={12} /> Remove</button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Overlay className="modal-overlay" />
                        <AlertDialog.Content className="modal-content">
                          <AlertDialog.Title className="modal-title" style={{ marginBottom: 10 }}>Remove Member</AlertDialog.Title>
                          <AlertDialog.Description style={{ fontSize: '0.875rem', color: '#6b6b7b', marginBottom: 28 }}>
                            Remove {member.user?.name || 'this member'} from the organization? They will lose access immediately.
                          </AlertDialog.Description>
                          <div className="modal-actions">
                            <AlertDialog.Cancel asChild><button className="modal-btn-cancel">Cancel</button></AlertDialog.Cancel>
                            <AlertDialog.Action asChild><button className="modal-btn-delete" onClick={() => handleRemove(member.user_id)}>Remove</button></AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Dialog.Root open={showInvite} onOpenChange={setShowInvite}>
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay" />
            <Dialog.Content className="modal-content">
              <div className="modal-header">
                <Dialog.Title className="modal-title">Invite Team Member</Dialog.Title>
                <Dialog.Close asChild><button className="modal-close"><X size={14} /></button></Dialog.Close>
              </div>
              <form onSubmit={handleInvite}>
                {inviteError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: '0.825rem', marginBottom: 16 }}>{inviteError}</div>}
                <div className="modal-field">
                  <label className="modal-label">Email Address</label>
                  <input type="email" className="modal-input" placeholder="colleague@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 5 }}>User must already have an account</div>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Role</label>
                  <Select.Root value={inviteRole} onValueChange={setInviteRole}>
                    <Select.Trigger className="modal-select-trigger"><Select.Value /><Select.Icon><ChevronDown size={14} /></Select.Icon></Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="modal-select-content" position="popper">
                        <Select.Viewport>
                          <Select.Item value="project_manager" className="modal-select-item"><Select.ItemText>Project Manager — Can manage boards & members</Select.ItemText></Select.Item>
                          <Select.Item value="member" className="modal-select-item"><Select.ItemText>Member — Can create and edit tasks</Select.ItemText></Select.Item>
                          <Select.Item value="client" className="modal-select-item"><Select.ItemText>Client — Read-only access</Select.ItemText></Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-btn-cancel" onClick={() => setShowInvite(false)}>Cancel</button>
                  <button type="submit" className="modal-btn-save" disabled={inviteLoading}>{inviteLoading ? 'Inviting...' : 'Send Invite'}</button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}