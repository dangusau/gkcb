import { supabase } from './client';
import { storageService } from './storage';
import { Business, BusinessFilters, Review } from '../../types/business';

export const businessService = {
  async getBusinesses(filters?: BusinessFilters): Promise<Business[]> {
    try {
      const { data, error } = await supabase.rpc('get_businesses', {
        p_business_type: filters?.business_type,
        p_category: filters?.category,
        p_location_axis: filters?.location_axis,
        p_search: filters?.search,
        p_min_rating: filters?.min_rating,
        p_limit: filters?.limit || 20,
        p_offset: filters?.offset || 0
      });

      if (error) {
        console.error('getBusinesses RPC error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getBusinesses:', error);
      throw error;
    }
  },

  async createBusiness(businessData: {
    name: string;
    description: string;
    business_type: 'products' | 'services';
    category: string;
    location_axis: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    logo_file?: File;
    banner_file?: File;
    is_registered?: boolean;
  }): Promise<string> {
    try {
      console.log('Starting business creation with data:', businessData);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        throw new Error('No user found. Please login.');
      }
      
      console.log('User authenticated:', user.id);

      let logo_url: string | undefined = undefined;
      let banner_url: string | undefined = undefined;

      // Upload logo if provided
      if (businessData.logo_file) {
        console.log('Uploading logo file...');
        const [logoUrl] = await storageService.uploadBusinessImages(
          [businessData.logo_file],
          user.id
        );
        logo_url = logoUrl;
        console.log('Logo uploaded:', logo_url);
      }

      // Upload banner if provided
      if (businessData.banner_file) {
        console.log('Uploading banner file...');
        const [bannerUrl] = await storageService.uploadBusinessImages(
          [businessData.banner_file],
          user.id
        );
        banner_url = bannerUrl;
        console.log('Banner uploaded:', banner_url);
      }

      console.log('Calling create_business RPC...');
      const { data, error } = await supabase.rpc('create_business', {
        p_name: businessData.name,
        p_description: businessData.description,
        p_business_type: businessData.business_type,
        p_category: businessData.category,
        p_location_axis: businessData.location_axis,
        p_address: businessData.address || null,
        p_email: businessData.email || null,
        p_phone: businessData.phone || null,
        p_website: businessData.website || null,
        p_logo_url: logo_url || null,
        p_banner_url: banner_url || null,
        p_is_registered: businessData.is_registered || false
      });

      if (error) {
        console.error('create_business RPC error:', error);
        throw error;
      }

      console.log('Business created successfully with ID:', data);
      return data;
    } catch (error) {
      console.error('Error in createBusiness service:', error);
      throw error;
    }
  },

  async addReview(businessId: string, rating: number, comment?: string): Promise<{ average_rating: number; review_count: number }> {
    try {
      const { data, error } = await supabase.rpc('add_business_review', {
        p_business_id: businessId,
        p_rating: rating,
        p_comment: comment || null
      });

      if (error) {
        console.error('add_business_review RPC error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in addReview:', error);
      throw error;
    }
  },

  async getBusinessDetails(businessId: string): Promise<Business> {
    try {
      const { data, error } = await supabase.rpc('get_business_details', {
        p_business_id: businessId
      });

      if (error) {
        console.error('get_business_details RPC error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getBusinessDetails:', error);
      throw error;
    }
  },

  async getCategories(): Promise<{ category: string; business_type: string; count: number }[]> {
    try {
      const { data, error } = await supabase.rpc('get_business_categories');

      if (error) {
        console.error('get_business_categories RPC error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  },

  async getLocationCounts(): Promise<{ location_axis: string; count: number }[]> {
    try {
      const { data, error } = await supabase.rpc('get_location_axis_counts');

      if (error) {
        console.error('get_location_axis_counts RPC error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getLocationCounts:', error);
      throw error;
    }
  },

  async deleteBusiness(businessId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('delete_business', {
        p_business_id: businessId
      });

      if (error) {
        console.error('delete_business RPC error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBusiness:', error);
      throw error;
    }
  }
};