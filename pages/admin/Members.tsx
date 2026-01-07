// pages/admin/Members.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, 
  CheckCircle, XCircle, Eye, Mail, 
  UserCheck, UserX, RefreshCw,
  ChevronLeft, ChevronRight, Phone, Calendar,
  CreditCard, MessageSquare,
  Link as LinkIcon, X, AlertCircle,
  Check, ExternalLink
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  payment_verified: boolean;
  payment_reference?: string;
  payment_amount?: number;
  payment_date?: string;
  bio?: string;
  approved_at?: string;
  rejection_reason?: string;
  connections_count?: number;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' }
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'member', label: 'Member' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, statusFilter, roleFilter]);

  // FIXED: Use direct Supabase query
  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // Build query
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Database error:', error);
        toast.error('Failed to load members');
        return;
      }

      // Get counts for connections and posts
      const membersWithCounts = await Promise.all(
        (data || []).map(async (member) => {
          // Get connections count
          const { count: connectionsCount } = await supabase
            .from('connections')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${member.id},friend_id.eq.${member.id}`);

          // Get posts count
          const { count: postsCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', member.id);

          return {
            ...member,
            connections_count: connectionsCount || 0,
            posts_count: postsCount || 0
          };
        })
      );

      setMembers(membersWithCounts);
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / prev.limit)
      }));
      
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Error loading members');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Use direct Supabase query
  const handleViewDetails = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        toast.error('Failed to load member details');
        return;
      }

      setViewMember(data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error loading member details:', error);
      toast.error('Error loading member details');
    }
  };

  // FIXED: Use direct Supabase update
  const handleApprove = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to approve this member?')) return;
    
    setProcessingAction(`approve-${memberId}`);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          payment_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        console.error('Approve error:', error);
        toast.error('Failed to approve member');
        return;
      }

      toast.success('Member approved successfully!');
      fetchMembers();
      
      // Update view modal if open
      if (viewMember?.id === memberId) {
        setViewMember(prev => prev ? {
          ...prev,
          approval_status: 'approved',
          payment_verified: true,
          approved_at: new Date().toISOString()
        } : null);
      }
    } catch (error) {
      console.error('Error approving member:', error);
      toast.error('Error approving member');
    } finally {
      setProcessingAction(null);
    }
  };

  // FIXED: Use direct Supabase update
  const handleReject = async (memberId: string) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (reason === null) return; // User cancelled
    
    if (reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    setProcessingAction(`reject-${memberId}`);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
          approved_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) {
        console.error('Reject error:', error);
        toast.error('Failed to reject member');
        return;
      }

      toast.success('Member rejected');
      fetchMembers();
      
      // Update view modal if open
      if (viewMember?.id === memberId) {
        setViewMember(prev => prev ? {
          ...prev,
          approval_status: 'rejected',
          rejection_reason: reason,
          approved_at: null
        } : null);
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast.error('Error rejecting member');
    } finally {
      setProcessingAction(null);
    }
  };

  // FIXED: Bulk actions without delete option
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedMembers.length === 0) {
      toast.error('Please select members first');
      return;
    }
    
    const confirmMessage = {
      approve: `Approve ${selectedMembers.length} member(s)?`,
      reject: `Reject ${selectedMembers.length} member(s)?`
    }[action];

    if (!window.confirm(confirmMessage)) return;

    if (action === 'reject') {
      const reason = prompt('Enter rejection reason for all selected members (optional):');
      if (reason === null) return; // User cancelled
    }

    setProcessingAction(`bulk-${action}`);
    try {
      const updateData: any = {};
      
      if (action === 'approve') {
        updateData.approval_status = 'approved';
        updateData.approved_at = new Date().toISOString();
        updateData.payment_verified = true;
      } else if (action === 'reject') {
        const reason = prompt('Enter rejection reason for all selected members (optional):') || 'Bulk rejection';
        updateData.approval_status = 'rejected';
        updateData.rejection_reason = reason;
        updateData.approved_at = null;
      }
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', selectedMembers);

      if (error) {
        console.error(`Bulk ${action} error:`, error);
        toast.error(`Failed to ${action} members`);
        return;
      }

      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} completed for ${selectedMembers.length} member(s)`);
      setSelectedMembers([]);
      fetchMembers();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Error performing bulk ${action}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status as keyof typeof colors] || 'bg-gray-100'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && members.length === 0) {
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
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50">
        {/* Toast messages will appear here */}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
          <p className="text-gray-600">Manage all member accounts and approvals</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMembers}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => toast.success('Export feature coming soon!')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                placeholder="Search by name, email, phone..."
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchMembers}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar - WITHOUT DELETE OPTION */}
      {selectedMembers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-700 font-medium">
                {selectedMembers.length} member(s) selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={processingAction?.startsWith('bulk-approve')}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center disabled:opacity-50"
              >
                {processingAction?.startsWith('bulk-approve') ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Approve Selected
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={processingAction?.startsWith('bulk-reject')}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center disabled:opacity-50"
              >
                {processingAction?.startsWith('bulk-reject') ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Reject Selected
              </button>
              <button
                onClick={() => setSelectedMembers([])}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === members.length && members.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers(members.map(m => m.id));
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, member.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.first_name}+${member.last_name}&background=random&color=fff`}
                          alt={member.first_name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${member.first_name}+${member.last_name}&background=random&color=fff`;
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {member.first_name} {member.last_name}
                          {member.role !== 'member' && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              {member.role}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">{member.email}</div>
                        {member.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      {getStatusBadge(member.approval_status)}
                      {member.payment_verified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200 flex items-center w-fit">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Payment Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {member.connections_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {member.posts_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {member.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(member.id)}
                            disabled={processingAction === `approve-${member.id}`}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve Member"
                          >
                            {processingAction === `approve-${member.id}` ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <CheckCircle className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(member.id)}
                            disabled={processingAction === `reject-${member.id}`}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Reject Member"
                          >
                            {processingAction === `reject-${member.id}` ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetails(member.id)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => window.location.href = `/messages/chat/${member.id}`}
                        className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Send Message"
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                      {/* REMOVED DELETE BUTTON */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {members.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No members found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> members
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || loading}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Details Modal - WITHOUT DELETE OPTION */}
      {showViewModal && viewMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Member Details</h2>
                <p className="text-gray-600 text-sm">Complete profile information</p>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewMember(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="h-20 w-20 flex-shrink-0">
                  <img
                    className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
                    src={viewMember.avatar_url || `https://ui-avatars.com/api/?name=${viewMember.first_name}+${viewMember.last_name}&background=random&color=fff&size=128`}
                    alt={viewMember.first_name}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {viewMember.first_name} {viewMember.last_name}
                  </h3>
                  <div className="flex items-center space-x-3 mt-2">
                    {getStatusBadge(viewMember.approval_status)}
                    {viewMember.role !== 'member' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200">
                        {viewMember.role}
                      </span>
                    )}
                    {viewMember.payment_verified && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Payment Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="text-gray-900 font-medium">{viewMember.email}</div>
                      </div>
                    </div>
                    {viewMember.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="text-gray-900 font-medium">{viewMember.phone}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">Joined</div>
                        <div className="text-gray-900 font-medium">
                          {new Date(viewMember.created_at).toLocaleDateString()} at{' '}
                          {new Date(viewMember.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {viewMember.approved_at && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm text-gray-500">
                            {viewMember.approval_status === 'approved' ? 'Approved' : 'Rejected'} Date
                          </div>
                          <div className="text-gray-900 font-medium">
                            {new Date(viewMember.approved_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">{viewMember.connections_count || 0}</div>
                      <div className="text-sm text-gray-500">Connections</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">{viewMember.posts_count || 0}</div>
                      <div className="text-sm text-gray-500">Posts</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">
                        {viewMember.payment_verified ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-500">Payment</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">
                        {viewMember.role === 'admin' ? 'Admin' : 'Member'}
                      </div>
                      <div className="text-sm text-gray-500">Access Level</div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {viewMember.bio && (
                  <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Bio</h4>
                    <p className="text-gray-700 whitespace-pre-line">{viewMember.bio}</p>
                  </div>
                )}

                {/* Payment Info */}
                {viewMember.payment_reference && (
                  <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Reference</div>
                        <div className="text-gray-900 font-mono">{viewMember.payment_reference}</div>
                      </div>
                      {viewMember.payment_amount && (
                        <div>
                          <div className="text-sm text-gray-500">Amount</div>
                          <div className="text-gray-900 font-bold">₦{viewMember.payment_amount.toLocaleString()}</div>
                        </div>
                      )}
                      {viewMember.payment_date && (
                        <div>
                          <div className="text-sm text-gray-500">Date</div>
                          <div className="text-gray-900">{new Date(viewMember.payment_date).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {viewMember.approval_status === 'rejected' && viewMember.rejection_reason && (
                  <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 uppercase tracking-wider mb-2">Rejection Reason</h4>
                        <p className="text-red-700">{viewMember.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - WITHOUT DELETE OPTION */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                {viewMember.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleApprove(viewMember.id);
                      }}
                      disabled={processingAction === `approve-${viewMember.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                    >
                      {processingAction === `approve-${viewMember.id}` ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Member
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleReject(viewMember.id);
                      }}
                      disabled={processingAction === `reject-${viewMember.id}`}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:opacity-50"
                    >
                      {processingAction === `reject-${viewMember.id}` ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject Member
                    </button>
                  </>
                )}
                <button
                  onClick={() => window.location.href = `/messages/chat/${viewMember.id}`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </button>
                <button
                  onClick={() => window.location.href = `/profile/${viewMember.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Profile
                </button>
                {/* REMOVED DELETE BUTTON */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}