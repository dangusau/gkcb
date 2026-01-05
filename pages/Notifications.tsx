import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  MessageSquare, 
  Info, 
  Bell, 
  Users,
  CheckCircle,
  X,
  Loader2,
  Star,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Briefcase,
  Check
} from 'lucide-react';
import { Notification } from '../types';
import { supabase } from '../services/supabase';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/login');
                    return;
                }
                
                // Fetch notifications from database
                const { data: notificationsData, error } = await supabase
                    .from('notifications')
                    .select(`
                        *,
                        actor:profiles!notifications_actor_id_fkey (
                            id,
                            first_name,
                            last_name,
                            avatar_url
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                // Transform data to match your Notification type
                const formattedNotifications = (notificationsData || []).map(notif => ({
                    id: notif.id,
                    type: notif.type as any,
                    content: notif.content,
                    actor_name: notif.actor 
                        ? `${notif.actor.first_name || ''} ${notif.actor.last_name || ''}`.trim()
                        : 'User',
                    actor_avatar: notif.actor?.avatar_url,
                    reference_id: notif.reference_id,
                    is_read: notif.is_read,
                    time: formatTimeAgo(notif.created_at)
                }));
                
                setNotifications(formattedNotifications);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={16} className="text-white" />;
            case 'comment': return <MessageSquare size={16} className="text-white" />;
            case 'message': return <MessageCircle size={16} className="text-white" />;
            case 'connection': return <Users size={16} className="text-white" />;
            case 'event': return <Calendar size={16} className="text-white" />;
            case 'market': return <ShoppingBag size={16} className="text-white" />;
            case 'job': return <Briefcase size={16} className="text-white" />;
            default: return <Bell size={16} className="text-white" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'like': return 'bg-gradient-to-r from-red-500 to-red-600';
            case 'comment': return 'bg-gradient-to-r from-blue-500 to-blue-600';
            case 'message': return 'bg-gradient-to-r from-green-500 to-green-600';
            case 'connection': return 'bg-gradient-to-r from-purple-500 to-purple-600';
            case 'event': return 'bg-gradient-to-r from-orange-500 to-orange-600';
            case 'market': return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
            case 'job': return 'bg-gradient-to-r from-cyan-500 to-cyan-600';
            default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
        }
    };

    const getFilteredNotifications = () => {
        if (filter === 'unread') {
            return notifications.filter(notif => !notif.is_read);
        }
        return notifications;
    };

    const handleNotificationClick = async (notif: Notification) => {
        try {
            // Mark as read in database
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notif.id);
            
            if (error) console.error('Error updating notification:', error);
            
            // Update local state
            const updatedNotifications = notifications.map(n => 
                n.id === notif.id ? { ...n, is_read: true } : n
            );
            setNotifications(updatedNotifications);

            // Navigate based on type
            if (notif.type === 'message' && notif.reference_id) {
                navigate(`/messages/chat/${notif.reference_id}`);
            } else if ((notif.type === 'like' || notif.type === 'comment') && notif.reference_id) {
                navigate(`/profile/${notif.reference_id}`);
            } else if (notif.type === 'connection' && notif.reference_id) {
                navigate(`/member/${notif.reference_id}`);
            } else if (notif.type === 'event' && notif.reference_id) {
                navigate(`/event/${notif.reference_id}`);
            } else if (notif.type === 'market' && notif.reference_id) {
                navigate(`/market/${notif.reference_id}`);
            } else if (notif.type === 'job' && notif.reference_id) {
                navigate(`/jobs/${notif.reference_id}`);
            } else {
                navigate('/profile');
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Update in database
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            
            if (error) throw error;
            
            // Update local state
            const updatedNotifications = notifications.map(notif => ({
                ...notif,
                is_read: true
            }));
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
                <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
                        <p className="text-xs text-gray-500">
                            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Mark All Read
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="px-4 pt-16 pb-24 max-w-screen-sm mx-auto">
                {/* Stats Banner */}
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
                                <div className="text-xs text-gray-600">Total</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
                                <div className="text-xs text-gray-600">Unread</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {notifications.filter(n => n.type === 'connection').length}
                                </div>
                                <div className="text-xs text-gray-600">Connections</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white/95 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200/80 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            filter === 'all'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        All
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {notifications.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            filter === 'unread'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        Unread
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {unreadCount}
                        </span>
                    </button>
                </div>

                {/* Notifications List */}
                <div>
                    {getFilteredNotifications().length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
                            </h4>
                            <p className="text-gray-600 text-sm">
                                {filter === 'unread' 
                                    ? 'You\'re all caught up!' 
                                    : 'Your notifications will appear here'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {getFilteredNotifications().map(notif => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`
                                        bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden 
                                        hover:shadow-xl transition-shadow cursor-pointer active:scale-[0.99]
                                        ${!notif.is_read ? 'border-l-4 border-l-blue-500' : ''}
                                    `}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                                        {notif.actor_avatar ? (
                                                            <img 
                                                                src={notif.actor_avatar} 
                                                                alt={notif.actor_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            notif.actor_name?.substring(0, 2).toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white ${getIconBg(notif.type)}`}>
                                                        {getIcon(notif.type)}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">
                                                            {notif.actor_name}
                                                        </h4>
                                                        {!notif.is_read && (
                                                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-bold rounded-lg">
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {notif.content}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            {getIcon(notif.type)}
                                                            <span className="capitalize">
                                                                {notif.type === 'connection' ? 'Connection Request' : 
                                                                 notif.type === 'like' ? 'Like' :
                                                                 notif.type === 'comment' ? 'Comment' :
                                                                 notif.type === 'message' ? 'Message' :
                                                                 notif.type}
                                                            </span>
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {notif.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons for Connection Requests */}
                                        {notif.type === 'connection' && !notif.is_read && (
                                            <div className="flex gap-2 mt-4">
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        // Handle accept connection
                                                        try {
                                                            if (notif.reference_id) {
                                                                const { error } = await supabase
                                                                    .from('connections')
                                                                    .update({ status: 'accepted' })
                                                                    .eq('id', notif.reference_id);
                                                                
                                                                if (error) throw error;
                                                                // Update notification as read
                                                                handleNotificationClick(notif);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error accepting connection:', error);
                                                        }
                                                    }}
                                                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95"
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        // Handle ignore connection
                                                        try {
                                                            if (notif.reference_id) {
                                                                const { error } = await supabase
                                                                    .from('connections')
                                                                    .delete()
                                                                    .eq('id', notif.reference_id);
                                                                
                                                                if (error) throw error;
                                                                // Update notification as read
                                                                handleNotificationClick(notif);
                                                            }
                                                        } catch (error) {
                                                            console.error('Error ignoring connection:', error);
                                                        }
                                                    }}
                                                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Ignore
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Notifications;