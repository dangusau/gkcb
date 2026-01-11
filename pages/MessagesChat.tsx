import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon,
  File,
  Paperclip,
  Mic,
  X,
  AlertCircle,
  Check,
  CheckCheck,
  Trash2,
  Loader2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { createMessageNotification } from '../utils/notificationUtils'; // Added import

type Message = {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  conversation_id: string;
  media_url?: string;
  media_type?: 'image' | 'file' | 'audio' | 'video';
  file_name?: string;
  file_size?: number;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
};

type ConversationDetails = {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  other_user?: {
    id: string;
    name: string;
    avatar_url?: string;
    status: 'online' | 'offline';
  };
};

type MediaFile = {
  file: File;
  type: 'image' | 'file' | 'audio' | 'video';
  preview?: string;
};

const MessagesChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
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

        // Load conversation and messages
        await Promise.all([
          fetchConversationDetails(user.id),
          fetchMessages()
        ]);

        // Set up real-time subscription for new messages
        setupRealtimeSubscription();

      } catch (err) {
        console.error('Error initializing chat:', err);
        setError('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      initialize();
    }

    // Cleanup
    return () => {
      const channel = supabase.channel('chat-messages');
      channel.unsubscribe();
      
      // Clean up media previews
      mediaFiles.forEach(file => {
        if (file.preview && file.type === 'image') {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [conversationId, navigate]);

  // Fetch conversation details
  const fetchConversationDetails = async (userId: string) => {
    try {
      // First get the conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        throw convError;
      }

      if (!convData) {
        setError('Conversation not found');
        return;
      }

      setConversation(convData);

      // Get the other user's details
      const otherUserId = convData.participant_1 === userId ? convData.participant_2 : convData.participant_1;
      
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, last_seen')
        .eq('id', otherUserId)
        .single();

      if (userError) {
        console.error('Error fetching other user:', userError);
        throw userError;
      }

      const otherUser = {
        id: userData.id,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
        avatar_url: userData.avatar_url,
        status: userData.last_seen && new Date(userData.last_seen) > new Date(Date.now() - 5 * 60 * 1000) 
          ? 'online' as const 
          : 'offline' as const
      };

      setOtherUser(otherUser);

    } catch (error) {
      console.error('Error in fetchConversationDetails:', error);
      setError('Failed to load conversation details');
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Mark messages as read
      const unreadMessages = data?.filter(msg => 
        !msg.is_read && msg.sender_id !== currentUser?.id
      ) || [];

      if (unreadMessages.length > 0) {
        await markMessagesAsRead(unreadMessages.map(msg => msg.id));
      }

      // Format messages
      const formattedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        created_at: formatMessageTime(msg.created_at)
      }));

      setMessages(formattedMessages);

      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);

    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setError('Failed to load messages');
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Set up real-time subscription - FIXED VERSION
  const setupRealtimeSubscription = () => {
    const channel = supabase.channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Format the new message
          const newMsg: Message = {
            ...payload.new as Message,
            created_at: formatMessageTime(payload.new.created_at)
          };

          // Add to messages
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            if (prev.some(msg => msg.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== currentUser?.id) {
            await markMessagesAsRead([newMsg.id]);
            
            // Update the message in state to show as read
            setMessages(prev => prev.map(msg => 
              msg.id === newMsg.id ? { ...msg, is_read: true } : msg
            ));
          }

          // Scroll to bottom
          setTimeout(scrollToBottom, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          
          // Update message in state (for read receipts)
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          ));
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chat updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to chat updates');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  };

  // Upload file to Supabase storage
  const uploadFile = async (file: File, type: 'image' | 'file' | 'audio' | 'video'): Promise<string | null> => {
    try {
      const bucketMap = {
        image: 'chat-images',
        file: 'chat-files',
        audio: 'chat-audio',
        video: 'chat-video'
      };

      const bucket = bucketMap[type];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${conversationId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && mediaFiles.length === 0) || !currentUser || !conversationId || sending || uploading) return;

    try {
      setSending(true);
      setUploading(true);

      let mediaUrl: string | null = null;
      let mediaType: 'image' | 'file' | 'audio' | 'video' | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileSize: number | undefined = undefined;

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const mediaFile = mediaFiles[0];
        fileName = mediaFile.file.name;
        fileSize = mediaFile.file.size;
        mediaType = mediaFile.type;
        
        mediaUrl = await uploadFile(mediaFile.file, mediaFile.type);
        
        // Clean up preview URL
        if (mediaFile.preview) {
          URL.revokeObjectURL(mediaFile.preview);
        }
        
        // Clear media files
        setMediaFiles([]);
      }

      // Prepare message content
      const messageContent = newMessage.trim() || 
        (mediaType === 'image' ? '📷 Sent an image' : 
         mediaType === 'video' ? '🎥 Sent a video' : 
         mediaType === 'audio' ? '🎤 Sent an audio' : '📎 Sent a file');

      const messageData: any = {
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: messageContent,
        is_read: false,
        created_at: new Date().toISOString()
      };

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }
      if (fileName) messageData.file_name = fileName;
      if (fileSize) messageData.file_size = fileSize;

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Clear input
      setNewMessage('');

      // Focus input again
      inputRef.current?.focus();

      // Add message to local state immediately for better UX
      const newMsg: Message = {
        ...data,
        created_at: formatMessageTime(data.created_at)
      };
      
      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);

      // After sending message successfully
      if (otherUser && conversationId && currentUser) {
        // Create notification for the other user
        await createMessageNotification(
          otherUser.id,
          currentUser.id,
          conversationId,
          messageContent
        );
      }

    } catch (error) {
      console.error('Error in sendMessage:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const mediaType = type === 'image' && file.type.startsWith('image/') ? 'image' : 
                     type === 'image' ? 'file' : 'file';

    // Create preview for images
    let preview: string | undefined;
    if (mediaType === 'image') {
      preview = URL.createObjectURL(file);
    }

    setMediaFiles([{ file, type: mediaType, preview }]);
    
    // Clear file input
    e.target.value = '';
  };

  // Remove media file
  const removeMediaFile = (index: number) => {
    const file = mediaFiles[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      
      const audioChunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setMediaFiles([{ file: audioFile, type: 'audio' }]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Microphone access denied');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    setIsRecording(false);
    setRecordingTime(0);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      // If today, show time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }).toLowerCase();
      }
      
      // If yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // Otherwise show date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Just now';
    }
  };

  // Format date header
  const formatDateHeader = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Today';
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === now.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Today';
    }
  };

  // Get unique dates for grouping messages
  const getMessageDates = () => {
    const dates = new Set<string>();
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toDateString();
      dates.add(date);
    });
    return Array.from(dates);
  };

  // Get messages for a specific date
  const getMessagesForDate = (dateString: string) => {
    return messages.filter(msg => 
      new Date(msg.created_at).toDateString() === dateString
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle back
  const handleBack = () => {
    navigate('/messages');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center safe-area px-4 max-w-screen-sm mx-auto">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Error</h3>
          <p className="text-gray-600 text-sm mb-2">{error}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95"
            >
              Back to Messages
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-3 rounded-xl transition-all active:scale-95 border border-gray-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const messageDates = getMessageDates();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-area max-w-screen-sm mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                  {otherUser?.avatar_url ? (
                    <img 
                      src={otherUser.avatar_url} 
                      alt={otherUser?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = otherUser?.name?.substring(0, 2).toUpperCase() || 'U';
                          parent.className = "w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden";
                        }
                      }}
                    />
                  ) : (
                    otherUser?.name?.substring(0, 2).toUpperCase() || 'U'
                  )}
                </div>
                {otherUser?.status === 'online' && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div>
                <h2 className="font-bold text-gray-900">{otherUser?.name || 'User'}</h2>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${otherUser?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-500">
                    {otherUser?.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50"
      >
        {messageDates.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-600 text-sm max-w-xs">
              Send your first message to {otherUser?.name || 'this user'}
            </p>
          </div>
        ) : (
          messageDates.map((dateString) => {
            const dateMessages = getMessagesForDate(dateString);
            const displayDate = formatDateHeader(dateMessages[0]?.created_at || new Date().toISOString());
            
            return (
              <div key={dateString} className="space-y-4">
                {/* Date header */}
                <div className="flex items-center justify-center">
                  <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                    {displayDate}
                  </div>
                </div>
                
                {/* Messages for this date */}
                {dateMessages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUser?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${isCurrentUser ? 'ml-4' : 'mr-4'}`}>
                        {!isCurrentUser && (
                          <div className="flex items-center gap-2 mb-1 ml-2">
                            <span className="text-xs font-medium text-gray-700">
                              {otherUser?.name || 'User'}
                            </span>
                          </div>
                        )}
                        
                        <div className={`rounded-2xl px-4 py-2.5 ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
                          {/* Media content */}
                          {message.media_url && message.media_type === 'image' && (
                            <div className="mb-2">
                              <img 
                                src={message.media_url} 
                                alt="Shared image"
                                className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="bg-gray-200 rounded-lg p-4 text-center"><p class="text-sm text-gray-600">Image failed to load</p></div>';
                                  }
                                }}
                              />
                            </div>
                          )}
                          
                          {message.media_url && (message.media_type === 'file' || message.media_type === 'audio' || message.media_type === 'video') && (
                            <div className="mb-2 bg-white/20 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <File className="w-5 h-5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {message.file_name || 'File'}
                                  </p>
                                  {message.file_size && (
                                    <p className="text-xs opacity-80">
                                      {formatFileSize(message.file_size)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Text content */}
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start ml-2'}`}>
                          <span className="text-xs text-gray-400">
                            {message.created_at}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-gray-400">
                              {message.is_read ? (
                                <CheckCheck size={12} className="inline" />
                              ) : (
                                <Check size={12} className="inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media preview */}
      {mediaFiles.length > 0 && !isRecording && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {mediaFiles[0].type === 'image' ? 'Image' : 
               mediaFiles[0].type === 'audio' ? 'Audio recording' : 'File'} ready to send
            </span>
            <button
              onClick={() => removeMediaFile(0)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          
          {mediaFiles[0].type === 'image' && mediaFiles[0].preview && (
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={mediaFiles[0].preview} 
                alt="Preview" 
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          
          {mediaFiles[0].type === 'audio' && (
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Audio recording</p>
                  <p className="text-xs text-gray-500">
                    {Math.floor(mediaFiles[0].file.size / 1024)} KB
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {mediaFiles[0].type === 'file' && (
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {mediaFiles[0].file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(mediaFiles[0].file.size)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium text-red-700">Recording...</p>
                <p className="text-xs text-red-600">
                  {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelRecording}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={stopRecording}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="*"
            onChange={(e) => handleFileSelect(e, 'file')}
          />
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          
          {/* File attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            disabled={uploading || sending || isRecording}
            title="Attach file"
          >
            <Paperclip size={20} className="text-gray-500" />
          </button>
          
          {/* Image attachment button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            disabled={uploading || sending || isRecording}
            title="Attach image"
          >
            <ImageIcon size={20} className="text-gray-500" />
          </button>
          
          {/* Audio recording button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2.5 rounded-full transition-colors disabled:opacity-50 ${
              isRecording ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-100'
            }`}
            disabled={uploading || sending}
            title={isRecording ? 'Stop recording' : 'Record audio'}
          >
            <Mic size={20} className={isRecording ? 'text-red-600' : 'text-gray-500'} />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-gray-100 border-none rounded-full py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-12 disabled:opacity-50"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={uploading || sending || isRecording}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && mediaFiles.length === 0) || sending || uploading || isRecording}
            className={`p-3 rounded-full transition-all ${
              (newMessage.trim() || mediaFiles.length > 0) && !sending && !uploading && !isRecording
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {sending || uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagesChat;