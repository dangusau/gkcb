import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { messagingService } from '../services/supabase/messaging';
import { Conversation } from '../types/messaging';
import { formatTimeAgo } from '../utils/formatters';

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadConversations();
    setupRealtime();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    messagingService.subscribeToMessages(() => {
      loadConversations(); // Refresh on new message
    });
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Messages</h1>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {totalUnread} unread
            </span>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="p-2">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">Start a conversation with a friend!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <Link
                key={conversation.conversation_id}
                to={`/messages/${conversation.conversation_id}`}
                state={{ otherUser: {
                  id: conversation.other_user_id,
                  name: conversation.other_user_name,
                  avatar: conversation.other_user_avatar
                }}}
                className="block bg-white p-4 hover:bg-gray-50 border-b"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                      {conversation.other_user_avatar ? (
                        <img
                          src={conversation.other_user_avatar}
                          alt={conversation.other_user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold">
                          {conversation.other_user_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 truncate">
                        {conversation.other_user_name}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimeAgo(conversation.last_message_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      {conversation.unread_count > 0 ? (
                        <Check className="text-blue-500" size={16} />
                      ) : (
                        <CheckCheck className="text-gray-400" size={16} />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Conversation Button */}
      <Link
        to="/messages/new"
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
      >
        <MessageCircle size={24} />
      </Link>
    </div>
  );
};

export default Conversations;