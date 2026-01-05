import React from 'react';
import { Bell, MessageCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ userName = "Member" }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Add your logout logic here
    console.log('Logging out...');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Welcome */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <img 
                src="/path/to/your/logo.png" 
                alt="GKBC Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback if logo not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="text-white font-bold text-lg">GKBC</div>
                  `;
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">GKBC</h1>
              <p className="text-white/80 text-xs font-medium">
                Welcome, {userName}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Action Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 relative transition-all"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <button 
            onClick={() => navigate('/messages')}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
          >
            <MessageCircle size={20} />
          </button>
          
          <button 
            onClick={handleLogout}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;