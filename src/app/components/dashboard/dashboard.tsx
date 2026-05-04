import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/authContext';
import { organizationsAPI } from '../../../lib/api';
import { LogOut, Plus, Building2, Users, ChevronRight } from 'lucide-react';
import { CreateOrganizationDialog } from './createOrganizationDialog';
import { OrganizationView } from './orgView';
import '@/styles/style.css';

interface Organization {
  id: string;
  name: string;
  subscription_tier: string;
  created_at: string;
  userRole: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => { loadOrganizations(); }, []);

  const loadOrganizations = async () => {
    try {
      const { organizations: orgs } = await organizationsAPI.list();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (name: string, tier: string) => {
    try {
      await organizationsAPI.create(name, tier);
      await loadOrganizations();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  };

  if (selectedOrg) {
    return <OrganizationView organization={selectedOrg} onBack={() => setSelectedOrg(null)} />;
  }

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
      case 'enterprise': return { bg: '#ede9fe', text: '#4c1d95', dot: '#7c3aed' };
      default: return { bg: '#f0fdf4', text: '#14532d', dot: '#22c55e' };
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'owner': return { bg: '#fef9c3', text: '#713f12' };
      case 'project_manager': return { bg: '#ede9fe', text: '#4c1d95' };
      case 'member': return { bg: '#eff6ff', text: '#1e3a5f' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <>
      <div className="dash-root">
        <header className="dash-header">
          <div className="dash-header-inner">
            <div className="dash-logo">
              <div className="dash-logo-box">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/></svg>
              </div>
              <span className="dash-logo-name">Structura</span>
            </div>
            <div className="dash-user">
              <span className="dash-user-email">{user?.user_metadata?.name || user?.email}</span>
              <button className="dash-signout" onClick={signOut}>
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="dash-main">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-title">Your Organizations</h1>
              <p className="dash-page-sub">Select a workspace to get started</p>
            </div>
          </div>

          {loading ? (
            <div className="dash-grid">
              {[1,2,3].map(i => (
                <div className="dash-skeleton" key={i}>
                  <div className="dash-skel-line" style={{ height: 44, width: 44, borderRadius: 12, marginBottom: 20 }} />
                  <div className="dash-skel-line" style={{ height: 18, width: '60%', marginBottom: 12 }} />
                  <div className="dash-skel-line" style={{ height: 12, width: '40%' }} />
                </div>
              ))}
            </div>
          ) : organizations.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Building2 size={24} color="#9ca3af" /></div>
              <h3 className="dash-empty-title">No organizations yet</h3>
              <p className="dash-empty-sub">Create your first workspace to start managing projects</p>
              <button className="dash-new-btn" style={{ margin: '0 auto' }} onClick={() => setShowCreateDialog(true)}>
                <Plus size={15} /> Create Organization
              </button>
            </div>
          ) : (
            <div className="dash-grid">
              {organizations.map(org => {
                const tc = tierColor(org.subscription_tier.charAt(0).toUpperCase() + org.subscription_tier.slice(1));
                const rc = roleColor(org.userRole);
                return (
                  <div className="dash-card" key={org.id} onClick={() => setSelectedOrg(org)}>
                    <div className="dash-card-top">
                      <div className="dash-card-icon"><Building2 size={20} color="#6b6b7b" /></div>
                      <ChevronRight size={18} className="dash-card-arrow" />
                    </div>
                    <div className="dash-card-name">{org.name}</div>
                    <div className="dash-card-badges">
                      <span className="dash-badge" style={{ background: tc.bg, color: tc.text }}>
                        <span className="dash-badge-dot" style={{ background: tc.dot }} />
                        {org.subscription_tier}
                      </span>
                      <span className="dash-badge" style={{ background: rc.bg, color: rc.text }}>
                        {org.userRole}
                      </span>
                    </div>
                    <div className="dash-card-footer">
                      <Users size={12} />
                      Created {new Date(org.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <CreateOrganizationDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateOrganization}
        />
      </div>
    </>
  );
}