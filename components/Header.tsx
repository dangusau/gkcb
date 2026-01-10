import React, { useState, useEffect } from 'react';
import { MessageCircle, LogOut, Home, Users, Calendar, Settings, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
}

const Header: React.FC<HeaderProps> = ({ userName = "Member", userAvatar }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userInitials, setUserInitials] = useState('M');
  const [loading, setLoading] = useState(true);

  // Get current user ONCE when component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);

          // Get user initials
          const metadataName = user.user_metadata?.name || user.user_metadata?.full_name;
          const emailName = user.email?.split('@')[0] || '';
          const name = metadataName || emailName || userName;

          if (name) {
            const initials = name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            setUserInitials(initials);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []); // Empty dependency array = run once on mount

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Users, label: 'Members', path: '/members' },
    { icon: Calendar, label: 'Events', path: '/events' },
  ];

  const profileMenuItems = [
    { label: 'My Profile', path: '/profile' },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Help & Support', path: '/help' },
    { label: 'Logout', action: handleLogout, icon: LogOut },
  ];

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <img 
                  src="/logo.png" 
                  alt="GKBC Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="text-white font-black text-lg tracking-wider">GKBC</div>';
                    }
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-white tracking-tight drop-shadow-md">Greater Kano</h1>
                <p className="text-white/90 text-xs font-medium">Business Council</p>
              </div>
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications Icon - Just navigates to notifications page */}
              <button
                onClick={() => navigate('/notifications')}
                className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all group"
                title="Notifications"
              >
                <Bell size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Messages Button - Just navigates to messages page */}
              <button
                onClick={() => navigate('/messages')}
                className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all group"
                title="Messages"
              >
                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/50 group-hover:ring-white/80 transition-all">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-blue-700 font-bold text-sm">${userInitials}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-blue-700 font-bold text-sm">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-white text-sm font-semibold leading-tight">
                      {userName.split(' ')[0]}
                    </p>
                    <p className="text-white/80 text-xs">Member</p>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {userInitials}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{userName}</h3>
                            <p className="text-xs text-gray-600">@{currentUser?.email?.split('@')[0] || 'member'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        {profileMenuItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              setShowProfileMenu(false);
                              if (item.action) {
                                item.action();
                              } else if (item.path) {
                                navigate(item.path);
                              }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 transition-colors hover:text-blue-700 group"
                          >
                            {item.icon && (
                              <item.icon size={16} className="text-gray-500 group-hover:text-blue-600" />
                            )}
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 safe-area-bottom shadow-lg">
        <div className="grid grid-cols-4">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-blue-600 transition-colors active:bg-blue-50"
            >
              <item.icon size={22} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Header;
