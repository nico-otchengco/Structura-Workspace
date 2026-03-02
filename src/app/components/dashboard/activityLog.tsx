import React, { useState, useEffect } from 'react';
import { organizationsAPI } from '../../../lib/api';
import { Card, CardContent } from '../ui/Card';
import { Activity, Plus, Edit, Trash, UserPlus, UserMinus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

interface ActivityLogProps {
  organizationId: string;
}

export function ActivityLog({ organizationId }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [organizationId]);

  const loadActivities = async () => {
    try {
      const { activities: activityList } = await organizationsAPI.getActivities(organizationId, 50);
      setActivities(activityList);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-5 w-5 text-green-600" />;
      case 'updated':
        return <Edit className="h-5 w-5 text-blue-600" />;
      case 'deleted':
        return <Trash className="h-5 w-5 text-red-600" />;
      case 'added_member':
        return <UserPlus className="h-5 w-5 text-purple-600" />;
      case 'removed_member':
        return <UserMinus className="h-5 w-5 text-orange-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const userName = activity.user?.name || 'Someone';
    const { action, resource_type, metadata } = activity;

    switch (action) {
      case 'created':
        if (resource_type === 'organization') {
          return `${userName} created the organization`;
        } else if (resource_type === 'board') {
          return `${userName} created board "${metadata.name}"`;
        } else if (resource_type === 'task') {
          return `${userName} created task "${metadata.title}"`;
        }
        break;
      case 'updated':
        if (resource_type === 'task') {
          return `${userName} updated task "${metadata.title}"`;
        }
        break;
      case 'deleted':
        if (resource_type === 'board') {
          return `${userName} deleted board "${metadata.name}"`;
        } else if (resource_type === 'task') {
          return `${userName} deleted task "${metadata.title}"`;
        }
        break;
      case 'added_member':
        return `${userName} invited ${metadata.invited_user} as ${metadata.role}`;
      case 'removed_member':
        return `${userName} removed a team member`;
    }

    return `${userName} ${action} ${resource_type}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
          <p className="text-gray-600">Activity will appear here as your team works</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
        <p className="text-gray-600 mt-1">Recent activity in your organization</p>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
