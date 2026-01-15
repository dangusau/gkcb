import { supabase } from '../services/supabase/client';

// Throttle function to limit update frequency
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 20 * 60 * 1000; // 20 minutes

// Update user's last seen timestamp (throttled)
export const updateLastSeen = async (): Promise<void> => {
  const now = Date.now();
  
  // Only update if 15 minutes have passed since last update
  if (now - lastUpdateTime < UPDATE_INTERVAL) {
    return;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  try {
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);
    
    lastUpdateTime = now; // Update the timestamp
  } catch (error) {
    console.error('Error updating last seen:', error);
  }
};

// Check if user is online (last seen within 15 minutes)
export const isUserOnline = (lastSeen: string | null): boolean => {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  return diffMinutes < 15; // Changed from 5 to 15 minutes
};

// Format last seen time
export const formatLastSeen = (lastSeen: string | null): string => {
  if (!lastSeen) return 'Offline';
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Online';
  if (diffMinutes < 60) return `Last seen ${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `Last seen ${Math.floor(diffMinutes / 60)} hours ago`;
  return `Last seen ${Math.floor(diffMinutes / 1440)} days ago`;
};

// Subscribe to user status changes
export const subscribeToUserStatus = (userId: string, callback: (lastSeen: string) => void) => {
  return supabase
    .channel(`user-status-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        if (payload.new.last_seen) {
          callback(payload.new.last_seen);
        }
      }
    )
    .subscribe();
};