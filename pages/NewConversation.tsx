import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, User } from 'lucide-react';
import { messagingService } from '../services/supabase/messaging';
import { ConnectedUser } from '../types/messaging';

const NewConversation: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConnectedUsers(search || undefined);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId: string, userName: string, userAvatar: string) => {
    try {
      const conversationId = await messagingService.getOrCreateConversation(userId);
      navigate(`/messages/${conversationId}`, {
        state: {
          otherUser: {
            id: userId,
            name: userName,
            avatar: userAvatar
          }
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start conversation');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">New Conversation</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="p-2">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">No connections found</h3>
            <p className="text-gray-600 mb-6">
              {search ? 'Try a different search' : 'Connect with members to start chatting'}
            </p>
            <button
              onClick={() => navigate('/members')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Browse Members
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleStartChat(user.user_id, user.full_name, user.avatar_url)}
                className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      <User size={20} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-500">Tap to start chatting</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConversation;