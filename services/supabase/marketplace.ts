import { supabase } from './client';
import { storageService } from './storage';
import { MarketplaceListing, MarketplaceMessage, Conversation, MarketplaceReview } from '../../types/marketplace';

export const marketplaceService = {
  async getListings(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceListing[]> {
    const { data, error } = await supabase.rpc('get_marketplace_listings', {
      p_category: filters?.category,
      p_min_price: filters?.minPrice,
      p_max_price: filters?.maxPrice,
      p_location: filters?.location,
      p_search: filters?.search,
      p_limit: filters?.limit || 20,
      p_offset: filters?.offset || 0
    });

    if (error) throw error;
    return data || [];
  },

  async createListing(listingData: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: 'new' | 'used' | 'refurbished';
    location: string;
    images: File[];
  }): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const imageUrls = await storageService.uploadMarketplaceImages(
      listingData.images, 
      user.id
    );

    const { data, error } = await supabase.rpc('create_listing', {
      p_title: listingData.title,
      p_description: listingData.description,
      p_price: listingData.price,
      p_category: listingData.category,
      p_condition: listingData.condition,
      p_location: listingData.location,
      p_images: imageUrls
    });

    if (error) throw error;
    return data;
  },

  async toggleFavorite(listingId: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
    const { data, error } = await supabase.rpc('toggle_listing_favorite', {
      p_listing_id: listingId
    });

    if (error) throw error;
    return data;
  },

  async deleteListing(listingId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_listing', {
      p_listing_id: listingId
    });

    if (error) throw error;
  },

  async sendMessage(listingId: string, receiverId: string, message: string): Promise<string> {
    const { data, error } = await supabase.rpc('send_marketplace_message', {
      p_listing_id: listingId,
      p_receiver_id: receiverId,
      p_message: message
    });

    if (error) throw error;
    return data;
  },

  async getMessages(listingId: string, otherUserId: string): Promise<MarketplaceMessage[]> {
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      p_listing_id: listingId,
      p_other_user_id: otherUserId
    });

    if (error) throw error;
    return data || [];
  },

  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase.rpc('get_user_conversations');

    if (error) throw error;
    return data || [];
  },

  async addReview(listingId: string, rating: number, comment: string): Promise<string> {
    const { data, error } = await supabase.rpc('add_marketplace_review', {
      p_listing_id: listingId,
      p_rating: rating,
      p_comment: comment
    });

    if (error) throw error;
    return data;
  }
};