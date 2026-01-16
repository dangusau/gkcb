import { supabase } from '../supabase/client';
import { Message, Conversation, PendingMessage, MessageType } from '../../types/messaging';

class MessagingService {
  // Get conversations for the current user
  async getConversations(context?: 'connection' | 'marketplace'): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the PostgreSQL function
      const { data, error } = await supabase.rpc('get_user_conversations', {
        p_user_id: user.id,
        p_context: context || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get or create a conversation
  async getOrCreateConversation(
    otherUserId: string,
    context: 'connection' | 'marketplace' = 'connection',
    listingId?: string
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the PostgreSQL function
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user1_id: user.id,
        p_user2_id: otherUserId,
        p_context: context,
        p_listing_id: listingId || null
      });

      if (error) throw error;
      return data[0].conversation_id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Mark messages as read
      await this.markMessagesAsRead(conversationId);

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    type: MessageType = 'text',
    mediaFile?: File
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let mediaUrl: string | null = null;

      // Upload media if provided
      if (mediaFile) {
        mediaUrl = await this.uploadMedia(conversationId, mediaFile);
      }

      // Insert message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          type,
          content: type === 'text' ? content : null,
          media_url: mediaUrl
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload media file
  private async uploadMedia(conversationId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;
      const filePath = `chat-media/${fileName}`;

      // Compress image if it's an image
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await this.compressImage(file);
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Compress image for mobile
  private async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/webp',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/webp',
            quality
          );
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Subscribe to new messages in a specific conversation
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    console.log(`🔔 Setting up message subscription for conversation: ${conversationId}`);
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('📨 New message received in subscription:', payload.new.id);
          callback(payload.new as Message);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Message subscription status for ${conversationId}:`, status);
      });

    return () => {
      console.log(`🔕 Unsubscribing from messages for conversation: ${conversationId}`);
      supabase.removeChannel(channel);
    };
  }

  // Subscribe to conversation updates (optimized version)
  subscribeToConversations(callback: () => void): () => void {
    console.log('🔔 Setting up conversation subscriptions...');
    
    let unsubscribe = () => {
      console.log('🔕 Cleanup called before subscription was ready');
    };
    
    // Track processed IDs to avoid duplicate callbacks
    let processedMessageIds = new Set<string>();
    let processedConversationIds = new Set<string>();
    
    // Get user and set up subscription asynchronously
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        console.error('No user found for conversation subscription');
        return;
      }
      
      console.log(`📡 Subscribing to conversations for user: ${user.id}`);
      
      // Clear old sets
      processedMessageIds.clear();
      processedConversationIds.clear();
      
      const channel = supabase
        .channel(`user-conversations:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            const messageId = payload.new.id;
            
            // Skip if we've already processed this message
            if (processedMessageIds.has(messageId)) {
              console.log('⏭️ Skipping duplicate message:', messageId);
              return;
            }
            
            processedMessageIds.add(messageId);
            console.log('📨 New message detected in conversations:', messageId);
            
            // Check if this message belongs to user's conversation
            if (payload.new && payload.new.conversation_id) {
              const { data: conversation } = await supabase
                .from('conversations')
                .select('user1_id, user2_id')
                .eq('id', payload.new.conversation_id)
                .single();
              
              if (conversation && (conversation.user1_id === user.id || conversation.user2_id === user.id)) {
                console.log('🔄 Triggering callback for new message in user conversation');
                callback();
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          (payload) => {
            const conversationId = payload.new.id;
            
            // Skip if we've already processed this conversation update
            if (processedConversationIds.has(conversationId)) {
              console.log('⏭️ Skipping duplicate conversation update:', conversationId);
              return;
            }
            
            processedConversationIds.add(conversationId);
            
            // Check if this conversation involves the current user
            if (payload.new && (payload.new.user1_id === user.id || payload.new.user2_id === user.id)) {
              console.log('🔄 Conversation updated:', conversationId);
              callback();
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Conversation subscription status:', status);
        });
      
      // Cleanup old IDs periodically to prevent memory leak
      const cleanupInterval = setInterval(() => {
        if (processedMessageIds.size > 1000) {
          console.log('🧹 Cleaning up processed message IDs');
          processedMessageIds.clear();
        }
        if (processedConversationIds.size > 100) {
          console.log('🧹 Cleaning up processed conversation IDs');
          processedConversationIds.clear();
        }
      }, 60000); // Cleanup every minute
      
      unsubscribe = () => {
        console.log('🔕 Unsubscribing from conversations');
        clearInterval(cleanupInterval);
        supabase.removeChannel(channel);
      };
    }).catch(error => {
      console.error('Error setting up conversation subscription:', error);
    });
    
    // Return cleanup function
    return () => {
      unsubscribe();
    };
  }

  // Optimistic update helper for conversations list
  async updateConversationOptimistically(conversationId: string, newMessage: Partial<Message>) {
    // This would be used to update the local state optimistically
    // before the server confirms the update
    console.log('⚡ Performing optimistic update for conversation:', conversationId);
    
    // In a real implementation, this would update a local cache
    // For now, we'll just log it
    return true;
  }

  // Get unread count across all conversations
  async getTotalUnreadCount(): Promise<number> {
    try {
      const conversations = await this.getConversations();
      return conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const messagingService = new MessagingService();