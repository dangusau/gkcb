import { supabase } from './client';
import { Member } from '../../types/index';

export const membersService = {
  async getMembers(search?: string, businessType?: string, marketArea?: string, page = 0, limit = 20) {
    const offset = page * limit;
    
    const { data, error } = await supabase
      .rpc('get_member_directory', {
        p_search: search || null,
        p_business_type: businessType || null,
        p_market_area: marketArea || null,
        p_limit: limit,
        p_offset: offset
      });

    if (error) throw error;
    return data;
  },

  async sendConnectionRequest(userId: string) {
    const { data, error } = await supabase
      .rpc('send_connection_request', {
        p_connected_user_id: userId
      });

    if (error) throw error;
    return data;
  }
};