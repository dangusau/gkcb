// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  is_pioneer: boolean;
  is_admin: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  owner_id: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  content: string;
  author_id: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// types.ts - Add these interfaces
export interface Activity {
  id: string;
  type: 'event' | 'job' | 'classified';
  title: string;
  description?: string;
  category?: string;
  price?: string;
  location?: string;
  status: 'active' | 'inactive' | 'completed' | 'pending' | 'sold';
  user_id?: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface ActivityStats {
  total: number;
  active: number;
  byType: {
    events: number;
    jobs: number;
    classifieds: number;
  };
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  dailyCounts: Array<{ date: string; count: number }>;
  recentActivities: number;
  todayActivities: number;
}

export interface CategoryInsight {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  recent: number;
}

export interface ActivityFilters {
  search?: string;
  type?: 'event' | 'job' | 'classified';
  status?: string;
  category?: string;
  dateRange?: '24h' | '7d' | '30d' | '90d';
  startDate?: Date;
  endDate?: Date;
}

// src/types/types.ts

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  approved?: boolean;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  type?: 'text' | 'image' | 'audio' | 'doc';
  media_url?: string;
  duration?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar_url?: string;
  online?: boolean;
}
