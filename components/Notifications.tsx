import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  XCircle,
  UserPlus,
  MessageSquare,
  Users,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../services/supabase';

type NotificationType = 'friend_request' | 'message' | 'system' | 'info';

type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
};

const Notifications = () => {
  const navigate = useNavigate();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  
  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await fetchNotifications(user.id);
        setupRealtimeSubscriptions(user.id);
        
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
    
    return () => {
      const channel = supabase.channel('notifications');
      channel.unsubscribe();
    };
  }, []);
  
  // Fetch notifications
  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const notificationsList = data || [];
      setNotifications(notificationsList);
      
      // Calculate unread count
      const unread = notificationsList.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      
      // Update browser notification badge
      updateBrowserBadge(unread);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Update browser notification badge
  const updateBrowserBadge = (count: number) => {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(console.error);
    }
  };
  
  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = (userId: string) => {
    // Subscribe to new notifications
    const notificationsChannel = supabase.channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
          
          // Update browser badge
          updateBrowserBadge(unreadCount + 1);
          
          // Show browser notification if permitted
          showBrowserNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Update notification in list
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === payload.new.id ? { ...notif, ...payload.new } : notif
            )
          );
          
          // Recalculate unread count
          setNotifications(prev => {
            const unread = prev.filter(n => !n.is_read).length;
            setUnreadCount(unread);
            updateBrowserBadge(unread);
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);
      });
    
    return () => {
      notificationsChannel.unsubscribe();
    };
  };
  
  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    // Check if browser notifications are supported and permission granted
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        badge: '/badge.png',
        tag: notification.id,
        data: notification
      });
    } else if (Notification.permission !== 'denied') {
      // Request permission
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon.png'
          });
        }
      });
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }
    
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        alert('Notification permission granted!');
      }
    });
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      updateBrowserBadge(0);
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.action_url) {
      navigate(notification.action_url);
      setShowDropdown(false);
    } else {
      switch (notification.type) {
        case 'friend_request':
          navigate('/members');
          break;
        case 'message':
          if (notification.data?.conversation_id) {
            navigate(`/messages/chat/${notification.data.conversation_id}`);
          } else {
            navigate('/messages');
          }
          break;
        default:
          break;
      }
      setShowDropdown(false);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus size={16} className="text-blue-500" />;
      case 'message':
        return <MessageSquare size={16} className="text-green-500" />;
      case 'system':
        return <AlertCircle size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };
  
  // Get notification time
  const getNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };
  
  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
      updateBrowserBadge(0);
      
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };
  
  // Loading state
  if (loading) {
    return null; // Don't show loading in header
  }
  
  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing size={20} className="text-blue-600" />
        ) : (
          <Bell size={20} className="text-gray-600" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notifications Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={markingAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {markingAllRead ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Mark all read'
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2">No notifications yet</h4>
                  <p className="text-xs text-gray-600">
                    You'll see notifications here when you receive friend requests or messages
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Sender info for friend requests */}
                          {notification.sender_name && (
                            <div className="flex items-center gap-2 mb-2">
                              {notification.sender_avatar ? (
                                <img 
                                  src={notification.sender_avatar} 
                                  alt={notification.sender_name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                  {notification.sender_name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-gray-700">
                                {notification.sender_name}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {getNotificationTime(notification.created_at)}
                            </span>
                            
                            {/* Action buttons for friend requests */}
                            {notification.type === 'friend_request' && notification.sender_id && (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle accept friend request
                                    console.log('Accept friend request:', notification.sender_id);
                                  }}
                                  className="text-xs px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle decline friend request
                                    console.log('Decline friend request:', notification.sender_id);
                                  }}
                                  className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Enable browser notifications
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;