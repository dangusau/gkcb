import { supabase } from './client';

export const profileService = {
  // Existing getter methods
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

  // Update profile data ONLY (no files)
  async updateProfileData(profileData: any) {
    console.log('updateProfileData called with:', profileData);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const updateData: any = {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      bio: profileData.bio || null,
      phone: profileData.phone || null,
      address: profileData.address || null,
      business_name: profileData.business_name || null,
      business_type: profileData.business_type || null,
      market_area: profileData.market_area || null,
      updated_at: new Date().toISOString()
    };

    console.log('Updating profile with:', updateData);

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Profile updated successfully:', data);
    return { success: true, data };
  },

  // Update profile avatar ONLY
  async updateProfileAvatar(file: File) {
    console.log('updateProfileAvatar called with file:', file.name);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log(`Uploading avatar to: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    console.log('Avatar uploaded to:', publicUrl);

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Avatar updated successfully');
    return { success: true, data };
  },

  // Update profile header ONLY
  async updateProfileHeader(file: File) {
    console.log('updateProfileHeader called with file:', file.name);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `header_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log(`Uploading header to: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    console.log('Header uploaded to:', publicUrl);

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        header_image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Header updated successfully');
    return { success: true, data };
  },

  // Remove profile avatar
  async removeProfileAvatar() {
    console.log('removeProfileAvatar called');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Avatar removed successfully');
    return { success: true, data };
  },

  // Remove profile header
  async removeProfileHeader() {
    console.log('removeProfileHeader called');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        header_image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Header removed successfully');
    return { success: true, data };
  },

  // Delete/Update functions for other items
  async deletePost(postId: string) {
    const { error } = await supabase.rpc('delete_post', {
      p_post_id: postId
    });
    if (error) throw error;
  },

  async updatePost(postId: string, data: any) {
    const { error } = await supabase.rpc('update_post', {
      p_post_id: postId,
      p_content: data.content,
      p_privacy: data.privacy || 'public'
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