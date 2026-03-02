import React, { useState, useEffect } from 'react';
import { boardsAPI } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Analytics {
  total: number;
  by_status: {
    todo: number;
    in_progress: number;
    done: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
  };
  completion_rate: string;
}

interface TaskAnalyticsProps {
  boardId: string;
}

export function TaskAnalytics({ boardId }: TaskAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [boardId]);

  const loadAnalytics = async () => {
    try {
      const { analytics: analyticsData } = await boardsAPI.getAnalytics(boardId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load analytics</p>
      </div>
    );
  }

  const statusData = [
    { name: 'To Do', value: analytics.by_status.todo, color: '#3B82F6' },
    { name: 'In Progress', value: analytics.by_status.in_progress, color: '#EAB308' },
    { name: 'Done', value: analytics.by_status.done, color: '#10B981' },
  ];

  const priorityData = [
    { name: 'Low', value: analytics.by_priority.low, fill: '#10B981' },
    { name: 'Medium', value: analytics.by_priority.medium, fill: '#EAB308' },
    { name: 'High', value: analytics.by_priority.high, fill: '#EF4444' },
  ];

  const COLORS = ['#3B82F6', '#EAB308', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">To Do</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.by_status.todo}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.by_status.in_progress}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.by_status.done}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#E5E7EB"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#10B981"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${(parseFloat(analytics.completion_rate) / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">{analytics.completion_rate}%</p>
                  <p className="text-sm text-gray-600 mt-1">Complete</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Task Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
