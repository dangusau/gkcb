import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useHeartbeat } from '../hooks/useHeartbeat';
import Header from '../components/Header';

// Custom debounce function
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

// Types matching database function returns
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
  raw_timestamp?: string;
};

type Member = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  is_friend: boolean;
  is_online: boolean;
};

const Messages = () => {
  const navigate = useNavigate();
  
  // State
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
  
  // Refs for cleanup
  const cleanupRef = useRef<(() => void)[]>([]);
  
  // Initialize heartbeat
  useHeartbeat();
  
  // Use ref for debounce function
  const debouncedFilterRef = useRef(
    debounce((search: string, filter: 'all' | 'unread', convs: Conversation[]) => {
      let result = convs;

      if (search) {
        const term = search.toLowerCase();
        result = result.filter(conv => 
          conv.with_user.name.toLowerCase().includes(term) ||
          conv.last_message.toLowerCase().includes(term)
        );
      }

      if (filter === 'unread') {
        result = result.filter(conv => conv.unread_count > 0);
      }

      setFilteredConversations(result);
    }, 300)
  );

  // Function to mark ALL messages in a conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id) {
      console.error('No current user found');
      return;
    }

    console.log(`Marking conversation ${conversationId} as read for user ${currentUser.id}`);
    
    try {
      // First, let's check what messages need to be marked as read
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, is_read, sender_id')
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', currentUser.id);

      if (fetchError) {
        console.error('Error fetching unread messages:', fetchError);
        return;
      }

      console.log(`Found ${unreadMessages?.length || 0} unread messages to mark as read`);

      if (!unreadMessages || unreadMessages.length === 0) {
        // Update local state even if no unread messages in DB
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return { ...conv, unread_count: 0 };
          }
          return conv;
        }));
        return;
      }

      // Update messages in database
      const messageIds = unreadMessages.map(msg => msg.id);
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (updateError) {
        console.error('Error updating messages as read:', updateError);
        showFeedback('error', 'Failed to mark messages as read');
        return;
      }

      console.log(`Successfully marked ${messageIds.length} messages as read`);

      // Update local state
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      }));

      // Also call the database function to recalculate unread counts
      try {
        await supabase.rpc('update_conversation_unread_count', {
          conversation_id: conversationId,
          user_id: currentUser.id
        });
      } catch (rpcError) {
        console.log('RPC function not available, continuing...', rpcError);
      }

    } catch (error) {
      console.error('Error in markConversationAsRead:', error);
      // Still update local state even if DB update fails
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      }));
    }
  }, [currentUser?.id]);

  // Initialize
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

        console.log('Initializing Messages for user:', user.id);
        setCurrentUser(user);
        await fetchAllData(user.id);
        
        // Set up real-time subscriptions
        const cleanup = setupRealtimeSubscriptions(user.id);
        cleanupRef.current.push(cleanup);
        
      } catch (error) {
        console.error('Error initializing:', error);
        showFeedback('error', 'Failed to initialize messages');
      }
    };

    initialize();

    // Cleanup
    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [navigate]);

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = (userId: string) => {
    console.log('Setting up real-time subscriptions for user:', userId);

    // Subscribe to conversation updates
    const conversationsChannel = supabase.channel('messages-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants=cs.{"${userId}"}`
        },
        (payload) => {
          console.log('Conversation change detected:', payload);
          fetchConversations(userId);
        }
      )
      .subscribe();

    // Subscribe to message updates
    const messagesChannel = supabase.channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('New message detected:', payload);
          // Wait a bit to ensure the unread count is updated
          setTimeout(() => {
            fetchConversations(userId);
          }, 500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `is_read=eq.true`
        },
        () => {
          console.log('Message read status updated');
          setTimeout(() => {
            fetchConversations(userId);
          }, 500);
        }
      )
      .subscribe();

    // Subscribe to user online status
    const statusChannel = supabase.channel('messages-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          console.log('Profile status updated');
          fetchFriends(userId);
        }
      )
      .subscribe();

    return () => {
      conversationsChannel.unsubscribe();
      messagesChannel.unsubscribe();
      statusChannel.unsubscribe();
    };
  };

  // Fetch all data
  const fetchAllData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Send heartbeat
      try {
        await supabase.rpc('heartbeat', { user_id: userId });
      } catch (error) {
        console.log('Heartbeat not critical:', error);
      }
      
      // Fetch conversations and friends in parallel
      const [conversationsResult, friendsResult] = await Promise.allSettled([
        fetchConversations(userId),
        fetchFriends(userId)
      ]);

      console.log('Fetch results:', {
        conversations: conversationsResult.status === 'fulfilled' ? conversationsResult.value.length : 'failed',
        friends: friendsResult.status === 'fulfilled' ? friendsResult.value.length : 'failed'
      });
      
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      showFeedback('error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations using database function
  const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    try {
      console.log('Fetching conversations for user:', userId);
      
      const { data, error } = await supabase
        .rpc('get_user_conversations', { user_id: userId });

      if (error) {
        console.error('Error fetching conversations:', error);
        showFeedback('error', 'Failed to load conversations');
        setConversations([]);
        setFilteredConversations([]);
        return [];
      }

      console.log('Raw conversations data:', data);

      if (!data || data.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        setFilteredConversations([]);
        return [];
      }

      // Format the data for UI
      const formattedConversations: Conversation[] = data.map((conv: any) => {
        let withUser = conv.with_user;
        if (typeof conv.with_user === 'string') {
          try {
            withUser = JSON.parse(conv.with_user);
          } catch (e) {
            console.warn('Failed to parse with_user JSON:', conv.with_user);
            withUser = {
              id: conv.id,
              name: 'User',
              status: 'offline'
            };
          }
        }

        const conversation: Conversation = {
          id: conv.id,
          with_user: {
            id: withUser.id || conv.id,
            name: withUser.name || 'User',
            avatar_url: withUser.avatar_url,
            status: withUser.status || 'offline'
          },
          last_message: conv.last_message || 'No messages yet',
          last_message_at: formatTimeAgo(conv.last_message_at),
          unread_count: conv.unread_count || 0,
          raw_timestamp: conv.last_message_at
        };

        console.log(`Formatted conversation ${conversation.id}:`, {
          name: conversation.with_user.name,
          unread_count: conversation.unread_count,
          last_message: conversation.last_message
        });

        return conversation;
      });

      // Sort by last_message_at (newest first)
      const sortedConversations = formattedConversations.sort((a, b) => {
        if (!a.raw_timestamp || !b.raw_timestamp) return 0;
        return new Date(b.raw_timestamp).getTime() - new Date(a.raw_timestamp).getTime();
      });

      console.log(`Loaded ${sortedConversations.length} conversations, total unread:`, 
        sortedConversations.reduce((sum, conv) => sum + conv.unread_count, 0));

      setConversations(sortedConversations);
      debouncedFilterRef.current(searchTerm, activeFilter, sortedConversations);
      
      return sortedConversations;
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      showFeedback('error', 'Failed to load conversations');
      setConversations([]);
      setFilteredConversations([]);
      return [];
    }
  };

  // Fetch friends using database function
  const fetchFriends = async (userId: string): Promise<Member[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_available_members', { current_user_id: userId });

      if (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
        return [];
      }

      const formattedFriends: Member[] = (data || []).map((friend: any) => ({
        id: friend.id || friend.user_id,
        user_id: friend.user_id || friend.id,
        first_name: friend.first_name || '',
        last_name: friend.last_name || '',
        full_name: friend.full_name || 
          `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || 'User',
        avatar_url: friend.avatar_url,
        is_friend: friend.is_friend || false,
        is_online: friend.is_online || false
      }));

      // Sort by online status first, then by name
      const sortedFriends = formattedFriends.sort((a, b) => {
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setFriends(sortedFriends);
      return sortedFriends;
    } catch (error) {
      console.error('Error in fetchFriends:', error);
      setFriends([]);
      return [];
    }
  };

  // Update filters when dependencies change
  useEffect(() => {
    debouncedFilterRef.current(searchTerm, activeFilter, conversations);
  }, [searchTerm, activeFilter, conversations]);

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    try {
      if (!timestamp) return 'Recently';
      
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

  // Open chat
  const openChat = async (userId: string, friendName: string) => {
    if (!currentUser) {
      showFeedback('error', 'Please login to start a chat');
      return;
    }

    setOpeningChat(userId);

    try {
      // Send heartbeat before opening chat
      await supabase.rpc('heartbeat', { user_id: currentUser.id });
      
      // Get or create conversation
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: currentUser.id,
          user2_id: userId
        });

      if (error) {
        console.error('Error creating conversation:', error);
        showFeedback('error', error.message || 'Failed to start chat');
        return;
      }

      if (!data || data.length === 0) {
        showFeedback('error', 'Failed to start chat');
        return;
      }

      const conversationId = data[0].conversation_id;
      const createdNew = data[0].created_new;

      if (createdNew) {
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
          console.log('Note: Could not create initial message:', error);
        }
      }

      // Mark conversation as read before navigating
      await markConversationAsRead(conversationId);
      
      // Close modal and navigate
      setIsNewChatOpen(false);
      setFriendSearch("");
      navigate(`/messages/chat/${conversationId}`);

    } catch (error: any) {
      console.error('Error opening chat:', error);
      showFeedback('error', error.message || 'Failed to open chat');
    } finally {
      setOpeningChat(null);
    }
  };

  // Handle opening existing chat
  const handleOpenExistingChat = async (conversationId: string) => {
    console.log('Opening existing chat:', conversationId);
    
    // Mark conversation as read before navigating
    await markConversationAsRead(conversationId);
    
    // Navigate to chat
    navigate(`/messages/chat/${conversationId}`);
  };

  // Filter friends based on search
  const filteredFriends = friends.filter(f => {
    const search = friendSearch.toLowerCase();
    return (
      f.full_name.toLowerCase().includes(search) ||
      (f.first_name && f.first_name.toLowerCase().includes(search)) ||
      (f.last_name && f.last_name.toLowerCase().includes(search))
    );
  });

  // Calculate stats
  const unreadCount = conversations.filter(c => c.unread_count > 0).length;
  const totalUnread = conversations.reduce((total, conv) => total + conv.unread_count, 0);
  const onlineFriendsCount = friends.filter(f => f.is_online).length;

  // Show feedback
  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Messages...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up real-time updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 safe-area">
      {/* Use your Header component */}
      <Header title="Messages" showBack={false} />
      
      {/* FEEDBACK MESSAGE */}
      {feedback && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
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

      {/* Main Content */}
      <div className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* Stats Card */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-700 mb-1">Message Overview</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {onlineFriendsCount} online
                    </span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <span className="text-sm text-gray-600">
                    {totalUnread > 0 ? `${totalUnread} unread messages` : 'All caught up!'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="p-3 bg-blue-600 rounded-xl text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                title="New Message"
              >
                <MessageSquarePlus size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          {/* Search Bar */}
          <div className="relative group mb-4">
            <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
              <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
          <div className="flex gap-2">
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
                  onClick={() => handleOpenExistingChat(conv.id)}
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
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = conv.with_user.name.substring(0, 2).toUpperCase();
                                    parent.className = "w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg";
                                  }
                                }}
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
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-gray-900 truncate">
                                {conv.with_user.name}
                              </h3>
                            </div>
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
      </div>

      {/* New Chat Modal - Bottom Sheet */}
      {isNewChatOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => !openingChat && setIsNewChatOpen(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 z-50 max-w-screen-sm mx-auto">
            <div className="bg-white w-full h-[85vh] rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">New Message</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {friends.filter(f => f.is_friend).length > 0 
                          ? `${friends.filter(f => f.is_friend).length} connections` 
                          : `${friends.length} members available`}
                      </p>
                    </div>
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Users size={16} />
                      {friends.filter(f => f.is_friend).length > 0 
                        ? `Your Connections` 
                        : `Available Members`}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {filteredFriends.length} of {friends.length}
                      </span>
                    </div>
                  </div>
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
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = friend.full_name.substring(0, 2).toUpperCase();
                                        parent.className = "w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden";
                                      }
                                    }}
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
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-gray-900 truncate">
                                    {friend.full_name}
                                  </h4>
                                  {friend.is_friend && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md">Connected</span>
                                  )}
                                </div>
                                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-xs text-gray-500 truncate">
                                  Member
                                </p>
                              </div>
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