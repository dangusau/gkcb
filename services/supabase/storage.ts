import { supabase } from './client';

export const storageService = {
  async uploadMarketplaceImages(files: File[], userId: string): Promise<string[]> {
    console.log('🚀 START UPLOAD DEBUG ====================');
    console.log('📦 Files to upload:', files.length);
    console.log('👤 User ID passed:', userId);
    
    // Get current auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Current auth user:', user?.id);
    console.log('🔐 Auth error:', authError);
    
    const imageUrls: string[] = [];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    
    for (const file of files) {
      try {
        console.log('📁 Processing file:', file.name);
        
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExt || !allowedExtensions.includes(fileExt)) {
          console.warn('❌ Skipping unsupported file type:', fileExt);
          continue;
        }
        
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `marketplace/${userId}/${fileName}`;
        
        console.log('📤 Upload path:', filePath);
        console.log('📤 Folder structure - marketplace/[user_id]/[filename]');
        console.log('📤 Expected in RLS: auth.uid() should match:', userId);

        const { data, error: uploadError } = await supabase.storage
          .from('marketplace-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        console.log('📦 Upload response:', { 
          success: !uploadError, 
          data, 
          error: uploadError?.message 
        });

        if (uploadError) {
          console.error('❌ Upload failed:', uploadError.message);
          console.error('❌ Full error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace-images')
          .getPublicUrl(filePath);
        
        console.log('✅ Upload successful! Public URL:', publicUrl);
        imageUrls.push(publicUrl);
        
      } catch (error) {
        console.error('💥 Unexpected error:', error);
      }
    }
    
    console.log('🎯 Final URLs:', imageUrls);
    console.log('🚀 END UPLOAD DEBUG ====================');
    return imageUrls;
  },

  async uploadPostImages(files: File[], userId: string): Promise<string[]> {
    const imageUrls: string[] = [];
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `posts/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading post image:', error);
        throw error;
      }
    }
    
    return imageUrls;
  },

  async deleteImage(fileUrl: string): Promise<void> {
    try {
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const folder = urlParts[urlParts.length - 3];
      const filePath = `${folder}/${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('marketplace-images')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  async getStorageStats(): Promise<{ used: number; available: number }> {
    return { used: 0, available: 1024 * 1024 * 100 };
  }
};