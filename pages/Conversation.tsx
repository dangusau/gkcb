import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react';
import { useMarketplace } from '../hooks/useMarketplace';
import { formatTimeAgo } from '../utils/formatters';

const Conversation: React.FC = () => {
  const { listingId, userId } = useParams<{ listingId: string; userId: string }>();
  const navigate = useNavigate();
  const { messages, getMessages, sendMessage } = useMarketplace();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listingId && userId) {
      loadMessages();
    }
  }, [listingId, userId]);

  const loadMessages = async () => {
    if (listingId && userId) {
      await getMessages(listingId, userId);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !listingId || !userId) return;

    try {
      setSending(true);
      await sendMessage(listingId, userId, newMessage.trim());
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold">Conversation</h2>
            <p className="text-sm text-gray-500">Marketplace</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === userId ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl p-3 ${
                message.sender_id === userId
                  ? 'bg-white border'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm">{message.message}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender_id === userId ? 'text-gray-500' : 'text-blue-200'
                }`}
              >
                {formatTimeAgo(message.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <ImageIcon size={20} />
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conversation;