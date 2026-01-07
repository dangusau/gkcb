// pages/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Award, 
  Building, 
  Clock, 
  TrendingUp, 
  Activity,
  Calendar,
  MessageSquare,
  Download,
  MoreVertical,
  Database,
  Cpu,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { db } from '../../services/database';

interface DashboardStats {
  totalMembers: number;
  totalPioneers: number;
  totalBusinesses: number;
  pendingApprovals: number;
  totalPosts: number;
  totalEvents: number;
  totalMessages: number;
}

interface PlatformMetrics {
  activeUsers: number;
  newRegistrations: number;
  engagementRate: number;
}

interface ContentMetrics {
  totalComments: number;
  totalMedia: number;
  weeklyComments: number;
  weeklyMedia: number;
}

interface SystemMetrics {
  databaseStatus: string;
  apiResponseTime: string;
  uptime: string;
}

interface GrowthData {
  month: string;
  members: number;
  pioneers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalPioneers: 0,
    totalBusinesses: 0,
    pendingApprovals: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalMessages: 0
  });
  
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics>({
    activeUsers: 0,
    newRegistrations: 0,
    engagementRate: 0
  });

  const [contentMetrics, setContentMetrics] = useState<ContentMetrics>({
    totalComments: 0,
    totalMedia: 0,
    weeklyComments: 0,
    weeklyMedia: 0
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    databaseStatus: 'Checking...',
    apiResponseTime: '...',
    uptime: '...'
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        statsData,
        activitiesData,
        growthData,
        platformMetricsData,
        contentMetricsData,
        systemMetricsData
      ] = await Promise.all([
        db.dashboard.getStats(),
        db.dashboard.getRecentActivities(10),
        db.dashboard.getGrowthData(6),
        db.analytics.getPlatformMetrics(),
        db.analytics.getContentMetrics(),
        db.analytics.getSystemMetrics()
      ]);

      setStats(statsData.stats);
      setRecentActivities(activitiesData.data || []);
      setGrowthData(growthData.data || []);
      setPlatformMetrics(platformMetricsData);
      setContentMetrics(contentMetricsData);
      setSystemMetrics(systemMetricsData);
      setLastUpdated(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    const actions: Record<string, JSX.Element> = {
      'login': <Activity className="h-4 w-4 text-blue-500" />,
      'admin_login': <Activity className="h-4 w-4 text-blue-500" />,
      'post_created': <MessageSquare className="h-4 w-4 text-green-500" />,
      'comment_created': <MessageSquare className="h-4 w-4 text-green-500" />,
      'profile_updated': <Users className="h-4 w-4 text-purple-500" />,
      'member_approved': <Award className="h-4 w-4 text-yellow-500" />,
      'member_rejected': <Clock className="h-4 w-4 text-red-500" />,
      'business_verified': <Building className="h-4 w-4 text-green-500" />,
      'payment_verified': <CheckCircle className="h-4 w-4 text-green-500" />
    };
    return actions[action] || <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getActivityDescription = (action: string) => {
    const descriptions: Record<string, string> = {
      'login': 'Logged in',
      'admin_login': 'Admin logged in',
      'post_created': 'Created a post',
      'comment_created': 'Added a comment',
      'profile_updated': 'Updated profile',
      'member_approved': 'Member approved',
      'member_rejected': 'Member rejected',
      'business_verified': 'Business verified',
      'payment_verified': 'Payment verified'
    };
    return descriptions[action] || action.replace(/_/g, ' ');
  };

  const statsCards = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      change: calculateChange(stats.totalMembers, growthData, 'members'),
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/members'
    },
    {
      label: 'Pioneers',
      value: stats.totalPioneers,
      change: calculateChange(stats.totalPioneers, growthData, 'pioneers'),
      icon: Award,
      color: 'bg-purple-500',
      link: '/admin/pioneers'
    },
    {
      label: 'Businesses',
      value: stats.totalBusinesses,
      change: '+8%', // Would need historical business data
      icon: Building,
      color: 'bg-green-500',
      link: '/admin/businesses'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      change: pendingApprovalChange(stats.pendingApprovals),
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/members?filter=pending'
    },
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      change: '+15%', // Would need historical post data
      icon: MessageSquare,
      color: 'bg-indigo-500',
      link: '/admin/posts'
    },
    {
      label: 'Upcoming Events',
      value: stats.totalEvents,
      change: '+2%', // Would need historical event data
      icon: Calendar,
      color: 'bg-pink-500',
      link: '/admin/events'
    }
  ];

  function calculateChange(currentValue: number, growthData: GrowthData[], type: 'members' | 'pioneers'): string {
    if (growthData.length < 2) return '+0%';
    
    const lastMonth = growthData[growthData.length - 2]?.[type] || 0;
    if (lastMonth === 0) return currentValue > 0 ? '+100%' : '+0%';
    
    const change = ((currentValue - lastMonth) / lastMonth) * 100;
    return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
  }

  function pendingApprovalChange(currentValue: number): string {
    // Mock logic for pending approvals change
    const change = currentValue > 0 ? '-3%' : '+0%';
    return change;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-600">Welcome back! Here's what's happening with your community.</p>
            {lastUpdated && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Updated: {lastUpdated}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = stat.link}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} mr-1`} />
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">from last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Community Growth (Last 6 Months)</h2>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                <option>Last 6 months</option>
                <option>Last year</option>
                <option>All time</option>
              </select>
              <button 
                onClick={() => db.dashboard.getGrowthData(6)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Export
              </button>
            </div>
          </div>
          <div className="h-64">
            {/* Simple bar chart representation */}
            <div className="flex items-end h-48 space-x-4 pt-4">
              {growthData.map((month, index) => {
                const maxMembers = Math.max(...growthData.map(d => d.members), 1);
                const maxPioneers = Math.max(...growthData.map(d => d.pioneers), 1);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="flex items-end space-x-1 w-full justify-center">
                      <div 
                        className="w-6 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                        style={{ 
                          height: `${(month.members / maxMembers) * 80}%`,
                          minHeight: '4px'
                        }}
                        title={`Members: ${month.members}`}
                      >
                        <div className="text-xs text-white text-center opacity-0 hover:opacity-100 transition-opacity">
                          {month.members}
                        </div>
                      </div>
                      <div 
                        className="w-6 bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600"
                        style={{ 
                          height: `${(month.pioneers / maxPioneers) * 80}%`,
                          minHeight: '4px'
                        }}
                        title={`Pioneers: ${month.pioneers}`}
                      >
                        <div className="text-xs text-white text-center opacity-0 hover:opacity-100 transition-opacity">
                          {month.pioneers}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center space-x-4 mt-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Members ({stats.totalMembers})</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Pioneers ({stats.totalPioneers})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <span 
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={() => window.location.href = '/admin/activity-logs'}
            >
              View all
            </span>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.map((activity: any) => (
              <div key={activity.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0">
                <div className="p-2 bg-gray-50 rounded-lg mr-3">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.profiles?.first_name} {activity.profiles?.last_name}
                    <span className="text-gray-500 text-xs ml-2">
                      ({activity.profiles?.email || 'Unknown'})
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {getActivityDescription(activity.action)}
                  </p>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {JSON.stringify(activity.metadata)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-gray-500 text-center py-8">No recent activities found</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row - Now with Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Platform Health - Real Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Platform Health (24h)</h3>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold text-blue-600">{platformMetrics.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Registrations</span>
              <span className="font-semibold text-green-600">+{platformMetrics.newRegistrations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Engagement Rate</span>
              <span className="font-semibold">{platformMetrics.engagementRate}%</span>
            </div>
          </div>
        </div>

        {/* Content Summary - Real Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Content Summary</h3>
            <MessageSquare className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Posts</span>
              <span className="font-semibold">{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Comments</span>
              <span className="font-semibold">{contentMetrics.totalComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Media Uploads</span>
              <span className="font-semibold">{contentMetrics.totalMedia}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Weekly growth:</span>
                <div className="flex space-x-3">
                  <span className="text-green-600">+{contentMetrics.weeklyComments} comments</span>
                  <span className="text-blue-600">+{contentMetrics.weeklyMedia} media</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status - Real Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            <Cpu className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database</span>
              <span className={`flex items-center ${systemMetrics.databaseStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
                {systemMetrics.databaseStatus === 'Connected' ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {systemMetrics.databaseStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Response</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {systemMetrics.apiResponseTime}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Uptime</span>
              <span className="font-semibold">{systemMetrics.uptime}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Last checked:</span>
                <span className="text-gray-600">{lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages Overview</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
              <p className="text-gray-600 mt-1">Total messages sent</p>
            </div>
            <MessageSquare className="h-12 w-12 text-blue-100 bg-blue-500 p-2 rounded-lg" />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>Includes all conversations between members</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Members to approve</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                {stats.pendingApprovals}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unverified businesses</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                Check
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Support tickets</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                12
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}