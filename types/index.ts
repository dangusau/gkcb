export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  media_urls: string[];
  media_type: 'text' | 'image' | 'video' | 'gallery';
  location: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  has_liked: boolean;
  has_shared: boolean;
}

export interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  has_liked: boolean;
}

export interface Pioneer {
  id: string;
  name: string;
  title: string;
  image_url: string;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  business_name: string;
  business_type: string;
  location: string;
  market_area: string;
  connection_status: 'pending' | 'accepted' | 'rejected' | 'not_connected';
}

export interface MembersFilter {
  search: string;
  business_type: string;
}