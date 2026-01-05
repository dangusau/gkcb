// ============================================
// COMPLETE DASHBOARD.TSX WITH FIXED LOGOUT
// File: /workspaces/master-gbc-/pages/admin/Dashboard.tsx
// ============================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../../services/adminAuth';
import { supabase } from '../../services/supabase';
import {
  // Icons
  LayoutDashboard,
  Users,
  UserCheck,
  UserX,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Plus,
  Mail,
  Phone,
  Calendar,
  Shield,
  Database,
  Bug,
  AlertTriangle,
  ExternalLink,
  User,
  Clock,
  Building,
  Archive,
  Send,
  Lock,
  Trash2,
  Edit,
  Copy,
  AlertOctagon
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // State for authentication and loading
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState<string>('');
  
  // State for user data
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  // State for UI
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDebug, setShowDebug] = useState(false);
  const [dbStats, setDbStats] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    
    // Set up auth listener for session changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          console.log('Supabase auth signed out event detected');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Filter users when search query or status filter changes
  useEffect(() => {
    filterUsers();
  }, [searchQuery, statusFilter, allUsers]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Check admin authentication
      const admin = await adminAuth.getCurrentAdmin();
      if (!admin) {
        console.log('No admin found, redirecting to login');
        navigate('/admin/login');
        return;
      }
      
      setAdminInfo(admin);
      
      // 2. Test database connection
      await testDatabaseConnection();
      
      // 3. Load users
      await loadUsers();
      
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(`Failed to load dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      setDbConnected(!testError);
      
      if (testError) {
        console.error('Database connection error:', testError);
        setError(`Database error: ${testError.message}`);
      }
      
    } catch (err: any) {
      console.error('Database test failed:', err);
      setDbConnected(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database query error:', error);
        setError(`Query error: ${error.message}`);
        return;
      }
      
      console.log('Loaded users from database:', data?.length || 0);
      setAllUsers(data || []);
      setFilteredUsers(data || []);
      
      // Clear selection when data reloads
      setSelectedUserIds(new Set());
      
      // Calculate statistics
      if (data && data.length > 0) {
        const stats = {
          total: data.length,
          pending: data.filter(u => u.approval_status === 'pending').length,
          approved: data.filter(u => u.approval_status === 'approved').length,
          rejected: data.filter(u => u.approval_status === 'rejected').length,
          businessOwners: data.filter(u => u.role === 'business_owner').length,
          verifiedPayments: data.filter(u => u.payment_verified === true).length,
          today: data.filter(u => {
            const created = new Date(u.created_at);
            const today = new Date();
            return created.toDateString() === today.toDateString();
          }).length,
          thisWeek: data.filter(u => {
            const created = new Date(u.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created >= weekAgo;
          }).length
        };
        setDbStats(stats);
      }
      
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(`Load error: ${err.message}`);
    }
  };

  const filterUsers = () => {
    let filtered = [...allUsers];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.first_name && user.first_name.toLowerCase().includes(query)) ||
        (user.last_name && user.last_name.toLowerCase().includes(query)) ||
        (user.phone && user.phone.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.approval_status === statusFilter);
    }
    
    setFilteredUsers(filtered);
  };

  const handleCreateTestUsers = async () => {
    if (!confirm('Create 3 test users in the database?')) return;
    
    try {
      setActionInProgress('Creating test users...');
      
      const testUsers = [
        {
          email: `test.user.${Date.now()}.1@example.com`,
          first_name: 'Test',
          last_name: 'User 1',
          approval_status: 'pending',
          role: 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          email: `test.user.${Date.now()}.2@example.com`,
          first_name: 'Test',
          last_name: 'User 2',
          approval_status: 'approved',
          role: 'business_owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          email: `test.user.${Date.now()}.3@example.com`,
          first_name: 'Test',
          last_name: 'User 3',
          approval_status: 'pending',
          role: 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // Insert test users
      const { error } = await supabase
        .from('profiles')
        .insert(testUsers);
      
      if (error) throw error;
      
      alert('✅ Test users created! Refreshing...');
      await loadUsers();
      
    } catch (err: any) {
      alert(`❌ Failed to create test users: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleFixApprovalStatus = async () => {
    if (!confirm('Set NULL approval_status to "pending" for all users?')) return;
    
    try {
      setActionInProgress('Fixing approval status...');
      
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'pending' })
        .is('approval_status', null);
      
      if (error) throw error;
      
      alert('✅ Approval status fixed! Refreshing...');
      await loadUsers();
      
    } catch (err: any) {
      alert(`❌ Failed to fix approval status: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveUser = async (userId: string, userEmail?: string) => {
    if (!confirm('Approve this user?')) return;
    
    try {
      setActionInProgress(`Approving user ${userId.substring(0, 8)}...`);
      
      // Check if the user is already approved (to avoid unnecessary updates)
      const userToApprove = allUsers.find(u => u.id === userId);
      if (userToApprove?.approval_status === 'approved') {
        alert('User is already approved!');
        return;
      }
      
      // Update the user with approval
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      await loadUsers();
      
      // Show success message
      alert(`✅ User ${userEmail || ''} approved successfully!`);
      
      // Close details modal if open
      if (showUserDetails && selectedUser?.id === userId) {
        setShowUserDetails(false);
      }
      
    } catch (err: any) {
      console.error('Approve error details:', err);
      alert(`❌ Failed to approve user: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectUser = async (userId: string, userEmail?: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      setActionInProgress(`Rejecting user ${userId.substring(0, 8)}...`);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason || null,
          approved_at: null
        })
        .eq('id', userId);

      if (error) throw error;
      
      await loadUsers();
      
      alert(`✅ User ${userEmail || ''} rejected successfully!`);
      
      // Close details modal if open
      if (showUserDetails && selectedUser?.id === userId) {
        setShowUserDetails(false);
      }
      
    } catch (err: any) {
      alert(`❌ Failed to reject user: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUserIds.size === 0) {
      alert('Please select users to approve.');
      return;
    }
    
    if (!confirm(`Approve ${selectedUserIds.size} selected user(s)?`)) return;
    
    try {
      setActionInProgress(`Approving ${selectedUserIds.size} users...`);
      
      const userIds = Array.from(selectedUserIds);
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .in('id', userIds);

      if (error) throw error;
      
      alert(`✅ ${userIds.length} user(s) approved successfully!`);
      await loadUsers();
      setBulkAction(null);
      
    } catch (err: any) {
      alert(`❌ Failed to approve users: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUserIds.size === 0) {
      alert('Please select users to reject.');
      return;
    }
    
    const reason = prompt('Enter rejection reason for all selected users (optional):');
    if (reason === null) return;
    
    if (!confirm(`Reject ${selectedUserIds.size} selected user(s)?`)) return;
    
    try {
      setActionInProgress(`Rejecting ${selectedUserIds.size} users...`);
      
      const userIds = Array.from(selectedUserIds);
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason || null,
          approved_at: null
        })
        .in('id', userIds);

      if (error) throw error;
      
      alert(`✅ ${userIds.length} user(s) rejected successfully!`);
      await loadUsers();
      setBulkAction(null);
      
    } catch (err: any) {
      alert(`❌ Failed to reject users: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      const allIds = new Set(filteredUsers.map(user => user.id));
      setSelectedUserIds(allIds);
    }
  };

  const handleViewUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleSendWelcomeEmail = async (userEmail: string) => {
    if (!confirm(`Send welcome email to ${userEmail}?`)) return;
    
    try {
      // In a real app, you would call your email service here
      alert(`📧 Welcome email would be sent to ${userEmail} in production.`);
      
    } catch (err: any) {
      alert(`❌ Failed to send email: ${err.message}`);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
      setLogoutLoading(true);
      console.log('Starting admin logout process...');
      
      // 1. Clear admin-specific storage first
      localStorage.removeItem('gkbc_admin_token');
      localStorage.removeItem('gkbc_admin_user');
      localStorage.removeItem('gkbc_admin_session');
      localStorage.removeItem('sb-connect-token');
      
      // 2. Clear ALL Supabase auth sessions
      console.log('Signing out from Supabase auth...');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('Supabase sign out error:', signOutError);
      }
      
      // 3. Clear session storage
      sessionStorage.clear();
      
      // 4. Clear cookies (if any)
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      console.log('✅ Admin logout - all sessions cleared');
      
      // 5. Force hard navigation to prevent any React Router state issues
      // Wait a moment to ensure all cleanup is done
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 100);
      
    } catch (err: any) {
      console.error('❌ Logout error:', err);
      // Still force navigation even if there's an error
      window.location.href = '/admin/login';
    } finally {
      setLogoutLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
      }
    } catch {
      return 'Unknown time';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: <AlertCircle size={14} /> },
      'approved': { color: 'bg-green-100 text-green-800 border border-green-200', icon: <CheckCircle size={14} /> },
      'rejected': { color: 'bg-red-100 text-red-800 border border-red-200', icon: <XCircle size={14} /> }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: null };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: any = {
      'member': { color: 'bg-blue-100 text-blue-800 border border-blue-200', icon: <User size={14} /> },
      'business_owner': { color: 'bg-purple-100 text-purple-800 border border-purple-200', icon: <Building size={14} /> },
      'admin': { color: 'bg-red-100 text-red-800 border border-red-200', icon: <Shield size={14} /> }
    };
    
    const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: null };
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {role?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown'}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
          <p className="text-sm text-gray-400 mt-2">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GKBC Admin</h1>
                <p className="text-sm text-gray-500">User Management Dashboard</p>
              </div>
              
              {/* Database Status Badge */}
              <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                dbConnected ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {dbConnected ? '✅ Database Connected' : '❌ Database Disconnected'}
              </div>
            </div>
            
            {/* Center: Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
            
            {/* Right: Admin Actions */}
            <div className="flex items-center gap-4">
              {actionInProgress && (
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  {actionInProgress}
                </div>
              )}
              
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh Data"
                disabled={logoutLoading}
              >
                <RefreshCw size={22} />
              </button>
              
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`p-2 rounded-lg transition-colors ${
                  showDebug 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
                title="Debug Mode"
                disabled={logoutLoading}
              >
                <Bug size={22} />
              </button>
              
              <div className="h-8 w-px bg-gray-200"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{adminInfo?.full_name || 'Administrator'}</p>
                  <p className="text-xs text-gray-500">{adminInfo?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                  disabled={logoutLoading}
                >
                  {logoutLoading ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <LogOut size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug size={20} className="text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Debug Mode</h3>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={testDatabaseConnection}
                  className="px-4 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Database size={16} />
                  Test Connection
                </button>
                
                <button
                  onClick={handleCreateTestUsers}
                  className="px-4 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Create Test Users
                </button>
                
                <button
                  onClick={handleFixApprovalStatus}
                  className="px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <AlertTriangle size={16} />
                  Fix NULL Status
                </button>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Database Connection</p>
                <p className={`font-medium ${dbConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {dbConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Total Users in DB</p>
                <p className="font-medium">{allUsers.length}</p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Filtered Users</p>
                <p className="font-medium">{filteredUsers.length}</p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Last Refresh</p>
                <p className="font-medium">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">Error:</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Session Info:</p>
              <div className="text-xs text-blue-600 space-y-1 mt-2">
                <p>Admin Email: {adminInfo?.email}</p>
                <p>Total Users: {allUsers.length}</p>
                <p>LocalStorage Keys: {Object.keys(localStorage).join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] sticky top-0">
          <nav className="p-6">
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">MAIN</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'dashboard' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={logoutLoading}
                  >
                    <LayoutDashboard size={20} />
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'all' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={logoutLoading}
                  >
                    <Users size={20} />
                    All Users
                    <span className="ml-auto bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full min-w-8 text-center">
                      {allUsers.length}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setActiveTab('pending'); setStatusFilter('pending'); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'pending' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={logoutLoading}
                  >
                    <UserCheck size={20} />
                    Pending Approval
                    {dbStats.pending > 0 && (
                      <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full min-w-8 text-center">
                        {dbStats.pending}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setActiveTab('approved'); setStatusFilter('approved'); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'approved' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={logoutLoading}
                  >
                    <CheckCircle size={20} />
                    Approved Users
                    {dbStats.approved > 0 && (
                      <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full min-w-8 text-center">
                        {dbStats.approved}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setActiveTab('rejected'); setStatusFilter('rejected'); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'rejected' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={logoutLoading}
                  >
                    <UserX size={20} />
                    Rejected Users
                    {dbStats.rejected > 0 && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full min-w-8 text-center">
                        {dbStats.rejected}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">BULK ACTIONS</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setBulkAction('approve')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-green-700 bg-green-50 border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50"
                    disabled={logoutLoading || selectedUserIds.size === 0}
                  >
                    <CheckCircle size={20} />
                    Bulk Approve
                    {selectedUserIds.size > 0 && (
                      <span className="ml-auto bg-green-600 text-white text-xs px-2 py-1 rounded-full min-w-8 text-center">
                        {selectedUserIds.size}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setBulkAction('reject')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                    disabled={logoutLoading}
                  >
                    <XCircle size={20} />
                    Bulk Reject
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-1">Security Notice</p>
              <p className="text-xs text-blue-600 mb-3">Always logout when done to prevent unauthorized access</p>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging Out...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Secure Logout
                  </>
                )}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          
          {/* Header with Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600">
                  {allUsers.length === 0 
                    ? 'No users found in database' 
                    : `Managing ${allUsers.length} registered users`}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors disabled:opacity-50"
                  disabled={logoutLoading}
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
                <button
                  onClick={handleCreateTestUsers}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                  disabled={logoutLoading}
                >
                  <Plus size={18} />
                  Add Test Users
                </button>
              </div>
            </div>
            
            {/* Statistics Cards */}
            {allUsers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Users</p>
                      <p className="text-3xl font-bold mt-2">{dbStats.total || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">{dbStats.today || 0} new today</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pending Approval</p>
                      <p className="text-3xl font-bold mt-2">{dbStats.pending || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Approved Users</p>
                      <p className="text-3xl font-bold mt-2">{dbStats.approved || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Active in system</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Business Owners</p>
                      <p className="text-3xl font-bold mt-2">{dbStats.businessOwners || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Registered businesses</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bulk Action Bar */}
            {bulkAction && selectedUserIds.size > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl border border-blue-200 flex items-center justify-center">
                      {bulkAction === 'approve' ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {bulkAction === 'approve' ? 'Bulk Approve Users' : 'Bulk Reject Users'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedUserIds.size} user{selectedUserIds.size === 1 ? '' : 's'} selected
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (bulkAction === 'approve') {
                          handleBulkApprove();
                        } else {
                          handleBulkReject();
                        }
                      }}
                      className={`px-5 py-2 rounded-xl text-white font-medium ${
                        bulkAction === 'approve' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      } transition-colors disabled:opacity-50`}
                      disabled={logoutLoading}
                    >
                      {bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
                    </button>
                    <button
                      onClick={() => setBulkAction(null)}
                      className="px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={logoutLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Filter Bar */}
            {allUsers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-600">Filter by status:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {['all', 'pending', 'approved', 'rejected'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            statusFilter === status
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={logoutLoading}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{allUsers.length}</span> users
                    {selectedUserIds.size > 0 && (
                      <span className="ml-3 text-blue-600 font-medium">
                        • {selectedUserIds.size} selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Users Table or Empty State */}
          {allUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">No Users Found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Your database doesn't have any users yet. You can add test users or wait for real users to sign up.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleCreateTestUsers}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  disabled={logoutLoading}
                >
                  <Plus size={20} />
                  Create Test Users
                </button>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  disabled={logoutLoading}
                >
                  <RefreshCw size={20} />
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                          disabled={logoutLoading}
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status & Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => handleToggleUserSelection(user.id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                            disabled={logoutLoading}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {user.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">
                                {user.first_name || 'No'} {user.last_name || 'Name'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Mail size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div>{getStatusBadge(user.approval_status)}</div>
                            <div>{getRoleBadge(user.role)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">
                              {formatDate(user.created_at)}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              {formatRelativeTime(user.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="View Details"
                              disabled={logoutLoading}
                            >
                              <Eye size={18} />
                            </button>
                            
                            {user.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user.id, user.email)}
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Approve User"
                                  disabled={logoutLoading}
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id, user.email)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject User"
                                  disabled={logoutLoading}
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            
                            {user.approval_status === 'approved' && (
                              <>
                                <button
                                  onClick={() => handleSendWelcomeEmail(user.email)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Send Welcome Email"
                                  disabled={logoutLoading}
                                >
                                  <Send size={18} />
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user.id, user.email)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Revoke Approval"
                                  disabled={logoutLoading}
                                >
                                  <Archive size={18} />
                                </button>
                              </>
                            )}
                            
                            {user.approval_status === 'rejected' && (
                              <button
                                onClick={() => handleApproveUser(user.id, user.email)}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve User"
                                disabled={logoutLoading}
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                    Showing <span className="font-medium">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''}
                    {selectedUserIds.size > 0 && (
                      <span className="ml-3 font-medium text-blue-600">
                        • {selectedUserIds.size} selected
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {selectedUserIds.size > 0 && (
                      <>
                        <button
                          onClick={handleBulkApprove}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                          disabled={logoutLoading}
                        >
                          <CheckCircle size={16} />
                          Approve Selected
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Clear all selections?')) {
                              setSelectedUserIds(new Set());
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          disabled={logoutLoading}
                        >
                          Clear Selection
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleRefresh}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={logoutLoading}
                    >
                      <RefreshCw size={16} />
                      Refresh List
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  disabled={logoutLoading}
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.first_name?.charAt(0) || selectedUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedUser.first_name || 'No'} {selectedUser.last_name || 'Name'}
                    </h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-3">
                      {getStatusBadge(selectedUser.approval_status)}
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                </div>
                
                {/* User Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Contact Information</p>
                    <div className="space-y-2">
                      {selectedUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-gray-900">{selectedUser.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-900">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Account Information</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-900 font-medium">User ID: </span>
                        <span className="text-gray-600 text-sm">{selectedUser.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-medium">Created: </span>
                        <span className="text-gray-600">{formatDate(selectedUser.created_at)}</span>
                      </div>
                      {selectedUser.approved_at && (
                        <div>
                          <span className="text-gray-900 font-medium">Approved: </span>
                          <span className="text-gray-600">{formatDate(selectedUser.approved_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedUser.bio && (
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Bio</p>
                      <p className="text-gray-900">{selectedUser.bio}</p>
                    </div>
                  )}
                  
                  {selectedUser.rejection_reason && (
                    <div className="md:col-span-2 bg-red-50 p-4 rounded-xl border border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-2">Rejection Reason</p>
                      <p className="text-red-700">{selectedUser.rejection_reason}</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  {selectedUser.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApproveUser(selectedUser.id, selectedUser.email);
                          setShowUserDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        disabled={logoutLoading}
                      >
                        <CheckCircle size={20} />
                        Approve User
                      </button>
                      <button
                        onClick={() => {
                          handleRejectUser(selectedUser.id, selectedUser.email);
                          setShowUserDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        disabled={logoutLoading}
                      >
                        <XCircle size={20} />
                        Reject User
                      </button>
                    </>
                  )}
                  
                  {selectedUser.approval_status === 'approved' && (
                    <>
                      <button
                        onClick={() => handleSendWelcomeEmail(selectedUser.email)}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        disabled={logoutLoading}
                      >
                        <Send size={20} />
                        Send Welcome Email
                      </button>
                      <button
                        onClick={() => {
                          handleRejectUser(selectedUser.id, selectedUser.email);
                          setShowUserDetails(false);
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        disabled={logoutLoading}
                      >
                        <Archive size={20} />
                        Revoke Approval
                      </button>
                    </>
                  )}
                  
                  {selectedUser.approval_status === 'rejected' && (
                    <button
                      onClick={() => {
                        handleApproveUser(selectedUser.id, selectedUser.email);
                        setShowUserDetails(false);
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      disabled={logoutLoading}
                    >
                      <CheckCircle size={20} />
                      Approve User
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={logoutLoading}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Overlay */}
      {logoutLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Logging Out</h3>
              <p className="text-gray-600">Clearing all sessions and securing your account...</p>
              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <p>• Clearing admin session</p>
                <p>• Signing out from Supabase</p>
                <p>• Removing local storage</p>
                <p>• Redirecting to login</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;