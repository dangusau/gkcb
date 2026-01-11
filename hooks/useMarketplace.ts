import { useState, useCallback } from 'react';
import { marketplaceService } from '../services/supabase/marketplace';
import { MarketplaceListing, Conversation, MarketplaceMessage } from '../types/marketplace';

export const useMarketplace = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Get listings with filters
  const getListings = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const data = await marketplaceService.getListings(filters);
      setListings(data);
      return data;
    } catch (error) {
      console.error('Error getting listings:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create listing
  const createListing = useCallback(async (listingData: any) => {
    try {
      setLoading(true);
      const listingId = await marketplaceService.createListing(listingData);
      
      // Refresh listings
      await getListings();
      return listingId;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getListings]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (listingId: string) => {
    try {
      const result = await marketplaceService.toggleFavorite(listingId);
      
      // Update local state
      setListings(prev => prev.map(listing => {
        if (listing.id === listingId) {
          return {
            ...listing,
            is_favorited: result.is_favorited,
            favorite_count: result.favorite_count
          };
        }
        return listing;
      }));
      
      return result;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }, []);

  // Delete listing
  const deleteListing = useCallback(async (listingId: string) => {
    try {
      await marketplaceService.deleteListing(listingId);
      
      // Remove from local state
      setListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }, []);

  // Get conversations
  const getConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getConversations();
      setConversations(data);
      return data;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get messages
  const getMessages = useCallback(async (listingId: string, otherUserId: string) => {
    try {
      setLoading(true);
      const data = await marketplaceService.getMessages(listingId, otherUserId);
      setMessages(data);
      return data;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (listingId: string, receiverId: string, message: string) => {
    try {
      const messageId = await marketplaceService.sendMessage(listingId, receiverId, message);
      
      // Add to local state
      const newMessage: MarketplaceMessage = {
        id: messageId,
        listing_id: listingId,
        sender_id: '', // Will be set by user context
        receiver_id: receiverId,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: 'You',
        sender_avatar: ''
      };
      
      setMessages(prev => [...prev, newMessage]);
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

  // Add review
  const addReview = useCallback(async (listingId: string, rating: number, comment: string) => {
    try {
      const reviewId = await marketplaceService.addReview(listingId, rating, comment);
      return reviewId;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }, []);

  return {
    // State
    listings,
    conversations,
    messages,
    loading,
    
    // Methods
    getListings,
    createListing,
    toggleFavorite,
    deleteListing,
    getConversations,
    getMessages,
    sendMessage,
    addReview,
    
    // Setters for realtime updates
    setListings,
    setConversations,
    setMessages
  };
};