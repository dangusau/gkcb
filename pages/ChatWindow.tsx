import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Image as ImageIcon, Mic, MoreVertical,
  Paperclip, Camera, X, ShoppingBag, ExternalLink,
  Check, CheckCheck
} from 'lucide-react';
import { messagingService } from '../services/supabase/messaging';
import { supabase } from '../services/supabase/client';
import { Message, MessageType } from '../types/messaging';
import { formatTimeAgo } from '../utils/formatters';

const ChatWindow: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  
  const otherUser = location.state?.otherUser || {
    id: '',
    name: 'Unknown User',
    avatar: ''
  };
  
  const context = location.state?.context || 'connection';
  const listing = location.state?.listing || null;

  // Load messages and setup realtime ONCE
  useEffect(() => {
    let isMounted = true;
    
    const initializeChat = async () => {
      try {
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          setCurrentUserId(user.id);
        }
        
        if (conversationId && isMounted) {
          // Load messages
          setLoading(true);
          const data = await messagingService.getMessages(conversationId);
          if (isMounted) {
            setMessages(data);
            setLoading(false);
          }
          
          // Setup realtime subscription
          const unsubscribe = messagingService.subscribeToMessages(
            conversationId,
            (newMessage) => {
              if (isMounted) {
                setMessages(prev => [...prev, newMessage]);
                scrollToBottom();
              }
            }
          );
          
          return unsubscribe;
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    const cleanupPromise = initializeChat();
    
    return () => {
      isMounted = false;
      cleanupPromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      }).catch(console.error);
    };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      await messagingService.sendMessage(conversationId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleMediaUpload = async (file: File) => {
    if (!conversationId || uploading) return;
    
    try {
      setUploading(true);
      let type: MessageType = 'text';
      
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }
      
      await messagingService.sendMessage(
        conversationId,
        file.name,
        type,
        file
      );
      
      setShowMediaOptions(false);
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMediaUpload(file);
    }
    event.target.value = '';
  };

  const handleProfileClick = () => {
    navigate(`/profile/${otherUser.id}`);
  };

  const handleViewListing = () => {
    if (listing?.id) {
      navigate(`/marketplace/listing/${listing.id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="p-4 flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="ml-3">
              <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className={`h-12 bg-gray-200 rounded-2xl ${
                i % 2 === 0 ? 'w-3/4 ml-auto' : 'w-2/3'
              }`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0">
                  {otherUser.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {otherUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 truncate">{otherUser.name}</h2>
                  <p className="text-xs text-gray-500 truncate">
                    {context === 'marketplace' ? 'Product conversation' : 'Direct message'}
                  </p>
                </div>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {context === 'marketplace' && listing && (
                <button
                  onClick={handleViewListing}
                  className="flex items-center gap-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">View Product</span>
                  <span className="sm:hidden">View</span>
                </button>
              )}
              
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {context === 'marketplace' && listing && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">{listing.title}</p>
                {listing.price && (
                  <p className="text-green-600 font-bold text-sm">${listing.price}</p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">No messages yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              {context === 'marketplace' 
                ? `Start the conversation about ${listing?.title || 'this product'}`
                : 'Send a message to start the conversation'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
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
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      } ${message.type !== 'text' ? 'p-2' : ''}`}
                    >
                      {message.type === 'text' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : message.type === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={message.media_url!}
                            alt="Shared image"
                            className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                            loading="lazy"
                          />
                          {message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      ) : message.type === 'video' ? (
                        <div className="space-y-2">
                          <video
                            src={message.media_url!}
                            controls
                            className="rounded-lg max-w-full h-auto max-h-64"
                          />
                          {message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      ) : message.type === 'audio' ? (
                        <div className="space-y-2">
                          <audio
                            src={message.media_url!}
                            controls
                            className="w-full"
                          />
                          {message.content && (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className="text-xs">
                          {message.is_read ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Media Options Modal */}
      {showMediaOptions && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Share Media</h3>
              <button
                onClick={() => setShowMediaOptions(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Gallery</span>
              </button>
              
              <button
                onClick={() => {/* Open camera */}}
                className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Camera</span>
              </button>
              
              <button
                onClick={() => {/* Open files */}}
                className="flex flex-col items-center justify-center p-4 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
                  <Paperclip className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*"
        className="hidden"
      />

      {/* Fixed Message Input */}
      <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <form onSubmit={handleSendMessage} className="p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMediaOptions(true)}
              disabled={uploading}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>
            
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full p-3 px-4 bg-gray-100 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            
            {newMessage.trim() ? (
              <button
                type="submit"
                disabled={sending}
                className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 min-w-[44px] flex items-center justify-center"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;