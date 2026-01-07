import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Mic, Send, Image as ImageIcon, Camera, FileText, X, Play, Pause, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  type?: string;
  media_url?: string;
  duration?: string;
};

type User = {
  id: string;
  name: string;
  avatar_url?: string;
  online?: boolean;
};

const ChatSession = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug logging function
  const logDebug = (message: string) => {
    console.log(`[Chat Debug] ${message}`);
    setDebugInfo(prev => `${prev}\n${new Date().toISOString()}: ${message}`);
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        logDebug('Getting current user...');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          logDebug(`Auth error: ${error.message}`);
          return;
        }
        logDebug(`Current user ID: ${user?.id}`);
        setCurrentUser(user);
      } catch (error) {
        logDebug(`Get user error: ${error}`);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (conversationId && currentUser) {
      logDebug(`Loading conversation: ${conversationId}`);
      logDebug(`Current user: ${currentUser.id}`);
      loadConversation();
      
      // Subscribe to new messages
      const subscription = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            logDebug(`New message received: ${payload.new.id}`);
            setMessages(prev => [...prev, payload.new as Message]);
            if (payload.new.sender_id !== currentUser.id) {
              markMessageAsRead(payload.new.id);
            }
          }
        )
        .subscribe();

      return () => {
        logDebug('Cleaning up subscription');
        subscription.unsubscribe();
      };
    }
  }, [conversationId, currentUser]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      logDebug('=== Starting loadConversation ===');
      
      if (!conversationId) {
        logDebug('ERROR: No conversationId provided');
        throw new Error('No conversation ID');
      }
      
      if (!currentUser?.id) {
        logDebug('ERROR: No current user');
        throw new Error('No current user');
      }
      
      // METHOD 1: Simple query first (to debug)
      logDebug('1. Fetching conversation basic info...');
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (convError) {
        logDebug(`Conversation fetch error: ${convError.message}`);
        throw convError;
      }
      
      if (!conversation) {
        logDebug('ERROR: Conversation not found');
        throw new Error('Conversation not found');
      }
      
      logDebug(`Conversation found: ${conversation.id}`);
      logDebug(`Participant 1: ${conversation.participant_1}`);
      logDebug(`Participant 2: ${conversation.participant_2}`);
      
      // Determine the other participant ID
      const otherParticipantId = conversation.participant_1 === currentUser.id 
        ? conversation.participant_2 
        : conversation.participant_1;
      
      logDebug(`Other participant ID: ${otherParticipantId}`);
      
      // Get the other participant's profile
      logDebug('2. Fetching other participant profile...');
      const { data: otherParticipant, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', otherParticipantId)
        .single();
      
      if (profileError) {
        logDebug(`Profile fetch error: ${profileError.message}`);
        // Continue anyway with limited info
        setUser({
          id: otherParticipantId,
          name: 'Unknown User',
          online: true
        });
      } else if (otherParticipant) {
        logDebug(`Profile found: ${otherParticipant.first_name} ${otherParticipant.last_name}`);
        setUser({
          id: otherParticipant.id,
          name: `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || 'User',
          avatar_url: otherParticipant.avatar_url,
          online: true
        });
      }
      
      // Fetch messages
      logDebug('3. Fetching messages...');
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        logDebug(`Messages fetch error: ${messagesError.message}`);
        throw messagesError;
      }
      
      logDebug(`Found ${messagesData?.length || 0} messages`);
      setMessages(messagesData || []);
      
      // Mark unread messages as read
      const unreadMessages = messagesData?.filter(m => 
        !m.is_read && m.sender_id !== currentUser.id
      ) || [];
      
      logDebug(`Marking ${unreadMessages.length} messages as read...`);
      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }
      
      logDebug('=== loadConversation completed successfully ===');
      
    } catch (error: any) {
      logDebug(`ERROR in loadConversation: ${error.message}`);
      console.error('Error loading conversation:', error);
      // Still set loading to false to show error UI
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      if (error) {
        logDebug(`Mark read error: ${error.message}`);
        return;
      }
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error: any) {
      logDebug(`Mark read catch error: ${error.message}`);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Timer for recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !conversationId) return;
    
    try {
      setSending(true);
      logDebug(`Sending message: ${inputText.substring(0, 50)}...`);
      
      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: currentUser.id,
            content: inputText.trim(),
            is_read: false,
            type: 'text',
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        logDebug(`Send message error: ${error.message}`);
        throw error;
      }
      
      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      setMessages(prev => [...prev, message as Message]);
      setInputText("");
      logDebug('Message sent successfully');
      
    } catch (error: any) {
      logDebug(`Send error: ${error.message}`);
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  const handleAttachment = async (type: 'image' | 'doc') => {
    setShowAttachments(false);
    if (!currentUser || !conversationId) return;
    
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: currentUser.id,
            content: `Sent a ${type === 'image' ? 'photo' : 'document'}`,
            is_read: false,
            type: type,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      setMessages(prev => [...prev, message as Message]);
      
    } catch (error) {
      console.error('Error sending attachment:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Debug panel (remove in production)
  const DebugPanel = () => (
    <div className="fixed bottom-20 right-4 bg-black/80 text-white p-2 rounded-lg text-xs max-w-xs max-h-32 overflow-auto z-50">
      <div className="font-bold mb-1">Debug Info:</div>
      <pre className="whitespace-pre-wrap">{debugInfo}</pre>
    </div>
  );

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
          <p className="text-xs text-gray-400 mt-2">Conversation ID: {conversationId}</p>
          <DebugPanel />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={24} className="text-red-600" />
          </div>
          <p className="text-gray-600">Chat not found</p>
          <p className="text-xs text-gray-400 mt-2">ID: {conversationId}</p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Messages
          </button>
        </div>
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-primary-900/10 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 -ml-2 rounded-full text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">{user.name}</h3>
              <p className="text-[10px] text-green-600 font-medium">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="text-center text-[10px] text-gray-400 my-4 font-medium uppercase tracking-wider">Today</div>
        
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} className="text-blue-600" />
            </div>
            <p className="text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-500 mt-2">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUser?.id;
            return (
              <div 
                key={msg.id} 
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative
                    ${isOwnMessage 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none border border-primary-900/5'
                    }
                  `}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>

                  {msg.type === 'audio' && (
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <button className={`p-2 rounded-full ${isOwnMessage ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-600'}`}>
                        <Play size={16} className="ml-0.5" />
                      </button>
                      <div className="flex-1 space-y-1.5">
                        <div className={`h-1 rounded-full w-full ${isOwnMessage ? 'bg-white/30' : 'bg-gray-200'}`}>
                          <div className={`h-full w-1/3 rounded-full ${isOwnMessage ? 'bg-white' : 'bg-primary-500'}`}></div>
                        </div>
                        <span className={`text-[10px] block ${isOwnMessage ? 'text-primary-100' : 'text-gray-400'}`}>
                          {msg.duration || '0:30'}
                        </span>
                      </div>
                    </div>
                  )}

                  <span 
                    className={`
                      text-[9px] block text-right mt-1 font-medium
                      ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'}
                    `}
                  >
                    {formatMessageTime(msg.created_at)}
                    {!msg.is_read && !isOwnMessage && ' • Unread'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-primary-900/10 fixed bottom-0 left-0 right-0 z-20 pb-safe">
        {showAttachments && (
          <div className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-primary-900/10 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200">
            <button onClick={() => handleAttachment('image')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <ImageIcon size={18} />
              </div>
              <span className="text-sm font-bold">Gallery</span>
            </button>
            <button onClick={() => handleAttachment('image')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Camera size={18} />
              </div>
              <span className="text-sm font-bold">Camera</span>
            </button>
            <button onClick={() => handleAttachment('doc')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <FileText size={18} />
              </div>
              <span className="text-sm font-bold">Document</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAttachments(!showAttachments)}
            className={`p-2.5 rounded-full transition-colors ${showAttachments ? 'bg-gray-100 text-gray-800 rotate-45' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Plus size={24} />
          </button>

          {isRecording ? (
            <div className="flex-1 bg-red-50 rounded-2xl h-11 flex items-center px-4 justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-600 font-mono font-bold">{formatTime(recordingTime)}</span>
              </div>
              <span className="text-xs text-red-400 font-medium">Recording...</span>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-400 rounded-2xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={sending}
            />
          )}

          {(inputText.trim() && !isRecording) ? (
            <button 
              onClick={handleSend}
              disabled={sending}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          ) : (
            <button 
              onClick={handleVoiceRecord}
              className={`p-2.5 rounded-full shadow-lg active:scale-95 transition-all ${isRecording ? 'bg-red-500 text-white shadow-red-200 animate-pulse' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-200'}`}
            >
              {isRecording ? <Send size={20} className="ml-0.5" /> : <Mic size={20} />}
            </button>
          )}
        </div>
      </div>
      
      {showAttachments && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowAttachments(false)}
        ></div>
      )}
      
      {/* Debug panel - REMOVE IN PRODUCTION */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
};

export default ChatSession;