import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, CheckCircle, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

type UserProfile = {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  role: string;
  approval_status: string;
  bio?: string;
  phone?: string;
  payment_verified?: boolean;
  created_at: string;
  connection_count?: number;
  industry?: string;
  location?: string;
};

const MembersPage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        await fetchMembers(profile.id);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (currentUserId: string) => {
    try {
      // First, get all approved users except current user
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .neq('id', currentUserId)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      if (!allUsers) {
        setMembers([]);
        return;
      }

      // Get connections where current user is involved
      const { data: connections, error: connError } = await supabase
        .from('connections')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId})`);

      if (connError) throw connError;

      const connectedUserIds = new Set<string>();
      connections?.forEach(conn => {
        if (conn.user_id === currentUserId) {
          connectedUserIds.add(conn.friend_id);
        } else {
          connectedUserIds.add(conn.user_id);
        }
      });

      // Filter out connected users
      const unconnectedUsers = allUsers.filter(user => !connectedUserIds.has(user.id));

      // Get connection counts for each member
      const membersWithCounts = await Promise.all(
        unconnectedUsers.map(async (member) => {
          // Get connection count
          const { count: connectionCount, error: countError } = await supabase
            .from('connections')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${member.id},friend_id.eq.${member.id})`);

          if (countError) throw countError;

          return {
            ...member,
            connection_count: connectionCount || 0
          };
        })
      );

      // Sort by connection count (highest first)
      const sortedMembers = membersWithCounts.sort((a, b) => 
        (b.connection_count || 0) - (a.connection_count || 0)
      );

      setMembers(sortedMembers);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
    }
  };

  const handleConnect = async (friendId: string) => {
    if (!userProfile) return;

    try {
      setConnectingId(friendId);

      // Send connection request
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: userProfile.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          type: 'connection_request',
          actor_id: userProfile.id,
          content: `${userProfile.first_name} sent you a connection request`,
          is_read: false
        });

      // Remove from list
      setMembers(prev => prev.filter(member => member.id !== friendId));
      
      // Show success message
      const member = members.find(m => m.id === friendId);
      if (member) {
        alert(`Connection request sent to ${member.first_name} ${member.last_name}`);
      }
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setConnectingId(null);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || 'U';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-area pb-20">
      <Header />
      
      <main className="px-4 pt-4 max-w-screen-sm mx-auto">
        {/* Title Only - Back Button Removed */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Connect with Members</h1>
          <p className="text-gray-600 text-sm">Discover and connect with other GKBC members</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => userProfile && fetchMembers(userProfile.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Members Found</h4>
            <p className="text-gray-600 text-sm mb-6">
              You've connected with all available members or no members are currently available.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 bg-gray-100">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {getInitials(member.first_name, member.last_name)}
                        </div>
                      )}
                    </div>
                    {member.payment_verified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <CheckCircle size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {member.first_name} {member.last_name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{member.connection_count || 0} connections</span>
                        </div>
                        {member.role && (
                          <div className="flex items-center gap-1">
                            <Briefcase size={12} />
                            <span>{member.role}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {member.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {member.bio}
                      </p>
                    )}

                    {/* Additional Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      {member.industry && (
                        <span className="px-2 py-1 bg-gray-100 rounded">{member.industry}</span>
                      )}
                      {member.location && (
                        <span>{member.location}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleConnect(member.id)}
                      disabled={connectingId === member.id}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connectingId === member.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MembersPage;