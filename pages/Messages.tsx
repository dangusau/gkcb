import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  Search, 
  X, 
  MessageSquarePlus, 
  Edit, 
  Loader2, 
  CheckCircle,
  Clock,
  User,
  Users,
  Filter,
  ChevronRight,
  Shield,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Conversation, Member } from '../types';
import { supabase } from '../services/supabase';

const Messages = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [friends, setFriends] = useState<Member[]>([]);
    const [friendSearch, setFriendSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [selectedFriend, setSelectedFriend] = useState<Member | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            if (!currentUser) return;
            
            // Fetch conversations where current user is participant_1 or participant_2
            const { data: conversationsData, error: convError } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participant_1_profile:profiles!conversations_participant_1_fkey (
                        id,
                        first_name,
                        last_name,
                        avatar_url
                    ),
                    participant_2_profile:profiles!conversations_participant_2_fkey (
                        id,
                        first_name,
                        last_name,
                        avatar_url
                    )
                `)
                .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
                .order('last_message_at', { ascending: false });
            
            if (convError) throw convError;
            
            // Get conversation IDs to fetch messages
            const conversationIds = conversationsData?.map(c => c.id) || [];
            
            // Fetch the latest message for each conversation
            let conversationsWithDetails: Conversation[] = [];
            
            for (const conv of conversationsData || []) {
                // Determine the other participant
                const otherParticipant = conv.participant_1 === currentUser.id 
                    ? conv.participant_2_profile 
                    : conv.participant_1_profile;
                
                // Get the last message for this conversation
                const { data: lastMessage, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (msgError && msgError.code !== 'PGRST116') { // Not found
                    console.error('Error fetching last message:', msgError);
                }
                
                // Get unread count (messages not read by current user)
                const { data: unreadMessages, error: unreadError } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('conversation_id', conv.id)
                    .eq('is_read', false)
                    .neq('sender_id', currentUser.id);
                
                if (unreadError) {
                    console.error('Error fetching unread messages:', unreadError);
                }
                
                conversationsWithDetails.push({
                    id: conv.id,
                    with_user: {
                        id: otherParticipant?.id || '',
                        name: otherParticipant 
                            ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim()
                            : 'Unknown User',
                        avatar_url: otherParticipant?.avatar_url,
                        status: 'online' // You might want to track this differently
                    },
                    last_message: lastMessage?.content || 'No messages yet',
                    last_message_at: formatTimeAgo(lastMessage?.created_at || conv.created_at),
                    unread_count: unreadMessages?.length || 0
                });
            }
            
            setConversations(conversationsWithDetails);
            setFilteredConversations(conversationsWithDetails);
            
            // Fetch friends (connections where status is 'accepted')
            const { data: connectionsData, error: connError } = await supabase
                .from('connections')
                .select(`
                    *,
                    friend_profile:profiles!connections_friend_id_fkey (
                        id,
                        first_name,
                        last_name,
                        avatar_url
                    ),
                    user_profile:profiles!connections_user_id_fkey (
                        id,
                        first_name,
                        last_name,
                        avatar_url
                    )
                `)
                .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
                .eq('status', 'accepted');
            
            if (connError) throw connError;
            
            // Transform connections to friends list
            const friendsList: Member[] = [];
            
            for (const conn of connectionsData || []) {
                // Determine which user is the friend (not current user)
                let friendProfile = null;
                
                if (conn.user_id === currentUser.id) {
                    friendProfile = conn.friend_profile;
                } else if (conn.friend_id === currentUser.id) {
                    friendProfile = conn.user_profile;
                }
                
                if (friendProfile) {
                    // Fetch member details for position and company
                    const { data: memberData } = await supabase
                        .from('members')
                        .select('position, company')
                        .eq('user_id', friendProfile.id)
                        .single();
                    
                    friendsList.push({
                        id: friendProfile.id,
                        user_id: friendProfile.id,
                        full_name: `${friendProfile.first_name || ''} ${friendProfile.last_name || ''}`.trim(),
                        image_url: friendProfile.avatar_url,
                        position: memberData?.position || '',
                        company: memberData?.company || '',
                        is_friend: true
                    });
                }
            }
            
            setFriends(friendsList);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = conversations;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(conv => 
                conv.with_user.name.toLowerCase().includes(term) ||
                conv.last_message.toLowerCase().includes(term)
            );
        }

        // Filter by unread
        if (activeFilter === 'unread') {
            result = result.filter(conv => conv.unread_count > 0);
        }

        setFilteredConversations(result);
    }, [searchTerm, activeFilter, conversations]);

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

    const openChat = async (userId: string) => {
        try {
            if (!currentUser) return;
            
            // Check if conversation already exists
            const { data: existingConversation } = await supabase
                .from('conversations')
                .select('*')
                .or(`and(participant_1.eq.${currentUser.id},participant_2.eq.${userId}),and(participant_1.eq.${userId},participant_2.eq.${currentUser.id})`)
                .single();
            
            let conversationId = existingConversation?.id;
            
            // If no conversation exists, create one
            if (!existingConversation) {
                const { data: newConversation, error } = await supabase
                    .from('conversations')
                    .insert([
                        {
                            participant_1: currentUser.id,
                            participant_2: userId,
                            last_message_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();
                
                if (error) throw error;
                conversationId = newConversation.id;
            }
            
            navigate(`/messages/chat/${conversationId}`);
            setIsNewChatOpen(false);
        } catch (error) {
            console.error('Error opening chat:', error);
        }
    };

    const filteredFriends = friends.filter(f => 
        f.full_name.toLowerCase().includes(friendSearch.toLowerCase()) || 
        f.company?.toLowerCase().includes(friendSearch.toLowerCase()) ||
        f.position?.toLowerCase().includes(friendSearch.toLowerCase())
    );

    const unreadCount = conversations.filter(c => c.unread_count > 0).length;
    const totalUnread = conversations.reduce((total, conv) => total + conv.unread_count, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
            {/* Fixed Header */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-200/80">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Messages</h1>
                        <p className="text-xs text-gray-500">
                            {unreadCount > 0 ? `${unreadCount} unread conversations` : 'All caught up!'}
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsNewChatOpen(true)}
                        className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg shadow-blue-200/50 active:scale-95 transition-all"
                    >
                        <MessageSquarePlus size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="px-4 pt-16 pb-24 max-w-screen-sm mx-auto">
                {/* Search & Filter Section */}
                <div className="mb-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4 mb-4">
                        <div className="relative mb-3 group">
                            <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Search messages, people..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-all ${
                                    activeFilter === 'all'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveFilter('unread')}
                                className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                    activeFilter === 'unread'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Unread
                                {totalUnread > 0 && (
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                                        {totalUnread}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Banner */}
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
                                <div className="text-xs text-gray-600">Conversations</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
                                <div className="text-xs text-gray-600">Unread</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{friends.length}</div>
                                <div className="text-xs text-gray-600">Friends</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversations List */}
                <div>
                    {filteredConversations.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageSquarePlus className="w-8 h-8 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {activeFilter === 'unread' ? 'No Unread Messages' : 'No Messages Yet'}
                            </h4>
                            <p className="text-gray-600 text-sm mb-6">
                                {activeFilter === 'unread' 
                                    ? 'You\'re all caught up!' 
                                    : 'Start a conversation with your network'}
                            </p>
                            <button
                                onClick={() => setIsNewChatOpen(true)}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                            >
                                Start New Chat
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredConversations.map(conv => (
                                <div 
                                    key={conv.id} 
                                    onClick={() => navigate(`/messages/chat/${conv.id}`)}
                                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                                        {conv.with_user.avatar_url ? (
                                                            <img 
                                                                src={conv.with_user.avatar_url} 
                                                                alt={conv.with_user.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            conv.with_user.name.substring(0, 2).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                                        conv.with_user.status === 'online' ? 'bg-green-500' : 
                                                        conv.with_user.status === 'away' ? 'bg-yellow-500' : 
                                                        'bg-gray-400'
                                                    }`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="text-sm font-bold text-gray-900 truncate">
                                                            {conv.with_user.name}
                                                        </h3>
                                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                            {conv.last_message_at}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm truncate ${
                                                        conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                                                    }`}>
                                                        {conv.last_message}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {conv.unread_count > 0 && (
                                                <div className="flex-shrink-0 ml-2">
                                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">{conv.unread_count}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* New Chat Modal */}
            {isNewChatOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsNewChatOpen(false)}
                    ></div>
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        <div className="bg-gradient-to-b from-gray-50 to-blue-50 w-full max-w-screen-sm mx-auto h-[85vh] rounded-t-2xl shadow-2xl border border-gray-200/80 flex flex-col">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-gray-200/80 bg-gradient-to-b from-gray-50 to-blue-50 rounded-t-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">New Message</h2>
                                        <p className="text-xs text-gray-500">Connect with your network</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsNewChatOpen(false)}
                                        className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="relative group">
                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                        <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Search friends, companies..."
                                        value={friendSearch}
                                        onChange={(e) => setFriendSearch(e.target.value)}
                                        autoFocus
                                    />
                                    {friendSearch && (
                                        <button
                                            onClick={() => setFriendSearch("")}
                                            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Friends List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Users size={16} />
                                        Connected Members ({friends.length})
                                    </h3>
                                    {filteredFriends.length === 0 ? (
                                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 p-6 text-center">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <Users className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {friendSearch ? 'No friends found' : 'No connections yet'}
                                            </p>
                                            {!friendSearch && (
                                                <button
                                                    onClick={() => {
                                                        setIsNewChatOpen(false);
                                                        navigate('/members');
                                                    }}
                                                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Explore Members →
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredFriends.map(friend => (
                                                <div 
                                                    key={friend.id}
                                                    onClick={() => openChat(friend.user_id)}
                                                    className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/80 p-3 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                                                {friend.image_url ? (
                                                                    <img 
                                                                        src={friend.image_url} 
                                                                        alt={friend.full_name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    friend.full_name.substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                                                    {friend.full_name}
                                                                </h4>
                                                                <ChevronRight size={16} className="text-gray-400" />
                                                            </div>
                                                            {friend.position && (
                                                                <p className="text-xs text-gray-600 truncate mt-1">
                                                                    {friend.position}
                                                                </p>
                                                            )}
                                                            {friend.company && (
                                                                <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                                                    <Users size={10} />
                                                                    {friend.company}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Messages;