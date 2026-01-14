import { supabase } from './client';

export const profileService = {
  async getProfileData(profileUserId: string, viewerId: string) {
    const userId = profileUserId === 'current' ? (await supabase.auth.getUser()).data.user?.id : profileUserId;
    const viewer = viewerId === 'current' ? (await supabase.auth.getUser()).data.user?.id : viewerId;
    
    const { data, error } = await supabase.rpc('get_user_profile_data', {
      p_profile_user_id: userId,
      p_viewer_id: viewer
    });

    if (error) throw error;
    return data;
  },

  async getUserPosts(profileUserId: string, viewerId: string) {
    const viewer = viewerId === 'current' ? (await supabase.auth.getUser()).data.user?.id : viewerId;
    
    const { data, error } = await supabase.rpc('get_user_posts', {
      p_profile_user_id: profileUserId,
      p_viewer_id: viewer
    });

    if (error) throw error;
    return data || [];
  },

  async getUserListings(profileUserId: string, viewerId: string) {
    const viewer = viewerId === 'current' ? (await supabase.auth.getUser()).data.user?.id : viewerId;
    
    const { data, error } = await supabase.rpc('get_user_listings', {
      p_profile_user_id: profileUserId,
      p_viewer_id: viewer
    });

    if (error) throw error;
    return data || [];
  },

  async getUserBusinesses(profileUserId: string, viewerId: string) {
    const viewer = viewerId === 'current' ? (await supabase.auth.getUser()).data.user?.id : viewerId;
    
    const { data, error } = await supabase.rpc('get_user_businesses', {
      p_profile_user_id: profileUserId,
      p_viewer_id: viewer
    });

    if (error) throw error;
    return data || [];
  },

  async getUserJobs(profileUserId: string, viewerId: string) {
    const viewer = viewerId === 'current' ? (await supabase.auth.getUser()).data.user?.id : viewerId;
    
    const { data, error } = await supabase.rpc('get_user_jobs', {
      p_profile_user_id: profileUserId,
      p_viewer_id: viewer
    });

    if (error) throw error;
    return data || [];
  },

  async getUserEvents(profileUserId: string, viewerId: string) {
    const viewer = viewerId === 'current' ? (await supabase.auth.getUser()).data.user?.id : viewerId;
    
    const { data, error } = await supabase.rpc('get_user_events', {
      p_profile_user_id: profileUserId,
      p_viewer_id: viewer
    });

    if (error) throw error;
    return data || [];
  },

  async toggleConnection(targetUserId: string) {
    const { data, error } = await supabase.rpc('toggle_connection_request', {
      p_target_user_id: targetUserId
    });

    if (error) throw error;
    return data;
  },

  async updateProfile(profileData: any) {
    const { error } = await supabase.rpc('update_user_profile', {
      p_first_name: profileData.first_name,
      p_last_name: profileData.last_name,
      p_bio: profileData.bio,
      p_phone: profileData.phone,
      p_address: profileData.address,
      p_business_name: profileData.business_name,
      p_business_type: profileData.business_type,
      p_market_area: profileData.market_area
    });

    if (error) throw error;
  },

  async uploadProfileImage(file: File, type: 'avatar' | 'header') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `profiles/${user.id}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        [type === 'avatar' ? 'avatar_url' : 'header_image_url']: publicUrl 
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return publicUrl;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.rpc('delete_post', {
      p_post_id: postId
    });
    if (error) throw error;
  },

  async updateListing(listingId: string, data: any) {
    const { error } = await supabase.rpc('update_listing', {
      p_listing_id: listingId,
      p_title: data.title,
      p_description: data.description,
      p_price: data.price,
      p_category: data.category,
      p_condition: data.condition,
      p_location: data.location
    });
    if (error) throw error;
  },

  async deleteListing(listingId: string) {
    const { error } = await supabase.rpc('delete_listing', {
      p_listing_id: listingId
    });
    if (error) throw error;
  },

  async updateBusiness(businessId: string, data: any) {
    const { error } = await supabase.rpc('update_business', {
      p_business_id: businessId,
      p_name: data.name,
      p_description: data.description,
      p_business_type: data.business_type,
      p_category: data.category,
      p_location_axis: data.location_axis,
      p_address: data.address,
      p_email: data.email,
      p_phone: data.phone,
      p_website: data.website
    });
    if (error) throw error;
  },

  async deleteBusiness(businessId: string) {
    const { error } = await supabase.rpc('delete_business', {
      p_business_id: businessId
    });
    if (error) throw error;
  },

  async updateJob(jobId: string, data: any) {
    const { error } = await supabase.rpc('update_job', {
      p_job_id: jobId,
      p_title: data.title,
      p_description: data.description,
      p_salary: data.salary,
      p_job_type: data.job_type,
      p_location: data.location
    });
    if (error) throw error;
  },

  async deleteJob(jobId: string) {
    const { error } = await supabase.rpc('delete_job', {
      p_job_id: jobId
    });
    if (error) throw error;
  },

  async updateEvent(eventId: string, data: any) {
    const { error } = await supabase.rpc('update_event', {
      p_event_id: eventId,
      p_title: data.title,
      p_description: data.description,
      p_event_date: data.event_date,
      p_location: data.location
    });
    if (error) throw error;
  },

  async deleteEvent(eventId: string) {
    const { error } = await supabase.rpc('delete_event', {
      p_event_id: eventId
    });
    if (error) throw error;
  }
};