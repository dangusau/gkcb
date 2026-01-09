import React, { useState, useEffect } from 'react';
import { MessageCircle, LogOut, Home, Users, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Notifications from './Notifications';

interface HeaderProps {
  userName?: string;
  userAvatar?: string;
}

const Header: React.FC<HeaderProps> = ({ userName = "Member", userAvatar }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userInitials, setUserInitials] = useState('M');

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Get user initials from metadata or email
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
    };
    
    getCurrentUser();
  }, [userName]);

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
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Navigation */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-white font-black text-lg tracking-wider">GKBC</div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-black text-white tracking-tight">Greater Kano</h1>
                  <p className="text-white/80 text-xs font-medium">Business Council</p>
                </div>
              </div>

              
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="hidden sm:block">
                <Notifications />
              </div>

              {/* Messages Button */}
              <button 
                onClick={() => navigate('/messages')}
                className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all relative"
                title="Messages"
              >
                <MessageCircle size={20} />
              </button>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center overflow-hidden">
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
                            parent.innerHTML = userInitials;
                            parent.className = "w-9 h-9 bg-white text-blue-600 font-bold text-sm rounded-full flex items-center justify-center";
                          }
                        }}
                      />
                    ) : (
                      <span className="text-blue-600 font-bold text-sm">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-white text-sm font-medium leading-tight">
                      {userName.split(' ')[0]}
                    </p>
                    <p className="text-white/70 text-xs">Member</p>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
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
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {item.icon && <item.icon size={16} className="text-gray-500" />}
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-xl"
              >
                <div className="space-y-1">
                  <span className="block w-6 h-0.5 bg-white"></span>
                  <span className="block w-6 h-0.5 bg-white"></span>
                  <span className="block w-6 h-0.5 bg-white"></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3">
              {/* Mobile Notifications */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <button 
                    onClick={() => setShowMobileMenu(false)}
                    className="p-1"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <Notifications />
              </div>

              {/* Mobile Navigation Items */}
              <div className="grid grid-cols-2 gap-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigate(item.path);
                      setShowMobileMenu(false);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <item.icon size={20} className="text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Profile Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {profileMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowMobileMenu(false);
                      if (item.action) {
                        item.action();
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {item.icon && <item.icon size={18} className="text-gray-500" />}
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 safe-area-bottom">
        <div className="grid grid-cols-4">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-3 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <item.icon size={20} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Header;