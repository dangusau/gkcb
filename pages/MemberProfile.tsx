import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import {
  ArrowLeft, Building2, Calendar, MapPin, Briefcase, Mail, Phone as PhoneIcon,
  UserPlus, Check, X, MessageCircle, Heart, Share2, Trash2, Globe, Users
} from 'lucide-react';
import { supabase } from '../services/supabase';

type MemberProfile = {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
  role: string;
  location?: string;
  website?: string;
  business_name?: string;
  position?: string;
  category?: string;
  payment_verified?: boolean;
  approval_status: string;
  created_at: string;
  is_friend?: boolean;
  connection_status?: 'pending' | 'accepted' | 'rejected';
};

type Post = {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
};

type Business = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  category: string;
  location: string;
  is_owned: boolean;
};

const MemberProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'posts' | 'businesses'>('posts');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUserId(user.id);

        if (!id) {
          navigate('/members');
          return;
        }

        // Get member profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!profileData) {
          navigate('/members');
          return;
        }

        // Check connection status
        const { data: connections } = await supabase
          .from('connections')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        const connection = connections?.find(conn => 
          (conn.user_id === user.id && conn.friend_id === id) ||
          (conn.friend_id === user.id && conn.user_id === id)
        );

        setProfile({
          ...profileData,
          is_friend: connection?.status === 'accepted',
          connection_status: connection?.status
        });

        // Get posts (mock data for now)
        const mockPosts: Post[] = [
          {
            id: '1',
            content: 'Just launched our new textile manufacturing line! Excited to share this milestone with our business community.',
            created_at: '2024-01-15T10:30:00Z',
            likes: 24,
            comments: 8,
            shares: 3
          },
          {
            id: '2',
            content: 'Looking for partnership opportunities in the agriculture sector. We have 50 acres of farmland available for joint ventures.',
            created_at: '2024-01-10T14:20:00Z',
            likes: 42,
            comments: 12,
            shares: 5
          }
        ];
        setPosts(mockPosts);

        // Get businesses
        const { data: businessData } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', id);

        setBusinesses(businessData || []);

      } catch (error) {
        console.error('Error loading member profile:', error);
        navigate('/members');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  /* ---------------- HELPERS ---------------- */

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConnect = async () => {
    if (!profile || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: currentUserId,
          friend_id: profile.id,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          type: 'connection_request',
          actor_id: currentUserId,
          content: `${profile.first_name} sent you a connection request`,
          is_read: false
        });

      // Update local state
      setProfile({
        ...profile,
        connection_status: 'pending'
      });

      showToast(`Connection request sent to ${profile.first_name} ${profile.last_name}`);

    } catch (error) {
      console.error('Error sending connection request:', error);
      showToast('Failed to send connection request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
        <Header title="Member Profile" showBack={true} onBack={() => navigate('/members')} />
        <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Profile Not Found</h4>
            <p className="text-gray-600 text-sm mb-6">This member profile could not be loaded</p>
            <button
              onClick={() => navigate('/members')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
            >
              Back to Members
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 safe-area pb-20">
      {/* HEADER */}
      <Header 
        title="Profile" 
        showBack={true} 
        onBack={() => navigate('/members')}
      />

      {/* MAIN CONTENT */}
      <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden mb-6">
          <div className="relative">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700"></div>
            
            {/* Avatar and Info */}
            <div className="relative px-6 pb-6">
              <div className="absolute -top-12 left-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || `${profile.first_name} ${profile.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
                  )}
                </div>
              </div>

              <div className="pt-16">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                    </h2>
                    {profile.position && (
                      <p className="text-sm text-gray-500">{profile.position}</p>
                    )}
                    {profile.business_name && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Building2 size={12} />
                        {profile.business_name}
                      </p>
                    )}
                  </div>
                  
                  {/* Connect Button (replaces Settings) */}
                  <div>
                    {profile.connection_status === 'accepted' ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                        Connected
                      </span>
                    ) : profile.connection_status === 'pending' ? (
                      <span className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg">
                        Request Sent
                      </span>
                    ) : (
                      <button 
                        onClick={handleConnect}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95 flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-3">{profile.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.category && (
                    <div className="flex items-center gap-1">
                      <Briefcase size={12} />
                      <span>{profile.category}</span>
                    </div>
                  )}
                  
                  {profile.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Joined {formatDate(profile.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
                  {profile.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail size={12} className="text-gray-400" />
                      <span className="text-gray-600 truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <PhoneIcon size={12} className="text-gray-400" />
                      <span className="text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe size={12} className="text-gray-400" />
                      <span className="text-gray-600 truncate">{profile.website}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{posts.length}</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{businesses.length}</div>
                    <div className="text-xs text-gray-500">Businesses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">128</div>
                    <div className="text-xs text-gray-500">Connections</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/95 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200/80 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'posts'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'businesses'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Businesses
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'posts' ? (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">No Posts Yet</h4>
                <p className="text-gray-600 text-sm">This member hasn't created any posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        {profile.first_name?.[0] || ''}{profile.last_name?.[0] || ''}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                        </h4>
                        <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">{post.content}</p>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-6">
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                          <Heart size={14} />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600">
                          <MessageCircle size={14} />
                          <span>{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600">
                          <Share2 size={14} />
                          <span>{post.shares}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">No Businesses Yet</h4>
                <p className="text-gray-600 text-sm">This member hasn't registered any businesses yet</p>
              </div>
            ) : (
              businesses.map((business) => (
                <div 
                  key={business.id} 
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                            {business.logo_url ? (
                              <img 
                                src={business.logo_url} 
                                alt={business.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              business.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">
                            {business.name}
                          </h3>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {business.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-bold rounded-lg">
                              {business.category}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={10} />
                              {business.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95">
                      View Business Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200/50 z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
};

export default MemberProfile;