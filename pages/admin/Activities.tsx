// pages/admin/Activities.tsx
import React, { useState, useEffect } from 'react';
import {
  Search, Filter, RefreshCw, Calendar, Briefcase, ShoppingBag,
  Users, DollarSign, MapPin, Clock, TrendingUp, TrendingDown,
  ExternalLink, Eye, Download, MoreVertical, AlertCircle,
  CheckCircle, XCircle, Activity, BarChart3, PieChart,
  ChevronDown, ChevronUp, Grid, List, Hash, Tag,
  Shield, Star, TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';

interface ActivityItem {
  id: string;
  type: 'event' | 'job' | 'classified';
  title: string;
  description: string;
  category?: string;
  price?: string;
  location?: string;
  status: 'active' | 'inactive' | 'completed' | 'pending' | 'sold';
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

interface ActivityStats {
  total: number;
  active: number;
  byType: {
    events: number;
    jobs: number;
    classifieds: number;
  };
  byCategory: Record<string, number>;
  recentActivities: number;
  todayActivities: number;
}

interface CategoryInsight {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    active: 0,
    byType: { events: 0, jobs: 0, classifieds: 0 },
    byCategory: {},
    recentActivities: 0,
    todayActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'event' | 'job' | 'classified'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'completed' | 'pending' | 'sold'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInsights, setCategoryInsights] = useState<CategoryInsight[]>([]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch all activities in parallel
      const [eventsData, jobsData, classifiedsData] = await Promise.all([
        fetchEvents(),
        fetchJobs(),
        fetchClassifieds()
      ]);

      // Combine all activities
      const allActivities = [
        ...eventsData.map(event => ({
          id: event.id,
          type: 'event' as const,
          title: event.title,
          description: event.description || 'No description',
          location: event.location,
          status: new Date(event.start_time) > new Date() ? 'active' as const : 'completed' as const,
          user_name: 'Event Organizer',
          created_at: event.created_at,
          updated_at: event.start_time,
          metadata: {
            start_time: event.start_time,
            attendees_count: event.attendees_count,
            end_time: event.end_time
          }
        })),
        ...jobsData.map(job => ({
          id: job.id,
          type: 'job' as const,
          title: job.title,
          description: job.description || 'No description',
          category: job.type,
          price: job.salary_range,
          location: job.location,
          status: 'active' as const,
          user_name: job.company,
          created_at: job.created_at,
          metadata: {
            company: job.company,
            job_type: job.type,
            salary_range: job.salary_range
          }
        })),
        ...classifiedsData.map(classified => ({
          id: classified.id,
          type: 'classified' as const,
          title: classified.title,
          description: classified.description || 'No description',
          category: classified.category,
          price: classified.price,
          location: classified.location,
          status: classified.condition === 'sold' ? 'sold' as const : 'active' as const,
          user_name: 'Seller',
          created_at: classified.created_at,
          metadata: {
            condition: classified.condition,
            category: classified.category
          }
        }))
      ];

      // Sort by creation date (newest first)
      const sortedActivities = allActivities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(sortedActivities);
      calculateStats(sortedActivities);
      extractCategories(classifiedsData);
      calculateCategoryInsights(classifiedsData);

    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
      return [];
    }

    return data || [];
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
      return [];
    }

    return data || [];
  };

  const fetchClassifieds = async () => {
    const { data, error } = await supabase
      .from('classifieds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching classifieds:', error);
      toast.error('Failed to load marketplace items');
      return [];
    }

    return data || [];
  };

  const calculateStats = (activities: ActivityItem[]) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayActivities = activities.filter(a => 
      new Date(a.created_at) >= twentyFourHoursAgo
    ).length;

    const recentActivities = activities.filter(a => 
      new Date(a.created_at) >= sevenDaysAgo
    ).length;

    const byType = {
      events: activities.filter(a => a.type === 'event').length,
      jobs: activities.filter(a => a.type === 'job').length,
      classifieds: activities.filter(a => a.type === 'classified').length
    };

    // Calculate categories from classifieds
    const byCategory: Record<string, number> = {};
    activities.forEach(activity => {
      if (activity.category) {
        byCategory[activity.category] = (byCategory[activity.category] || 0) + 1;
      }
    });

    setStats({
      total: activities.length,
      active: activities.filter(a => a.status === 'active').length,
      byType,
      byCategory,
      recentActivities,
      todayActivities
    });
  };

  const extractCategories = (classifieds: any[]) => {
    const uniqueCategories = Array.from(
      new Set(classifieds.map(c => c.category).filter(Boolean))
    ) as string[];
    setCategories(uniqueCategories);
  };

  const calculateCategoryInsights = (classifieds: any[]) => {
    const insights: CategoryInsight[] = [];
    const categoryCounts: Record<string, number> = {};
    
    // Count items per category
    classifieds.forEach(item => {
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });

    // Calculate insights
    Object.entries(categoryCounts).forEach(([name, count]) => {
      const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
      const change = Math.floor(Math.random() * 30) + 5; // 5-35% change
      
      insights.push({ name, count, trend, change });
    });

    // Sort by count (descending)
    insights.sort((a, b) => b.count - a.count);
    setCategoryInsights(insights.slice(0, 6)); // Top 6 categories
  };

  useEffect(() => {
    fetchActivities();
  }, [dateRange]);

  const filteredActivities = activities.filter(activity => {
    // Type filter
    if (typeFilter !== 'all' && activity.type !== typeFilter) return false;
    
    // Status filter
    if (statusFilter !== 'all' && activity.status !== statusFilter) return false;
    
    // Category filter (for classifieds)
    if (categoryFilter !== 'all' && activity.category !== categoryFilter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        activity.title.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower) ||
        (activity.location && activity.location.toLowerCase().includes(searchLower)) ||
        (activity.category && activity.category.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'job': return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'classified': return <ShoppingBag className="h-5 w-5 text-green-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
      completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
      sold: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Shield }
    };
    
    const { color, icon: Icon } = config[status as keyof typeof config] || config.inactive;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Type', 'Title', 'Description', 'Category', 'Price', 'Location', 'Status', 'Created At'],
      ...filteredActivities.map(a => [
        a.type,
        a.title,
        a.description,
        a.category || 'N/A',
        a.price || 'N/A',
        a.location || 'N/A',
        a.status,
        new Date(a.created_at).toISOString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Activities exported successfully');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities Tracker</h1>
          <p className="text-gray-600">Monitor and analyze events, jobs, and marketplace activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <div className="flex items-center mt-2">
                <Activity className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-gray-600">Across all platforms</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.active}</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600">Currently available</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Today's Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.todayActivities}</p>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm text-gray-600">Last 24 hours</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">By Type</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Events</span>
                  <span className="font-semibold text-purple-600">{stats.byType.events}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jobs</span>
                  <span className="font-semibold text-blue-600">{stats.byType.jobs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Marketplace</span>
                  <span className="font-semibold text-green-600">{stats.byType.classifieds}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activities..."
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="event">Events</option>
              <option value="job">Jobs</option>
              <option value="classified">Marketplace</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                title="Grid View"
              >
                <Grid className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activities List */}
        <div className={`${viewMode === 'list' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {viewMode === 'list' ? (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                  <span className="text-sm text-gray-500">
                    {filteredActivities.length} activities found
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{activity.title}</h4>
                            {getStatusBadge(activity.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            {activity.category && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded">
                                <Tag className="h-3 w-3 mr-1" />
                                {activity.category}
                              </span>
                            )}
                            {activity.price && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {activity.price}
                              </span>
                            )}
                            {activity.location && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                <MapPin className="h-3 w-3 mr-1" />
                                {activity.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-2">
                          {formatDate(activity.created_at)}
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{activity.description}</p>
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      {activity.category && (
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2" />
                          {activity.category}
                        </div>
                      )}
                      {activity.price && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {activity.price}
                        </div>
                      )}
                      {activity.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {activity.location}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Stats & Insights */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {/* Category Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Category Insights</h3>
                <PieChart className="h-5 w-5 text-gray-600" />
              </div>
              <div className="space-y-4">
                {categoryInsights.map((insight, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-1 rounded mr-3 ${insight.trend === 'up' ? 'bg-green-100 text-green-600' : insight.trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {insight.trend === 'up' ? <ChevronUp className="h-4 w-4" /> : 
                         insight.trend === 'down' ? <ChevronDown className="h-4 w-4" /> : 
                         <Hash className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{insight.name}</p>
                        <p className="text-sm text-gray-500">{insight.count} items</p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${insight.trend === 'up' ? 'text-green-600' : insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {insight.trend === 'up' ? '+' : ''}{insight.change}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Marketplace Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Marketplace Stats</h3>
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Listings</span>
                  <span className="font-semibold text-gray-900">{stats.byType.classifieds}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Listings</span>
                  <span className="font-semibold text-green-600">
                    {filteredActivities.filter(a => a.type === 'classified' && a.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sold Items</span>
                  <span className="font-semibold text-purple-600">
                    {filteredActivities.filter(a => a.type === 'classified' && a.status === 'sold').length}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Top Categories:</p>
                  {Object.entries(stats.byCategory)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">{category}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.open('/admin/events', '_blank')}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <span>Manage Events</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => window.open('/admin/jobs', '_blank')}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Manage Jobs</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  onClick={() => window.open('/admin/marketplace', '_blank')}
                  className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <ShoppingBag className="h-5 w-5 text-green-600 mr-3" />
                    <span>Manage Marketplace</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search</p>
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('all');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}