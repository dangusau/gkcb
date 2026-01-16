import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MessageCircle, Check, CheckCheck, 
  Store, Users, Plus,
  ShoppingBag, RefreshCw, Bell
} from 'lucide-react';
import { messagingService } from '../services/supabase/messaging';
import { Conversation } from '../types/messaging';
import { formatTimeAgo } from '../utils/formatters';

const ConversationsList: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'marketplace'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [newMessageIndicator, setNewMessageIndicator] = useState<string | null>(null);
  
  // Use refs to track state without causing re-renders
  const conversationsRef = useRef<Conversation[]>([]);
  const isMounted = useRef(true);
  const realtimeCleanupRef = useRef<() => void>(() => {});
  
  useEffect(() => {
    isMounted.current = true;
    loadInitialConversations();
    
    return () => {
      isMounted.current = false;
      realtimeCleanupRef.current();
    };
  }, []);

  // Filter conversations when search or tab changes
  useEffect(() => {
    const filtered = conversations.filter(conv => {
      // Filter by tab
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'friends' && conv.context === 'connection') ||
        (activeTab === 'marketplace' && conv.context === 'marketplace');
      
      // Filter by search
      const matchesSearch = searchQuery === '' ||
        conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.listing_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
    
    setFilteredConversations(filtered);
  }, [conversations, searchQuery, activeTab]);

  const loadInitialConversations = async () => {
    try {
      console.log('📥 Loading initial conversations...');
      const data = await messagingService.getConversations();
      
      if (isMounted.current) {
        setConversations(data);
        conversationsRef.current = data;
        setLastUpdated(new Date());
        setInitialLoading(false);
        console.log('✅ Loaded initial conversations:', data.length);
        
        // Start realtime after initial load
        setupRealtime();
      }
    } catch (error) {
      console.error('❌ Error loading initial conversations:', error);
      if (isMounted.current) {
        setInitialLoading(false);
      }
    }
  };

  const loadConversationsInBackground = async (silent: boolean = true) => {
    if (!silent) {
      setBackgroundLoading(true);
    }
    
    try {
      console.log('🔄 Loading conversations in background...');
      const data = await messagingService.getConversations();
      
      if (isMounted.current) {
        // Check if there are new unread messages
        const oldUnreadTotal = conversationsRef.current.reduce((sum, conv) => sum + conv.unread_count, 0);
        const newUnreadTotal = data.reduce((sum, conv) => sum + conv.unread_count, 0);
        
        // If there are new unread messages, show a notification indicator
        if (newUnreadTotal > oldUnreadTotal) {
          setNewMessageIndicator('New messages');
          setTimeout(() => setNewMessageIndicator(null), 3000);
        }
        
        // Update conversations with smooth transition
        setConversations(prev => {
          // Only update if data actually changed
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            conversationsRef.current = data;
            return data;
          }
          return prev;
        });
        
        setLastUpdated(new Date());
        console.log('✅ Updated conversations in background');
      }
    } catch (error) {
      console.error('❌ Error loading conversations in background:', error);
    } finally {
      if (isMounted.current && !silent) {
        setBackgroundLoading(false);
      }
    }
  };

  const setupRealtime = () => {
    console.log('🔌 Setting up realtime connection...');
    setRealtimeStatus('connecting');
    
    // Set up realtime subscription
    const cleanup = messagingService.subscribeToConversations(() => {
      console.log('📨 Real-time update received');
      if (isMounted.current) {
        setRealtimeStatus('connected');
        
        // Load new data in background WITHOUT showing loading state
        loadConversationsInBackground(true);
      }
    });
    
    realtimeCleanupRef.current = cleanup;
    
    // Set a timeout to check connection status
    setTimeout(() => {
      if (isMounted.current && realtimeStatus === 'connecting') {
        setRealtimeStatus('disconnected');
        console.warn('⚠️ Realtime connection timeout, using polling');
        
        // Fallback to polling every 15 seconds
        const pollInterval = setInterval(() => {
          if (isMounted.current) {
            loadConversationsInBackground(true);
          }
        }, 15000);
        
        realtimeCleanupRef.current = () => {
          cleanup();
          clearInterval(pollInterval);
        };
      }
    }, 3000);
    
    return cleanup;
  };

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    loadConversationsInBackground(false);
  };

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  }, [conversations]);

  const friendsUnread = useMemo(() => {
    return conversations
      .filter(conv => conv.context === 'connection')
      .reduce((sum, conv) => sum + conv.unread_count, 0);
  }, [conversations]);

  const marketplaceUnread = useMemo(() => {
    return conversations
      .filter(conv => conv.context === 'marketplace')
      .reduce((sum, conv) => sum + conv.unread_count, 0);
  }, [conversations]);

  const handleStartNewConversation = () => {
    navigate('/messages/new');
  };

  const handleUserProfileClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  // Show initial loading only on first load
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Loading Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
          </div>
          
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Loading Tabs */}
        <div className="border-b border-gray-200 bg-white px-4">
          <div className="flex space-x-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-3">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Conversations */}
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Notification Indicator (shows briefly for new messages) */}
      {newMessageIndicator && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-10 duration-300">
          <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
            <Bell className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">{newMessageIndicator}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status Dot */}
            <div className={`w-2 h-2 rounded-full ${
              realtimeStatus === 'connected' ? 'bg-green-500' :
              realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
            
            <button
              onClick={handleManualRefresh}
              disabled={backgroundLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${backgroundLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleStartNewConversation}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[124px] bg-white border-b border-gray-200 z-10">
        <div className="flex px-4 space-x-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">All</span>
            {totalUnread > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'friends'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium">Friends</span>
            {friendsUnread > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {friendsUnread}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-2 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'marketplace'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="font-medium">Marketplace</span>
            {marketplaceUnread > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {marketplaceUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversations List with Smooth Updates */}
      <div className="p-3">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {activeTab === 'marketplace' ? (
                <Store className="w-8 h-8 text-gray-400" />
              ) : activeTab === 'friends' ? (
                <Users className="w-8 h-8 text-gray-400" />
              ) : (
                <MessageCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery ? 'No matches found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try a different search term'
                : activeTab === 'marketplace'
                  ? 'Start a conversation about a product'
                  : 'Connect with friends to start chatting'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleStartNewConversation}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              return (
                <Link
                  key={conversation.conversation_id}
                  to={`/messages/${conversation.conversation_id}`}
                  state={{ 
                    otherUser: {
                      id: conversation.other_user_id,
                      name: conversation.other_user_name,
                      avatar: conversation.other_user_avatar,
                    },
                    context: conversation.context,
                    listing: conversation.listing_id ? {
                      id: conversation.listing_id,
                      title: conversation.listing_title,
                      price: conversation.listing_price
                    } : null
                  }}
                  className="block bg-white rounded-2xl p-3 hover:shadow-md transition-all duration-200 border border-gray-100 active:scale-[0.99] hover:translate-x-1"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                        {conversation.other_user_avatar ? (
                          <img
                            src={conversation.other_user_avatar}
                            alt={conversation.other_user_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                            {conversation.other_user_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Unread Badge with Animation */}
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <h3 
                            onClick={(e) => handleUserProfileClick(e, conversation.other_user_id)}
                            className="font-bold text-gray-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {conversation.other_user_name}
                          </h3>
                          
                          {/* Context Badge */}
                          {conversation.context === 'marketplace' && (
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                              <ShoppingBag className="w-3 h-3" />
                              <span>Product</span>
                            </span>
                          )}
                        </div>
                        
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(conversation.last_message_at)}
                        </span>
                      </div>
                      
                      {/* Product Title (for marketplace) */}
                      {conversation.context === 'marketplace' && conversation.listing_title && (
                        <p className="text-sm text-gray-700 font-medium truncate mb-1">
                          {conversation.listing_title}
                          {conversation.listing_price && (
                            <span className="text-green-600 ml-2">
                              ${conversation.listing_price}
                            </span>
                          )}
                        </p>
                      )}
                      
                      {/* Last Message */}
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        
                        {/* Read Receipt */}
                        {conversation.unread_count > 0 ? (
                          <Check className="w-4 h-4 text-blue-500" />
                        ) : conversation.last_message ? (
                          <CheckCheck className="w-4 h-4 text-gray-400" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtle Loading Indicator (only shows on manual refresh) */}
      {backgroundLoading && (
        <div className="fixed bottom-20 right-4 z-30">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-gray-200">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-600">Updating...</span>
          </div>
        </div>
      )}

      {/* Start New Conversation FAB */}
      <button
        onClick={handleStartNewConversation}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add some Tailwind styles */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-in-from-top {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-in {
          animation: slide-in-from-top 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConversationsList;