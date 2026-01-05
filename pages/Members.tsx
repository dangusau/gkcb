import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { 
  Search, 
  Users, 
  UserCheck, 
  Building, 
  MapPin, 
  ChevronRight,
  UserPlus,
  Shield,
  X,
  Loader2,
  Briefcase,
  Calendar,
  User,
  Bell,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Mail
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Member = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  business_name?: string;
  position?: string;
  category?: string;
  location?: string;
  bio?: string;
  role: string;
  approval_status: string;
  payment_verified?: boolean;
  created_at: string;
  is_friend?: boolean;
  connection_status?: 'pending' | 'accepted' | 'rejected';
  connection_id?: string;
  is_incoming_request?: boolean;
  is_outgoing_request?: boolean;
};

type ConnectionStats = {
  total_members: number;
  connections: number;
  pending_received: number;
  pending_sent: number;
};

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'myNetwork' | 'requests'>('all');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    total_members: 0,
    connections: 0,
    pending_received: 0,
    pending_sent: 0
  });
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          navigate('/login');
          return;
        }

        setUserProfile(profile);

        // Fetch members and connection stats
        await Promise.all([
          fetchMembers(profile.id),
          fetchConnectionStats(profile.id)
        ]);
        
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchMembers = async (currentUserId: string) => {
    try {
      // Fetch all approved profiles except current user
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .neq('id', currentUserId)
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching members:', profilesError);
        return;
      }

      // Fetch connections to determine friend status
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
      }

      // Enrich profiles with connection status
      const enrichedMembers = (profiles || []).map(profile => {
        const connection = connections?.find(conn => 
          (conn.user_id === currentUserId && conn.friend_id === profile.id) ||
          (conn.friend_id === currentUserId && conn.user_id === profile.id)
        );

        const isIncomingRequest = connection?.status === 'pending' && 
          connection.friend_id === currentUserId;

        const isOutgoingRequest = connection?.status === 'pending' && 
          connection.user_id === currentUserId;

        return {
          ...profile,
          is_friend: connection?.status === 'accepted',
          connection_status: connection?.status,
          connection_id: connection?.id,
          is_incoming_request: isIncomingRequest,
          is_outgoing_request: isOutgoingRequest
        };
      });

      setMembers(enrichedMembers);
      updateFilteredMembers(enrichedMembers);

    } catch (error) {
      console.error('Error in fetchMembers:', error);
    }
  };

  const fetchConnectionStats = async (currentUserId: string) => {
    try {
      // Get total members count
      const { count: totalMembers, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved')
        .neq('id', currentUserId);

      if (countError) throw countError;

      // Get all connections
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (connectionsError) throw connectionsError;

      // Calculate stats
      const connectionsCount = connections?.filter(c => c.status === 'accepted').length || 0;
      const pendingReceived = connections?.filter(c => 
        c.status === 'pending' && c.friend_id === currentUserId
      ).length || 0;
      const pendingSent = connections?.filter(c => 
        c.status === 'pending' && c.user_id === currentUserId
      ).length || 0;

      setConnectionStats({
        total_members: totalMembers || 0,
        connections: connectionsCount,
        pending_received: pendingReceived,
        pending_sent: pendingSent
      });

    } catch (error) {
      console.error('Error fetching connection stats:', error);
    }
  };

  const updateFilteredMembers = (membersList: Member[]) => {
    let result = membersList;

    // Filter by active tab
    if (activeTab === 'myNetwork') {
      result = result.filter(member => member.is_friend);
    } else if (activeTab === 'requests') {
      result = result.filter(member => member.is_incoming_request);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(member => 
        member.first_name?.toLowerCase().includes(term) ||
        member.last_name?.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term) ||
        member.business_name?.toLowerCase().includes(term) ||
        member.position?.toLowerCase().includes(term) ||
        member.location?.toLowerCase().includes(term)
      );
    }

    setFilteredMembers(result);
  };

  useEffect(() => {
    updateFilteredMembers(members);
  }, [searchTerm, activeTab, members]);

  const handleConnect = async (memberId: string) => {
    if (!userProfile) return;

    try {
      // Check if connection already exists
      const { data: existingConnections, error: checkError } = await supabase
        .from('connections')
        .select('*')
        .or(`and(user_id.eq.${userProfile.id},friend_id.eq.${memberId}),and(user_id.eq.${memberId},friend_id.eq.${userProfile.id})`);

      if (checkError) throw checkError;

      if (existingConnections && existingConnections.length > 0) {
        const existing = existingConnections[0];
        if (existing.status === 'pending') {
          showFeedback('info', 'Connection request already pending');
          return;
        } else if (existing.status === 'accepted') {
          showFeedback('info', 'Already connected with this member');
          return;
        }
      }

      // Create new connection request
      const { data: newConnection, error } = await supabase
        .from('connections')
        .insert({
          user_id: userProfile.id,
          friend_id: memberId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          showFeedback('error', 'Connection request already exists');
          return;
        }
        throw error;
      }

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: memberId,
          type: 'connection',
          actor_id: userProfile.id,
          content: `${userProfile.first_name} ${userProfile.last_name} sent you a connection request`,
          reference_id: newConnection.id,
          is_read: false
        });

      // Update local state
      const updatedMembers = members.map(member => 
        member.id === memberId 
          ? { 
              ...member, 
              connection_status: 'pending', 
              connection_id: newConnection.id,
              is_incoming_request: false,
              is_outgoing_request: true 
            }
          : member
      );
      
      setMembers(updatedMembers);
      
      // Update stats
      setConnectionStats(prev => ({
        ...prev,
        pending_sent: prev.pending_sent + 1
      }));

      const member = members.find(m => m.id === memberId);
      showFeedback('success', `Connection request sent to ${member?.first_name} ${member?.last_name}`);

    } catch (error: any) {
      console.error('Error sending connection request:', error);
      showFeedback('error', 'Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (connectionId: string, userId: string) => {
    if (!userProfile) return;

    try {
      console.log('Accepting request:', { connectionId, userId, userProfile });

      // First, get the connection to verify
      const { data: connection, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (fetchError) {
        console.error('Error fetching connection:', fetchError);
        throw fetchError;
      }

      if (!connection) {
        showFeedback('error', 'Connection not found');
        return;
      }

      console.log('Found connection:', connection);

      // Update connection status to accepted
      const { data: updatedConnection, error: updateError } = await supabase
        .from('connections')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating connection:', updateError);
        throw updateError;
      }

      console.log('Updated connection:', updatedConnection);

      // Send notification to the requester
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'connection',
          actor_id: userProfile.id,
          content: `${userProfile.first_name} ${userProfile.last_name} accepted your connection request`,
          reference_id: connectionId,
          is_read: false
        });

      // Update local state immediately
      const updatedMembers = members.map(member => {
        if (member.id === userId) {
          console.log('Updating member:', member.id);
          return {
            ...member,
            is_friend: true,
            connection_status: 'accepted',
            is_incoming_request: false,
            is_outgoing_request: false
          };
        }
        return member;
      });

      console.log('Updated members list:', updatedMembers);
      setMembers(updatedMembers);
      
      // Update stats
      setConnectionStats(prev => ({
        ...prev,
        connections: prev.connections + 1,
        pending_received: Math.max(0, prev.pending_received - 1)
      }));

      showFeedback('success', 'Connection accepted! You are now connected.');

      // Switch to myNetwork tab after a short delay
      setTimeout(() => {
        setActiveTab('myNetwork');
      }, 1000);

    } catch (error) {
      console.error('Error accepting connection request:', error);
      showFeedback('error', 'Failed to accept connection request');
    }
  };

  const handleRejectRequest = async (connectionId: string, userId: string) => {
    if (!userProfile) return;

    try {
      console.log('Rejecting request:', { connectionId, userId });

      // Delete the connection request from database
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        console.error('Error deleting connection:', error);
        throw error;
      }

      console.log('Deleted connection from database');

      // Update local state
      const updatedMembers = members.map(member => {
        if (member.id === userId) {
          console.log('Updating rejected member:', member.id);
          return {
            ...member,
            is_friend: false,
            connection_status: undefined,
            connection_id: undefined,
            is_incoming_request: false,
            is_outgoing_request: false
          };
        }
        return member;
      });

      console.log('Updated members after rejection:', updatedMembers);
      setMembers(updatedMembers);
      
      // Update stats
      setConnectionStats(prev => ({
        ...prev,
        pending_received: Math.max(0, prev.pending_received - 1)
      }));

      showFeedback('success', 'Connection request rejected');
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      showFeedback('error', 'Failed to reject connection request');
    }
  };

  const handleCancelRequest = async (connectionId: string, userId: string) => {
    if (!userProfile) return;

    try {
      // Delete the connection request from database
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      // Update local state
      const updatedMembers = members.map(member => {
        if (member.id === userId) {
          return {
            ...member,
            connection_status: undefined,
            connection_id: undefined,
            is_incoming_request: false,
            is_outgoing_request: false
          };
        }
        return member;
      });

      setMembers(updatedMembers);
      
      // Update stats
      setConnectionStats(prev => ({
        ...prev,
        pending_sent: Math.max(0, prev.pending_sent - 1)
      }));

      showFeedback('success', 'Connection request cancelled');
    } catch (error) {
      console.error('Error cancelling connection request:', error);
      showFeedback('error', 'Failed to cancel connection request');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Members...</p>
          <p className="text-gray-400 text-sm mt-2">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 safe-area pb-20">
      {/* FEEDBACK MESSAGE */}
      {feedback && (
        <div 
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 ${
            feedback.type === 'success' 
              ? 'animate-[slideInTop_0.3s_ease-out]' 
              : feedback.type === 'error'
              ? 'animate-[shake_0.5s_ease-in-out]'
              : 'animate-[slideInTop_0.3s_ease-out]'
          }`}
        >
          <div className={`rounded-2xl shadow-xl p-4 flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
              : feedback.type === 'error'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle size={24} className="flex-shrink-0" />
            ) : feedback.type === 'error' ? (
              <XCircle size={24} className="flex-shrink-0" />
            ) : (
              <CheckCircle size={24} className="flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
            <button 
              onClick={() => setFeedback(null)}
              className="ml-auto text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <Header title="Members Directory" showBack={false} />

      {/* Connection Requests Notification */}
      {connectionStats.pending_received > 0 && (
        <div className="px-4 pt-2">
          <button
            onClick={() => setShowRequestsModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-4 shadow-lg shadow-blue-200/50 mb-4 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Bell size={24} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold shadow-md">
                  {connectionStats.pending_received}
                </div>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Connection Requests</h3>
                <p className="text-sm opacity-90">
                  {connectionStats.pending_received} pending request{connectionStats.pending_received > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronRight size={24} className="text-white/80" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="px-4 pt-2 pb-24 max-w-screen-sm mx-auto">
        {/* SEARCH */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Search members, companies, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Users size={16} />
                All
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {members.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('myNetwork')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'myNetwork'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-200/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <UserCheck size={16} />
                Network
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {connectionStats.connections}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`relative flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'requests'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-200/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Bell size={16} />
                Requests
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {connectionStats.pending_received + connectionStats.pending_sent}
                </span>
                {(connectionStats.pending_received > 0 || connectionStats.pending_sent > 0) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTION STATS */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/80 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{connectionStats.total_members}</div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <Users size={12} />
                  Total Members
                </div>
              </div>
              <div className="bg-white/80 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{connectionStats.connections}</div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <UserCheck size={12} />
                  Connections
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{connectionStats.pending_received}</div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <Bell size={12} />
                  Requests Received
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{connectionStats.pending_sent}</div>
                <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                  <Send size={12} />
                  Requests Sent
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MEMBERS LIST */}
        <div>
          {filteredMembers.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {activeTab === 'all' ? (
                  <Users className="w-10 h-10 text-blue-600" />
                ) : activeTab === 'myNetwork' ? (
                  <UserCheck className="w-10 h-10 text-blue-600" />
                ) : (
                  <Bell className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {activeTab === 'all' ? 'No Members Found' : 
                 activeTab === 'myNetwork' ? 'No Connections Yet' : 
                 'No Pending Requests'}
              </h4>
              <p className="text-gray-600 text-sm mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : activeTab === 'all'
                  ? 'No members available in the directory'
                  : activeTab === 'myNetwork'
                  ? 'Connect with members to build your professional network'
                  : 'You have no pending connection requests'}
              </p>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md"
                >
                  Clear Search
                </button>
              )}
              {activeTab === 'requests' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md mt-2"
                >
                  Browse All Members
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map(member => (
                <div 
                  key={member.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Member Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url} 
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                            )}
                          </div>
                          {member.payment_verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                              <Shield size={12} className="text-white" />
                            </div>
                          )}
                          {member.is_incoming_request && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                              <Bell size={12} className="text-white" />
                            </div>
                          )}
                          {member.is_outgoing_request && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                              <Send size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </h3>
                            {member.role === 'admin' && (
                              <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-lg">
                                Admin
                              </span>
                            )}
                          </div>
                          {member.position && (
                            <p className="text-xs text-gray-600 truncate mt-1">
                              {member.position}
                            </p>
                          )}
                          {member.business_name && (
                            <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                              <Building size={10} />
                              {member.business_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Connection Status / Actions */}
                      <div className="flex-shrink-0 ml-2">
                        {member.connection_status === 'accepted' ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-xl">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">Connected</span>
                          </div>
                        ) : member.is_incoming_request ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(member.connection_id!, member.id)}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2"
                                title="Accept Connection"
                              >
                                <Check size={14} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(member.connection_id!, member.id)}
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2"
                                title="Reject Connection"
                              >
                                <X size={14} />
                                Decline
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 text-right">Awaiting your response</p>
                          </div>
                        ) : member.is_outgoing_request ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200 rounded-xl">
                              <Send size={14} className="text-yellow-600" />
                              <span className="text-xs font-bold text-yellow-700">Sent</span>
                            </div>
                            <button
                              onClick={() => handleCancelRequest(member.connection_id!, member.id)}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(member.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2"
                          >
                            <UserPlus size={14} />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="space-y-2">
                      {member.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin size={12} />
                          <span>{member.location}</span>
                        </div>
                      )}
                      
                      {member.category && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Briefcase size={12} />
                          <span>{member.category}</span>
                        </div>
                      )}
                      
                      {member.bio && (
                        <div className="flex items-start gap-2 text-xs text-gray-600 mt-2">
                          <User size={12} className="mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{member.bio}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <Calendar size={12} />
                        <span>Joined {formatDate(member.created_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => navigate(`/member/${member.id}`)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-200"
                      >
                        View Profile
                        <ChevronRight size={14} />
                      </button>
                      {member.is_friend && (
                        <button
                          onClick={() => navigate(`/messages`)}
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2"
                        >
                          <Mail size={14} />
                          Message
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Connection Requests Modal */}
      {showRequestsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowRequestsModal(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="bg-gradient-to-b from-gray-50 to-blue-50 w-full max-w-screen-sm mx-auto h-[85vh] rounded-t-2xl shadow-2xl border border-gray-200/80 flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200/80 bg-gradient-to-b from-gray-50 to-blue-50 rounded-t-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Connection Requests</h2>
                    <p className="text-sm text-gray-500">
                      Manage your connection requests
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowRequestsModal(false)}
                    className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-xl p-3">
                    <div className="text-lg font-bold text-gray-900">{connectionStats.pending_received}</div>
                    <div className="text-xs text-gray-600">Received</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-600/10 to-orange-500/10 rounded-xl p-3">
                    <div className="text-lg font-bold text-gray-900">{connectionStats.pending_sent}</div>
                    <div className="text-xs text-gray-600">Sent</div>
                  </div>
                </div>
              </div>

              {/* Requests List */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Received Requests */}
                {members.filter(m => m.is_incoming_request).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Bell size={14} />
                      Received Requests ({members.filter(m => m.is_incoming_request).length})
                    </h3>
                    <div className="space-y-4">
                      {members.filter(m => m.is_incoming_request).map(member => (
                        <div 
                          key={member.id}
                          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                  {member.avatar_url ? (
                                    <img 
                                      src={member.avatar_url} 
                                      alt={`${member.first_name} ${member.last_name}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900">
                                  {member.first_name} {member.last_name}
                                </h4>
                                {member.position && (
                                  <p className="text-xs text-gray-600 truncate mt-1">
                                    {member.position}
                                  </p>
                                )}
                                {member.business_name && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                    <Building size={10} />
                                    {member.business_name}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  handleAcceptRequest(member.connection_id!, member.id);
                                  setShowRequestsModal(false);
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                              >
                                <Check size={16} />
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  handleRejectRequest(member.connection_id!, member.id);
                                  setShowRequestsModal(false);
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                              >
                                <X size={16} />
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent Requests */}
                {members.filter(m => m.is_outgoing_request).length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Send size={14} />
                      Sent Requests ({members.filter(m => m.is_outgoing_request).length})
                    </h3>
                    <div className="space-y-4">
                      {members.filter(m => m.is_outgoing_request).map(member => (
                        <div 
                          key={member.id}
                          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                  {member.avatar_url ? (
                                    <img 
                                      src={member.avatar_url} 
                                      alt={`${member.first_name} ${member.last_name}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900">
                                  {member.first_name} {member.last_name}
                                </h4>
                                {member.position && (
                                  <p className="text-xs text-gray-600 truncate mt-1">
                                    {member.position}
                                  </p>
                                )}
                                {member.business_name && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                    <Building size={10} />
                                    {member.business_name}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">Awaiting response</p>
                              </div>
                            </div>
                            
                            {/* Cancel Button */}
                            <button
                              onClick={() => {
                                handleCancelRequest(member.connection_id!, member.id);
                                setShowRequestsModal(false);
                              }}
                              className="w-full py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm border border-gray-200"
                            >
                              Cancel Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Requests */}
                {members.filter(m => m.is_incoming_request).length === 0 && 
                 members.filter(m => m.is_outgoing_request).length === 0 && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">No Pending Requests</h4>
                    <p className="text-gray-600 text-sm">You're all caught up! Check back later for new requests.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200/80">
                <button
                  onClick={() => {
                    setShowRequestsModal(false);
                    setActiveTab('requests');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md"
                >
                  View All in Requests Tab
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
};

export default Members;