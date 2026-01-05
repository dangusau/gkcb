// Mapped to Laravel 'users' table
export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string;
    role: string;
}

// Mapped to Laravel 'members' table
export interface Member {
    id: number;
    user_id: number;
    full_name: string;
    position: string;
    company: string;
    category_id: number;
    bio: string;
    verified: boolean;
    image_url: string;
    is_friend?: boolean;
}

// Mapped to Laravel 'businesses' table
export interface Business {
    id: number;
    name: string;
    description: string;
    address: string;
    logo_url: string;
    cover_image_url: string;
    category_id: number;
    category: string;
    rating: number;
    is_verified: boolean;
    is_owned?: boolean;
    // New fields
    email?: string;
    phone?: string;
    website?: string;
    operating_hours?: string; // e.g., "Mon-Fri: 9am - 5pm"
    products_services?: string[];
    owner_name?: string;
    owner_avatar?: string;
}

// Mapped to Laravel 'blog_posts' table
export interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    image_url: string;
    author_name: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    is_liked?: boolean;
}

// Mapped to Laravel 'events' table
export interface Event {
    id: number;
    title: string;
    description: string;
    start_time: string;
    location: string;
    image_url: string;
    attendees_count: number;
}

// Mapped to Laravel 'conversations'
export interface Conversation {
    id: number;
    with_user: User;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

// Mapped to 'classifieds'
export interface Classified {
    id: number;
    title: string;
    price: string;
    image_url: string;
    category: string;
    description?: string;
    location?: string;
    seller_name?: string;
    seller_avatar?: string;
    posted_at?: string;
    condition?: string;
}

// Employment Board
export interface Job {
    id: number;
    title: string;
    company: string;
    type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
    location: string;
    salary_range: string;
    posted_at: string;
    description: string;
    logo_url: string;
    is_owner: boolean;
}

// Notifications
export interface Notification {
    id: number;
    type: 'like' | 'comment' | 'message' | 'system';
    actor_name: string;
    actor_avatar: string;
    content: string;
    time: string;
    is_read: boolean;
    reference_id?: number; // User ID for messages/social, Business ID for system etc.
}

// Media
export interface MediaItem {
    id: number;
    title: string;
    description: string;
    thumbnail_url: string;
    type: 'video' | 'gallery';
    duration?: string; // For video
    photo_count?: number; // For gallery
    created_at: string;
    views: number;
    author_name: string;
    category: string;
}

// Chat Message
export interface Message {
    id: number;
    text?: string;
    sender: 'me' | 'them';
    time: string;
    type: 'text' | 'image' | 'audio';
    media_url?: string;
    duration?: string; // for audio
}

// Add these types to your existing types file
type Pioneer = {
  id: string;
  name: string;
  position: string;
  image_url: string;
  bio?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
};