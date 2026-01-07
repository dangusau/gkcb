import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  MessageSquarePlus, 
  Users,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Conversation = {
  id: string;
  with_user: {
    id: string;
    name: string;
    avatar_url?: string;
    status: 'online' | 'offline';
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

type Member = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  is_friend: boolean;
};

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [friends, setFriends] = useState<Member[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        setCurrentUser(user);
        await fetchData(user.id);
      } catch (error) {
        console.error('Error initializing:', error);
        showFeedback('error', 'Failed to initialize');
      }
    };

    initialize();
  }, [navigate]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch conversations and friends in parallel
      await Promise.all([
        fetchConversations(userId),
        fetchFriends(userId)
      ]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showFeedback('error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      // Get all conversations where current user is a participant
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('Error fetching conversations:', convError);
        setConversations([]);
        setFilteredConversations([]);
        return;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        return;
      }

      const conversationsWithDetails: Conversation[] = [];

      for (const conv of conversationsData) {
        try {
          // Determine the other participant ID
          const otherParticipantId = conv.participant_1 === userId 
            ? conv.participant_2 
            : conv.participant_1;

          // Get the other participant's profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', otherParticipantId)
            .single();

          if (profileError || !profile) {
            console.warn('Profile not found for user:', otherParticipantId);
            continue;
          }

          // Build name safely
          const firstName = profile.first_name || '';
          const lastName = profile.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();

          // Get the last message
          let lastMessage = null;
          try {
            const { data: messageData } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            lastMessage = messageData;
          } catch (error) {
            // No messages found, continue with null
          }

          // Get unread count
          let unreadCount = 0;
          try {
            const { data: unreadMessages } = await supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', conv.id)
              .eq('is_read', false)
              .neq('sender_id', userId);
            
            unreadCount = unreadMessages?.length || 0;
          } catch (error) {
            console.log('Error fetching unread messages:', error);
          }

          conversationsWithDetails.push({
            id: conv.id,
            with_user: {
              id: profile.id,
              name: fullName || 'User',
              avatar_url: profile.avatar_url,
              status: 'online'
            },
            last_message: lastMessage?.content || 'No messages yet',
            last_message_at: formatTimeAgo(lastMessage?.created_at || conv.created_at),
            unread_count: unreadCount
          });
        } catch (error) {
          console.error('Error processing conversation:', conv.id, error);
        }
      }

      setConversations(conversationsWithDetails);
      setFilteredConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      showFeedback('error', 'Failed to load conversations');
    }
  };

  const fetchFriends = async (userId: string) => {
    try {
      // First, try to get accepted connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      const friendsList: Member[] = [];

      if (!connectionsError && connectionsData && connectionsData.length > 0) {
        for (const conn of connectionsData) {
          const otherUserId = conn.user_id === userId ? conn.friend_id : conn.user_id;
          
          try {
            // Get profile with only existing fields
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url, approval_status')
              .eq('id', otherUserId)
              .eq('approval_status', 'approved')
              .single();

            if (!profile) {
              continue;
            }

            // Build name safely
            const firstName = profile.first_name || '';
            const lastName = profile.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();

            friendsList.push({
              id: profile.id,
              user_id: profile.id,
              first_name: firstName,
              last_name: lastName,
              full_name: fullName || 'User',
              avatar_url: profile.avatar_url,
              is_friend: true
            });
          } catch (error) {
            console.warn('Error processing connection:', error);
          }
        }
      }

      // If we have connections, use them
      if (friendsList.length > 0) {
        setFriends(friendsList);
      } else {
        // Fall back to all approved members
        await fetchAllApprovedProfiles(userId);
      }
    } catch (error) {
      console.error('Error in fetchFriends:', error);
      await fetchAllApprovedProfiles(userId);
    }
  };

  const fetchAllApprovedProfiles = async (currentUserId: string) => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, approval_status')
        .neq('id', currentUserId)
        .eq('approval_status', 'approved')
        .limit(50);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        showFeedback('error', 'Failed to load members');
        return;
      }

      const friendsList: Member[] = (profiles || []).map(profile => {
        const firstName = profile.first_name || '';
        const lastName = profile.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return {
          id: profile.id,
          user_id: profile.id,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName || 'User',
          avatar_url: profile.avatar_url,
          is_friend: false
        };
      });

      console.log(`Fetched ${friendsList.length} approved profiles`);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error in fetchAllApprovedProfiles:', error);
    }
  };

  useEffect(() => {
    let result = conversations;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(conv => 
        conv.with_user.name.toLowerCase().includes(term) ||
        conv.last_message.toLowerCase().includes(term)
      );
    }

    // Filter by unread
    if (activeFilter === 'unread') {
      result = result.filter(conv => conv.unread_count > 0);
    }

    setFilteredConversations(result);
  }, [searchTerm, activeFilter, conversations]);

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  const openChat = async (userId: string, friendName: string) => {
    if (!currentUser) {
      showFeedback('error', 'Please login to start a chat');
      return;
    }

    setOpeningChat(userId);

    try {
      console.log('Opening chat with:', userId);
      
      // Check if conversation already exists
      let existingConversation = null;
      try {
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`);

        if (conversationsData) {
          // Find conversation with this specific user
          existingConversation = conversationsData.find(conv => 
            conv.participant_1 === userId || conv.participant_2 === userId
          );
        }
      } catch (error) {
        console.error('Error checking existing conversations:', error);
      }

      let conversationId = existingConversation?.id;

      // If conversation doesn't exist, create it
      if (!conversationId) {
        console.log('Creating new conversation...');
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert([
            {
              participant_1: currentUser.id,
              participant_2: userId,
              last_message_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          
          // Try to fetch again in case it was created by race condition
          if (createError.code === '23505') {
            const { data: fetchedConv } = await supabase
              .from('conversations')
              .select('*')
              .or(`participant_1.eq.${currentUser.id},participant_2.eq.${userId}`)
              .or(`participant_1.eq.${userId},participant_2.eq.${currentUser.id}`)
              .maybeSingle();
            
            if (fetchedConv) {
              conversationId = fetchedConv.id;
            }
          }
          
          if (!conversationId) {
            showFeedback('error', 'Failed to create conversation');
            return;
          }
        } else {
          conversationId = newConversation?.id;
        }
      }

      if (!conversationId) {
        showFeedback('error', 'Failed to start chat');
        return;
      }

      // Create an initial welcome message
      try {
        await supabase
          .from('messages')
          .insert([
            {
              conversation_id: conversationId,
              sender_id: currentUser.id,
              content: `Started a conversation`,
              is_read: true,
              created_at: new Date().toISOString()
            }
          ]);
      } catch (error) {
        console.log('Note: Could not create initial message');
      }

      // Close modal first
      setIsNewChatOpen(false);
      setFriendSearch("");

      // Navigate to chat immediately
      navigate(`/messages/chat/${conversationId}`);

    } catch (error) {
      console.error('Error opening chat:', error);
      showFeedback('error', 'Failed to open chat');
    } finally {
      setOpeningChat(null);
    }
  };

  const filteredFriends = friends.filter(f => {
    const search = friendSearch.toLowerCase();
    return (
      f.full_name.toLowerCase().includes(search) ||
      (f.first_name && f.first_name.toLowerCase().includes(search)) ||
      (f.last_name && f.last_name.toLowerCase().includes(search))
    );
  });

  const unreadCount = conversations.filter(c => c.unread_count > 0).length;
  const totalUnread = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 safe-area">
      {/* FEEDBACK MESSAGE */}
      {feedback && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className={`rounded-2xl shadow-xl p-4 flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-green-600 text-white' 
              : feedback.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={24} className="flex-shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle size={24} className="flex-shrink-0" />
            ) : (
              <Info size={24} className="flex-shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{feedback.message}</p>
            <button 
              onClick={() => setFeedback(null)}
              className="ml-2 text-white/80 hover:text-white transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-blue-50 px-4 pt-6 pb-4 border-b border-gray-200/80">
        <div className="max-w-screen-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread conversation${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <button 
              onClick={() => setIsNewChatOpen(true)}
              className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
              title="New Message"
            >
              <MessageSquarePlus size={22} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative group mt-4">
            <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
              <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Search messages, people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'unread'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
              {totalUnread > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeFilter === 'unread' ? 'bg-white/30' : 'bg-blue-100 text-blue-700'
                }`}>
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* Stats */}
        {conversations.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
                  <div className="text-xs text-gray-600">Conversations</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
                  <div className="text-xs text-gray-600">Unread</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{friends.filter(f => f.is_friend).length}</div>
                  <div className="text-xs text-gray-600">Connections</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div>
          {filteredConversations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center mt-4">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {searchTerm ? 'No results found' : activeFilter === 'unread' ? 'No Unread Messages' : 'No Messages Yet'}
              </h4>
              <p className="text-gray-600 text-sm mb-6">
                {searchTerm
                  ? 'Try different search terms'
                  : activeFilter === 'unread' 
                  ? 'You\'re all caught up!'
                  : 'Start a conversation with your network'}
              </p>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => navigate(`/messages/chat/${conv.id}`)}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                            {conv.with_user.avatar_url ? (
                              <img 
                                src={conv.with_user.avatar_url} 
                                alt={conv.with_user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              conv.with_user.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            conv.with_user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {conv.with_user.name}
                            </h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                              {conv.last_message_at}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                      
                      {conv.unread_count > 0 && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-xs font-bold text-white">{conv.unread_count}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
            onClick={() => !openingChat && setIsNewChatOpen(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-screen-sm mx-auto h-[85vh] rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">New Message</h2>
                    <p className="text-xs text-gray-500">
                      {friends.filter(f => f.is_friend).length > 0 
                        ? `Connect with your ${friends.filter(f => f.is_friend).length} connections` 
                        : 'Connect with members'}
                    </p>
                  </div>
                  <button 
                    onClick={() => !openingChat && setIsNewChatOpen(false)}
                    className="p-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    disabled={openingChat !== null}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                    placeholder="Search members by name..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    autoFocus
                    disabled={openingChat !== null}
                  />
                  {friendSearch && (
                    <button
                      onClick={() => !openingChat && setFriendSearch("")}
                      className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      disabled={openingChat !== null}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Users size={16} />
                    {friends.filter(f => f.is_friend).length > 0 
                      ? `Your Connections (${friends.filter(f => f.is_friend).length})` 
                      : `Available Members (${friends.length})`}
                  </h3>
                  {filteredFriends.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {friendSearch ? 'No members found matching your search' : 'No members available'}
                      </p>
                      {!friendSearch && (
                        <button
                          onClick={() => {
                            setIsNewChatOpen(false);
                            navigate('/members');
                          }}
                          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          Explore Members →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFriends.map(friend => (
                        <button
                          key={friend.id}
                          onClick={() => openChat(friend.user_id, friend.full_name)}
                          disabled={openingChat !== null}
                          className={`w-full bg-gray-50 rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-all text-left ${
                            openingChat === friend.user_id 
                              ? 'opacity-70 cursor-not-allowed' 
                              : 'cursor-pointer active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                {friend.avatar_url ? (
                                  <img 
                                    src={friend.avatar_url} 
                                    alt={friend.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  friend.full_name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              {friend.is_friend && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                  {friend.full_name}
                                  {friend.is_friend && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md">Connected</span>
                                  )}
                                </h4>
                                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                              </div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                Member
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsNewChatOpen(false);
                    navigate('/members');
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm border border-gray-200 flex items-center justify-center gap-2"
                  disabled={openingChat !== null}
                >
                  <Users size={14} />
                  Find More Members
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Messages;