import React, { useState, useEffect } from 'react';
import { organizationsAPI, boardsAPI } from '../../../lib/api';
import { ArrowLeft, Plus, Users, Activity, LayoutDashboard, Calendar, ChevronRight, Bot, Trash2, AlertTriangle } from 'lucide-react';
import { BoardsList } from './boardsList';
import { TeamMembers } from './teamMembers';
import { ActivityLog } from './activityLog';
import { CreateBoardDialog } from './createBoardDialog';
import { BoardView } from '../kanban/boardView';
import { CalendarView } from './calendarView';
import { AiAssistant } from './aiAssistant';
import '@/styles/style.css';

interface Organization { id: string; name: string; subscription_tier: string; userRole: string; }
interface Board { id: string; organization_id: string; name: string; description: string | null; created_at: string; created_by: string; }
interface OrganizationViewProps { organization: Organization; onBack: () => void; onCreateOrg?: () => void; }
type ActiveTab = 'boards' | 'team' | 'activity' | 'calendar';

export function OrganizationView({ organization, onBack, onCreateOrg }: OrganizationViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiContext, setAiContext] = useState<any>({ organizationName: organization.name, boards: [], tasks: [], activities: [] });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { loadBoards(); }, [organization.id]);

  const loadBoards = async () => {
    try {
      const { boards: boardsList } = await organizationsAPI.getBoards(organization.id);
      setBoards(boardsList);
    } catch (error) { console.error('Failed to load boards:', error); }
    finally { setLoading(false); }
  };

  const loadAiContext = async () => {
    try {
      const [{ boards: boardsList }, { activities }] = await Promise.all([
        organizationsAPI.getBoards(organization.id),
        organizationsAPI.getActivities(organization.id, 30),
      ]);
      const allTasks: any[] = [];
      for (const board of boardsList) {
        const { tasks } = await boardsAPI.getTasks(board.id);
        tasks.forEach((t: any) => allTasks.push({ ...t, board: board.name }));
      }
      setAiContext({
        organizationName: organization.name, boards: boardsList, tasks: allTasks,
        activities: activities.map((a: any) => ({
          action: a.action, resource_type: a.resource_type,
          user: a.user?.name || a.user?.email || 'Someone', created_at: a.created_at,
        })),
      });
    } catch (error) { console.error('Failed to load AI context:', error); }
  };

  const handleOpenAI = () => { loadAiContext(); setShowAI(true); };

  const handleCreateBoard = async (name: string, description: string) => {
    try { await boardsAPI.create(organization.id, name, description); await loadBoards(); setShowCreateBoard(false); }
    catch (error) { console.error('Failed to create board:', error); throw error; }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try { await boardsAPI.delete(boardId); await loadBoards(); }
    catch (error) { console.error('Failed to delete board:', error); }
  };

  const handleDeleteOrg = async () => {
    if (deleteConfirmName !== organization.name) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await organizationsAPI.delete(organization.id);
      onBack();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete organization');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (selectedBoard) return <BoardView board={selectedBoard} organization={organization} onBack={() => setSelectedBoard(null)} />;

  const isReadOnly = organization.userRole === 'client';
  const isOwner = organization.userRole === 'owner';
  const canUseAI = organization.userRole !== 'client';
  const nameMatches = deleteConfirmName === organization.name;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'boards', label: 'Boards', icon: <LayoutDashboard size={17} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={17} /> },
    { id: 'team', label: 'Team', icon: <Users size={17} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={17} /> },
  ];

  const tierBg: Record<string, string> = { free: '#f0fdf4', pro: '#fef3c7', enterprise: '#ede9fe' };
  const tierText: Record<string, string> = { free: '#15803d', pro: '#92400e', enterprise: '#6d28d9' };

  return (
    <>
      <div className="ov-root">
        <header className="ov-header">
          <div className="ov-header-inner">
            <div className="ov-header-left">
              <button className="ov-back" onClick={onBack}><ArrowLeft size={16} /></button>
              <div>
                <div className="ov-org-name">{organization.name}</div>
                <div className="ov-badges">
                  <span className="ov-badge" style={{ background: tierBg[organization.subscription_tier] || '#f3f4f6', color: tierText[organization.subscription_tier] || '#374151' }}>
                    {organization.subscription_tier.charAt(0).toUpperCase() + organization.subscription_tier.slice(1)}
                  </span>
                  <span className="ov-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                    {organization.userRole.charAt(0).toUpperCase() + organization.userRole.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="ov-header-right">
              {onCreateOrg && (
                <button className="ov-new-org-btn" onClick={onCreateOrg}>
                  <Plus size={14} /> New Organization
                </button>
              )}
              {canUseAI && (
                <button className="ov-ai-btn" onClick={handleOpenAI}>
                  <Bot size={14} /> AI Assistant
                </button>
              )}
              {isOwner && (
                <button className="ov-delete-org-btn" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 size={14} /> Delete Org
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="ov-body">
          <aside className="ov-sidebar">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map(item => (
                <button key={item.id} className={`ov-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  <div className="ov-nav-item-left">{item.icon}<span>{item.label}</span></div>
                  {activeTab === item.id && <ChevronRight size={14} />}
                </button>
              ))}
            </nav>
            <div className="ov-sidebar-boards">
              <div className="ov-sidebar-label">Quick Access</div>
              {boards.slice(0, 6).map(board => (
                <button key={board.id} className="ov-board-link" onClick={() => setSelectedBoard(board)}>
                  <div className="ov-board-dot" />{board.name}
                </button>
              ))}
              {boards.length > 6 && <div style={{ fontSize: '0.75rem', color: '#9ca3af', padding: '4px 12px' }}>+{boards.length - 6} more</div>}
            </div>
          </aside>

          <main className="ov-main">
            {activeTab === 'boards' && (
              <>
                <div className="ov-section-header">
                  <div>
                    <h2 className="ov-section-title">Boards</h2>
                    <p className="ov-section-sub">Manage your project boards</p>
                  </div>
                  {!isReadOnly && (
                    <button className="ov-new-btn" onClick={() => setShowCreateBoard(true)}>
                      <Plus size={14} /> New Board
                    </button>
                  )}
                </div>
                <BoardsList boards={boards} loading={loading} onSelectBoard={setSelectedBoard} onDeleteBoard={handleDeleteBoard} isReadOnly={isReadOnly} />
              </>
            )}
            {activeTab === 'calendar' && <CalendarView boards={boards} />}
            {activeTab === 'team' && <TeamMembers organizationId={organization.id} userRole={organization.userRole} />}
            {activeTab === 'activity' && <ActivityLog organizationId={organization.id} />}
          </main>
        </div>

        <CreateBoardDialog open={showCreateBoard} onClose={() => setShowCreateBoard(false)} onCreate={handleCreateBoard} />
        {canUseAI && <AiAssistant isOpen={showAI} onClose={() => setShowAI(false)} context={aiContext} />}
      </div>

      {/* Delete Organization Modal */}
      {showDeleteModal && (
        <div className="del-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="del-modal">
            <div className="del-icon"><Trash2 size={22} color="#ef4444" /></div>
            <div className="del-title">Delete Organization</div>
            <p className="del-desc">
              You're about to permanently delete <span className="del-org-name">"{organization.name}"</span>. This action cannot be undone.
            </p>

            <div className="del-warning">
              <div className="del-warning-title">
                <AlertTriangle size={13} /> This will permanently delete:
              </div>
              <div className="del-warning-item"><div className="del-warning-dot" />{boards.length} board{boards.length !== 1 ? 's' : ''}</div>
              <div className="del-warning-item"><div className="del-warning-dot" />All tasks across all boards</div>
              <div className="del-warning-item"><div className="del-warning-dot" />All team member access</div>
              <div className="del-warning-item"><div className="del-warning-dot" />All activity history</div>
            </div>

            {deleteError && <div className="del-error">{deleteError}</div>}

            <label className="del-label">
              Type <span className="del-org-name">{organization.name}</span> to confirm
            </label>
            <input
              className={`del-input ${nameMatches ? 'match' : ''}`}
              placeholder={organization.name}
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              autoFocus
            />

            <div className="del-actions">
              <button className="del-cancel" onClick={() => { setShowDeleteModal(false); setDeleteConfirmName(''); setDeleteError(''); }}>
                Cancel
              </button>
              <button className="del-confirm" disabled={!nameMatches || deleteLoading} onClick={handleDeleteOrg}>
                {deleteLoading ? 'Deleting...' : 'Delete Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}