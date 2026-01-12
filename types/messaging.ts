export interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string; // Add this line
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
}

export interface ConnectedUser {
  user_id: string;
  full_name: string;
  avatar_url: string;
  last_seen: string;
}