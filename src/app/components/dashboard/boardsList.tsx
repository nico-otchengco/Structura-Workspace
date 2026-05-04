import { LayoutDashboard, Trash2, ChevronRight, Calendar } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import '@/styles/style.css';

interface Board { id: string; organization_id: string; name: string; description: string | null; created_at: string; created_by: string; }
interface BoardsListProps { boards: Board[]; loading: boolean; onSelectBoard: (board: Board) => void; onDeleteBoard: (boardId: string) => void; isReadOnly: boolean; }

export function BoardsList({ boards, loading, onSelectBoard, onDeleteBoard, isReadOnly }: BoardsListProps) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: 18, padding: 24, border: '1px solid rgba(10,10,15,0.08)' }}>
            <div style={{ height: 40, width: 40, borderRadius: 10, background: '#f0efeb', marginBottom: 16, animation: 'dash-pulse 1.5s infinite' }} />
            <div style={{ height: 16, width: '60%', borderRadius: 6, background: '#f0efeb', marginBottom: 10, animation: 'dash-pulse 1.5s infinite' }} />
            <div style={{ height: 12, width: '40%', borderRadius: 6, background: '#f0efeb', animation: 'dash-pulse 1.5s infinite' }} />
          </div>
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: 24, border: '2px dashed rgba(10,10,15,0.1)', padding: '64px 40px', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <LayoutDashboard size={22} color="#9ca3af" />
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#0a0a0f', marginBottom: 6 }}>No boards yet</div>
        <div style={{ fontSize: '0.875rem', color: '#6b6b7b' }}>Create your first board to start organizing tasks</div>
      </div>
    );
  }

  return (
    <>
      <div className="bl-grid">
        {boards.map(board => (
          <div className="bl-card" key={board.id}>
            <div className="bl-card-body" onClick={() => onSelectBoard(board)}>
              <div className="bl-card-top">
                <div className="bl-card-icon"><LayoutDashboard size={18} color="#6b6b7b" /></div>
                <ChevronRight size={16} className="bl-card-arrow" />
              </div>
              <div className="bl-card-name">{board.name}</div>
              {board.description && <div className="bl-card-desc">{board.description}</div>}
              <div className="bl-card-meta">
                <Calendar size={11} />
                Created {new Date(board.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            {!isReadOnly && (
              <div className="bl-card-footer">
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <button className="bl-delete-btn" onClick={e => e.stopPropagation()}>
                      <Trash2 size={12} /> Delete Board
                    </button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay className="al-overlay" />
                    <AlertDialog.Content className="al-content">
                      <AlertDialog.Title className="al-title">Delete Board</AlertDialog.Title>
                      <AlertDialog.Description className="al-desc">
                        Are you sure you want to delete "{board.name}"? This will permanently delete all tasks in this board.
                      </AlertDialog.Description>
                      <div className="al-actions">
                        <AlertDialog.Cancel asChild><button className="al-btn-cancel">Cancel</button></AlertDialog.Cancel>
                        <AlertDialog.Action asChild><button className="al-btn-delete" onClick={() => onDeleteBoard(board.id)}>Delete Board</button></AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}