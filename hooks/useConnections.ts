import { useState, useCallback } from 'react';
import { connectionsService, ConnectionRequest, Friend } from '../services/supabase/connections';

export const useConnections = () => {
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReceivedRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await connectionsService.getReceivedRequests();
      setReceivedRequests(data);
      return data;
    } catch (error) {
      console.error('Error loading connection requests:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const data = await connectionsService.getFriends();
      setFriends(data);
      return data;
    } catch (error) {
      console.error('Error loading friends:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      await connectionsService.acceptRequest(requestId);
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      await loadFriends(); // Refresh friends list
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }, [loadFriends]);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      await connectionsService.rejectRequest(requestId);
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }, []);

  return {
    receivedRequests,
    friends,
    loading,
    loadReceivedRequests,
    loadFriends,
    acceptRequest,
    rejectRequest
  };
};