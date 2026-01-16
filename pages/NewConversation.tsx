import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, UserCheck, UserPlus, Store } from 'lucide-react';
import { supabase } from '../services/supabase/client';
import { messagingService } from '../services/supabase/messaging';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_connected: boolean;
  connection_status?: 'pending' | 'accepted' | 'rejected';
}

const NewConversation: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'discover'>('connections');

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() && activeTab === 'discover') {
      searchUsers();
    }
  }, [searchQuery, activeTab]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted connections
      const { data, error } = await supabase
        .from('connections')
        .select(`
          *,
          user_profile:profiles!connections_user_id_fkey(
            id,
            display_name,
            avatar_url
          ),
          connected_user_profile:profiles!connections_connected_user_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const connectionProfiles: UserProfile[] = (data || []).map(conn => {
        const isUserProfile = conn.user_id === user.id;
        const profile = isUserProfile ? conn.connected_user_profile : conn.user_profile;
        
        return {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          is_connected: true,
          connection_status: 'accepted'
        };
      });

      setConnections(connectionProfiles);
      setUsers(connectionProfiles); // Show connections by default
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .neq('id', user.id)
        .ilike('display_name', `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      // Check connection status for each user
      const usersWithStatus = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: connection } = await supabase
            .from('connections')
            .select('status')
            .or(`and(user_id.eq.${user.id},connected_user_id.eq.${profile.id}),and(user_id.eq.${profile.id},connected_user_id.eq.${user.id})`)
            .single();

          return {
            ...profile,
            is_connected: connection?.status === 'accepted',
            connection_status: connection?.status
          };
        })
      );

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const conversationId = await messagingService.getOrCreateConversation(userId, 'connection');
      navigate(`/messages/${conversationId}`, {
        state: {
          otherUser: users.find(u => u.id === userId)
        }
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation');
    }
  };

  const handleSendConnectionRequest = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: user.id,
          connected_user_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      // Refresh list
      if (activeTab === 'discover') {
        searchUsers();
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">New Conversation</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-4">
        <div className="flex space-x-6">
          <button
            onClick={() => {
              setActiveTab('connections');
              setUsers(connections);
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'connections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="font-medium">Connections</span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {connections.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
              activeTab === 'discover'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="font-medium">Discover</span>
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="p-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {activeTab === 'connections' ? (
                <UserCheck className="w-8 h-8 text-gray-400" />
              ) : (
                <Search className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {activeTab === 'connections' ? 'No connections yet' : 'No users found'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'connections'
                ? 'Connect with people to start chatting'
                : searchQuery
                  ? 'Try a different search term'
                  : 'Search for users to connect with'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-3 hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                          {user.display_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <h3 className="font-bold text-gray-900">{user.display_name}</h3>
                      <p className="text-sm text-gray-500">
                        {user.is_connected ? 'Connected' : 
                         user.connection_status === 'pending' ? 'Request pending' : 
                         'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div>
                    {user.is_connected ? (
                      <button
                        onClick={() => handleStartConversation(user.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        Message
                      </button>
                    ) : user.connection_status === 'pending' ? (
                      <button
                        disabled
                        className="bg-gray-100 text-gray-600 font-medium px-4 py-2 rounded-xl"
                      >
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendConnectionRequest(user.id)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConversation;