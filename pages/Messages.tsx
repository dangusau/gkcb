import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, User } from 'lucide-react';
import { useMarketplace } from '../hooks/useMarketplace';
import { Conversation } from '../types/marketplace';
import { formatTimeAgo } from '../utils/formatters';

const Messages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  
  const { conversations, loading, getConversations } = useMarketplace();

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    // Send message logic here
    console.log('Sending message:', messageInput);
    setMessageInput('');
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-600">Start a conversation with a seller or buyer.</p>
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map((conversation) => (
            <div
              key={`${conversation.listing_id}-${conversation.other_user_id}`}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.listing_id === conversation.listing_id &&
                selectedConversation?.other_user_id === conversation.other_user_id
                  ? 'bg-blue-50'
                  : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {conversation.other_user_name?.charAt(0) || 'U'}
                </div>
                {conversation.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 truncate">
                    {conversation.other_user_name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(conversation.last_message_at)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 truncate">
                  {conversation.listing_title}
                </p>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-700 truncate flex-1">
                    {conversation.last_message || 'No messages yet'}
                  </p>
                  <span className="text-sm font-bold text-blue-600 ml-2">
                    ₦{conversation.listing_price?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Chat Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-2"
            >
              ←
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {selectedConversation.other_user_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{selectedConversation.other_user_name}</h3>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Sample messages - replace with real data */}
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 max-w-xs">
                <p>Is this item still available?</p>
                <span className="text-xs text-gray-500 mt-1 block">10:30 AM</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 max-w-xs">
                <p>Yes, it's available. Are you interested?</p>
                <span className="text-xs text-blue-200 mt-1 block">10:32 AM</span>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="sticky bottom-0 bg-white border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-3 border rounded-full focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="px-4 bg-blue-600 text-white rounded-full disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;