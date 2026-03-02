import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/authContext';
import { organizationsAPI } from '../../../lib/api';
import { Button } from '../ui/Btn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Crd';
import { LogOut, Plus, Building2, Users, LayoutDashboard } from 'lucide-react';
import { CreateOrganizationDialog } from './createOrganizationDialog';
import { OrganizationView } from './orgView';

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

  useEffect(() => {
    loadOrganizations();
  }, []);

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
    return (
      <OrganizationView
        organization={selectedOrg}
        onBack={() => setSelectedOrg(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Manager</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Organizations</h2>
            <p className="text-gray-600 mt-1">
              Manage your projects and collaborate with your team
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>

        {loading ? (
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
        ) : organizations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No organizations yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first organization
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrg(org)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{org.name}</CardTitle>
                      <CardDescription className="mt-1.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {org.subscription_tier}
                        </span>
                      </CardDescription>
                    </div>
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="capitalize">{org.userRole}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateOrganizationDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateOrganization}
      />
    </div>
  );
}
