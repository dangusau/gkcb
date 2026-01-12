import { supabase } from './client';
import { Conversation, Message, ConnectedUser } from '../../types/messaging';

export const messagingService = {
  // Get user conversations
  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase.rpc('get_user_conversations');
    if (error) throw error;
    return data || [];
  },

  // Get or create conversation
  async getOrCreateConversation(otherUserId: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: otherUserId
    });
    if (error) throw error;
    return data;
  },

  // Send message
  async sendMessage(
    conversationId: string, 
    content: string, 
    type: 'text' | 'image' | 'video' | 'audio' = 'text',
    mediaUrl?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_content: content,
      p_type: type,
      p_media_url: mediaUrl || null
    });
    if (error) throw error;
    return data;
  },

  // Get conversation messages
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId
    });
    if (error) throw error;
    return data || [];
  },

  // Get connected users for search
  async getConnectedUsers(search?: string): Promise<ConnectedUser[]> {
    const { data, error } = await supabase.rpc('get_connected_users', {
      p_search: search || null
    });
    if (error) throw error;
    return data || [];
  },

  // Subscribe to new messages - SIMPLIFIED VERSION
  subscribeToMessages(callback: (message: Message) => void) {
    return supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        (payload) => {
          console.log('Messaging service received:', payload);
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },

  // Subscribe to conversation updates
  subscribeToConversations(callback: (conversation: Conversation) => void) {
    return supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          // You might want to fetch updated conversation here
        }
      )
      .subscribe();
  }
};