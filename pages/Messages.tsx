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
  MessageSquare,
  Wifi,
  WifiOff
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useHeartbeat } from '../hooks/useHeartbeat';

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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
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

  // Test Supabase connection
  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      // Try a simple query to test connection
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        return false;
      }
      
      console.log('Supabase connection successful');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setConnectionError(null);
        
        console.log('Initializing Messages component...');
        
        // Test connection first
        const isConnected = await testConnection();
        if (!isConnected) {
          setConnectionError('Unable to connect to server. Please check your internet connection.');
          showFeedback('error', 'Connection error. Please refresh the page.');
          setLoading(false);
          return;
        }
        
        // Get session with error handling
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setConnectionError('Authentication error. Please login again.');
            navigate('/login');
            return;
          }
          
          if (!session) {
            console.log('No active session found');
            navigate('/login');
            return;
          }
          
          console.log('Session found, getting user...');
          
          // Get user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('User error:', userError);
            setConnectionError('Unable to load user data.');
            navigate('/login');
            return;
          }
          
          if (!user) {
            console.log('No user found');
            navigate('/login');
            return;
          }
          
          console.log('User loaded:', user.id);
          setCurrentUser(user);
          
          // Fetch data
          await fetchAllData(user.id);
          
          // Set up real-time subscriptions
          setupRealtimeSubscriptions(user.id);
          
        } catch (authError) {
          console.error('Auth process error:', authError);
          setConnectionError('Authentication failed. Please login again.');
          navigate('/login');
        }
        
      } catch (error) {
        console.error('Initialization error:', error);
        setConnectionError('Failed to initialize. Please try again.');
        showFeedback('error', 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      console.log('Cleaning up Messages component');
      try {
        const channel = supabase.channel('messages-updates');
        channel.unsubscribe();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, [navigate]);

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = (userId: string) => {
    try {
      console.log('Setting up real-time subscriptions...');
      
      // Subscribe to new messages
      const messagesChannel = supabase.channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          () => {
            console.log('New message detected, refreshing conversations...');
            fetchConversations(userId);
            setLastUpdated(new Date());
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          () => {
            console.log('Message updated, refreshing...');
            fetchConversations(userId);
            setLastUpdated(new Date());
          }
        )
        .subscribe((status) => {
          console.log('Messages channel status:', status);
        });

      // Subscribe to conversation updates
      const conversationsChannel = supabase.channel('conversations-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversations',
          },
          () => {
            console.log('New conversation created, refreshing...');
            fetchConversations(userId);
            setLastUpdated(new Date());
          }
        )
        .subscribe((status) => {
          console.log('Conversations channel status:', status);
        });

      // Subscribe to profile updates for online status
      const profilesChannel = supabase.channel('profiles-channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: 'last_seen=neq.' + new Date().toISOString()
          },
          (payload) => {
            console.log('Profile updated (online status), refreshing...', payload);
            // Refresh both conversations and friends
            fetchConversations(userId);
            fetchFriends(userId);
            setLastUpdated(new Date());
          }
        )
        .subscribe((status) => {
          console.log('Profiles channel status:', status);
        });

      console.log('Real-time subscriptions set up');
      
      return () => {
        messagesChannel.unsubscribe();
        conversationsChannel.unsubscribe();
        profilesChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      showFeedback('error', 'Live updates unavailable');
    }
  };

  // Fetch all data
  const fetchAllData = async (userId: string) => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      console.log('Fetching all data for user:', userId);
      
      // Send initial heartbeat (non-critical)
      try {
        await supabase.rpc('heartbeat', { user_id: userId });
        console.log('Heartbeat sent');
      } catch (heartbeatError) {
        console.log('Heartbeat not critical:', heartbeatError);
      }
      
      // Fetch conversations and friends in parallel
      const [conversationsResult, friendsResult] = await Promise.all([
        fetchConversations(userId),
        fetchFriends(userId)
      ]);

      console.log(`Loaded ${conversationsResult.length} conversations and ${friendsResult.length} friends`);
      
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      setConnectionError('Failed to load messages. Please check your connection.');
      showFeedback('error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations using database function
  const fetchConversations = async (userId: string): Promise<Conversation[]> => {
    try {
      console.log('Fetching conversations...');
      
      const { data, error } = await supabase
        .rpc('get_user_conversations', { user_id: userId });

      if (error) {
        console.error('RPC Error fetching conversations:', error);
        showFeedback('error', 'Failed to load conversations');
        setConversations([]);
        setFilteredConversations([]);
        return [];
      }

      console.log('Conversations data received:', data);

      if (!data || data.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        setFilteredConversations([]);
        return [];
      }

      // Format the data for UI
      // with_user is already a JSON object from the database function
      const formattedConversations: Conversation[] = data.map((conv: any) => {
        // with_user is already an object from jsonb_build_object
        const withUser = conv.with_user || {};
        
        return {
          id: conv.id || conv.conversation_id || 'unknown',
          with_user: {
            id: withUser.id || 'unknown',
            name: withUser.name || 'User',
            avatar_url: withUser.avatar_url,
            status: (withUser.status === 'online' ? 'online' : 'offline') as 'online' | 'offline'
          },
          last_message: conv.last_message || 'No messages yet',
          last_message_at: formatTimeAgo(conv.last_message_at),
          unread_count: conv.unread_count || 0,
          raw_timestamp: conv.last_message_at
        };
      });

      console.log('Formatted conversations:', formattedConversations);
      setConversations(formattedConversations);
      debouncedFilterRef.current(searchTerm, activeFilter, formattedConversations);
      
      return formattedConversations;
    } catch (error) {
      console.error('Exception in fetchConversations:', error);
      showFeedback('error', 'Failed to load conversations');
      setConversations([]);
      setFilteredConversations([]);
      return [];
    }
  };

  // Fetch friends using database function
  const fetchFriends = async (userId: string): Promise<Member[]> => {
    try {
      console.log('Fetching friends...');
      
      const { data, error } = await supabase
        .rpc('get_available_members', { current_user_id: userId });

      if (error) {
        console.error('RPC Error fetching friends:', error);
        showFeedback('error', 'Failed to load contacts');
        setFriends([]);
        return [];
      }

      console.log('Friends data received:', data);

      const formattedFriends: Member[] = (data || []).map((friend: any) => ({
        id: friend.id || friend.user_id || 'unknown',
        user_id: friend.user_id || friend.id || 'unknown',
        first_name: friend.first_name || '',
        last_name: friend.last_name || '',
        full_name: friend.full_name || 
          `${friend.first_name || ''} ${friend.last_name || ''}`.trim() || 'User',
        avatar_url: friend.avatar_url,
        is_friend: friend.is_friend || false,
        is_online: friend.is_online || false
      }));

      console.log('Formatted friends:', formattedFriends);
      setFriends(formattedFriends);
      return formattedFriends;
    } catch (error) {
      console.error('Exception in fetchFriends:', error);
      showFeedback('error', 'Failed to load contacts');
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

  // Open chat - UPDATED VERSION
  const openChat = async (userId: string, friendName: string) => {
    if (!currentUser) {
      showFeedback('error', 'Please login to start a chat');
      navigate('/login');
      return;
    }

    setOpeningChat(userId);

    try {
      console.log('Opening chat with user:', userId, 'Current user:', currentUser.id);
      
      // Send heartbeat before opening chat (non-critical)
      try {
        await supabase.rpc('heartbeat', { user_id: currentUser.id });
      } catch (heartbeatError) {
        console.log('Heartbeat not critical:', heartbeatError);
      }
      
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
        showFeedback('error', 'Failed to start chat: No conversation data returned');
        return;
      }

      const conversationId = data[0].conversation_id;
      const createdNew = data[0].created_new;

      console.log('Conversation result:', { conversationId, createdNew });

      if (createdNew) {
        try {
          await supabase
            .from('messages')
            .insert([
              {
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: `Started a conversation with ${friendName}`,
                is_read: true,
                created_at: new Date().toISOString()
              }
            ]);
          console.log('Initial message created');
        } catch (error) {
          console.log('Note: Could not create initial message:', error);
        }
      }

      // Close modal and navigate
      setIsNewChatOpen(false);
      setFriendSearch("");
      
      // Add a small delay to ensure state updates and modal closes
      setTimeout(() => {
        navigate(`/messages/chat/${conversationId}`);
      }, 100);

    } catch (error: any) {
      console.error('Error opening chat:', error);
      showFeedback('error', error.message || 'Failed to open chat. Please try again.');
    } finally {
      setOpeningChat(null);
    }
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

  // Manual refresh
  const handleRefresh = async () => {
    if (currentUser) {
      setLoading(true);
      await fetchAllData(currentUser.id);
      showFeedback('success', 'Messages refreshed');
    }
  };

  // Retry connection
  const handleRetry = () => {
    setConnectionError(null);
    setLoading(true);
    if (currentUser) {
      fetchAllData(currentUser.id);
    } else {
      window.location.reload();
    }
  };

  // Connection error state
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Connection Error</h3>
          <p className="text-gray-600 text-sm mb-2">{connectionError}</p>
          <p className="text-gray-500 text-xs mb-6">
            This might be due to network issues or server problems.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95 border border-gray-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  // If no current user but loading is false
  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 text-sm mb-6">Please login to access your messages</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md"
          >
            Go to Login
          </button>
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
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {onlineFriendsCount} online
                  </span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                className="p-3 bg-gray-100 rounded-2xl text-gray-700 hover:bg-gray-200 active:scale-95 transition-all"
                title="Refresh"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                title="New Message"
                disabled={loading}
              >
                <MessageSquarePlus size={22} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group mt-4">
            <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
              <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            </div>
            <input
              type="text"
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
              placeholder="Search messages, people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                activeFilter === 'unread'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={loading}
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
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
                  <div className="text-xs text-gray-600">Chats</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
                  <div className="text-xs text-gray-600">Unread</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{friends.length}</div>
                  <div className="text-xs text-gray-600">Contacts</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{onlineFriendsCount}</div>
                  <div className="text-xs text-gray-600">Online</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Last updated: {formatTimeAgo(lastUpdated.toISOString())}</span>
                  <span className="flex items-center gap-1">
                    <Wifi size={12} className="text-green-500" />
                    <span>Live updates active</span>
                  </span>
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
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md disabled:opacity-50"
                disabled={loading}
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
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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
                              {conv.with_user.status === 'online' && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-md flex items-center gap-1">
                                  <Wifi size={8} />
                                  Online
                                </span>
                              )}
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
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {friends.filter(f => f.is_friend).length > 0 
                          ? `${friends.filter(f => f.is_friend).length} connections` 
                          : `${friends.length} members available`}
                      </p>
                      {onlineFriendsCount > 0 && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Wifi size={10} />
                          {onlineFriendsCount} online
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => !openingChat && setIsNewChatOpen(false)}
                    className="p-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
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
                          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
                          disabled={openingChat !== null}
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
                              {friend.is_online && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                                  <Wifi size={6} className="text-white" />
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
                                {friend.is_online ? (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <Wifi size={10} />
                                    Online
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <WifiOff size={10} />
                                    Offline
                                  </span>
                                )}
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
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm border border-gray-200 flex items-center justify-center gap-2 disabled:opacity-50"
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