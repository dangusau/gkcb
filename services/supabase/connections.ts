import { supabase } from './client';

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  sender_email: string;
  status: string;
  created_at: string;
}

export interface Friend {
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_email: string;
  connected_at: string;
}

export const connectionsService = {
  // Get received connection requests
  async getReceivedRequests(): Promise<ConnectionRequest[]> {
    const { data, error } = await supabase.rpc('get_received_connection_requests');
    if (error) throw error;
    return data || [];
  },

  // Accept connection request
  async acceptRequest(requestId: string): Promise<void> {
    const { error } = await supabase.rpc('accept_connection_request', {
      p_request_id: requestId
    });
    if (error) throw error;
  },

  // Reject connection request
  async rejectRequest(requestId: string): Promise<void> {
    const { error } = await supabase.rpc('reject_connection_request', {
      p_request_id: requestId
    });
    if (error) throw error;
  },

  // Get connection status between users
  async getConnectionStatus(otherUserId: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_connection_status', {
      p_other_user_id: otherUserId
    });
    if (error) throw error;
    return data || 'not_connected';
  },

  // Get friends list
  async getFriends(): Promise<Friend[]> {
    const { data, error } = await supabase.rpc('get_friends_list');
    if (error) throw error;
    return data || [];
  }
};