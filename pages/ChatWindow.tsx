import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, Mic, MoreVertical, Smile } from 'lucide-react';
import { messagingService } from '../services/supabase/messaging';
import { supabase } from '../services/supabase/client';
import { Message } from '../types/messaging';
import { formatTimeAgo } from '../utils/formatters';
import { isUserOnline, formatLastSeen, updateLastSeen } from '../utils/onlineStatus';

const ChatWindow: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const otherUser = location.state?.otherUser || {
    id: '',
    name: 'Unknown User',
    avatar: '',
    last_seen: null
  };

  useEffect(() => {
    // Get current user ID
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();

    if (conversationId) {
      loadMessages();
      setupRealtime();
      updateLastSeen();
      fetchUserStatus();
      setupStatusSubscription();
    }
    
    // Set up activity listeners to update last seen
    const updateOnActivity = () => {
      updateLastSeen();
    };
    
    window.addEventListener('click', updateOnActivity);
    window.addEventListener('keypress', updateOnActivity);
    
    return () => {
      window.removeEventListener('click', updateOnActivity);
      window.removeEventListener('keypress', updateOnActivity);
    };
  }, [conversationId, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getMessages(conversationId!);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    if (!otherUser.id) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('last_seen')
        .eq('id', otherUser.id)
        .single();
      
      if (data) {
        setLastSeen(data.last_seen);
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const setupStatusSubscription = () => {
    if (!otherUser.id) return;
    
    const channel = supabase
      .channel(`user-status-${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${otherUser.id}`
        },
        (payload) => {
          if (payload.new.last_seen) {
            setLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  };

  const setupRealtime = () => {
    if (!conversationId) return;

    console.log('🔔 Setting up realtime for conversation:', conversationId);
    
    // Direct Supabase subscription (more reliable)
    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('📨 New message received:', payload.new);
          // Fetch fresh messages instead of optimistic update
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from conversation:', conversationId);
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      setSending(true);
      const messageId = await messagingService.sendMessage(conversationId, newMessage.trim());
      console.log('Message sent with ID:', messageId);
      
      setNewMessage('');
      updateLastSeen();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft size={24} />
          </button>
          <div className="w-8 h-8 bg-gray-200 rounded-full ml-3"></div>
          <div className="ml-3">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 mr-2">
            <ArrowLeft size={24} />
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
            {otherUser.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {otherUser.name?.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="ml-3">
            <h2 className="font-bold">{otherUser.name}</h2>
            <p className="text-xs text-gray-500">
              {isUserOnline(lastSeen) ? 'Online' : formatLastSeen(lastSeen)}
            </p>
          </div>
        </div>
        
        <button className="p-2">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">No messages yet</h3>
            <p className="text-gray-600">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'flex flex-col items-end' : ''}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                    }`}
                  >
                    {message.type === 'text' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : message.type === 'image' ? (
                      <img
                        src={message.media_url!}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto"
                      />
                    ) : null}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(message.created_at)}
                    </span>
                    {isOwn && (
                      <span className="text-xs">
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="sticky bottom-0 bg-white border-t p-4">
        <div className="flex items-center gap-2">
          <button type="button" className="p-2 text-gray-500 hover:text-gray-700">
            <Image size={24} />
          </button>
          
          <button type="button" className="p-2 text-gray-500 hover:text-gray-700">
            <Smile size={24} />
          </button>
          
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {newMessage.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          ) : (
            <button type="button" className="p-3 text-gray-500 hover:text-gray-700">
              <Mic size={24} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;