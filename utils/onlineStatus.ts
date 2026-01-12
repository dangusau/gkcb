import { supabase } from '../services/supabase/client';

// Check if user is online (last seen within 5 minutes)
export const isUserOnline = (lastSeen: string | null): boolean => {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  return diffMinutes < 5;
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

// Update user's last seen timestamp
export const updateLastSeen = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id);
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