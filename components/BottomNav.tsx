import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Briefcase, Compass, ShoppingCart } from 'lucide-react';

/**
 * BottomNav Component
 * 
 * Provides bottom navigation for mobile app with 5 main sections.
 * Features:
 * - Fixed positioning at bottom
 * - Gradient background
 * - Active state indicators
 * - Safe area padding for notched devices
 * - Mobile-optimized touch targets
 * 
 * Mobile Optimization Notes:
 * - pb-safe class handles safe area insets
 * - Each nav item is at least 44px touch target
 * - Active states provide clear visual feedback
 */
const BottomNav: React.FC = () => {
  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/marketplace', icon: ShoppingCart, label: 'Market' },
    { path: '/businesses', icon: Briefcase, label: 'Biz' },
    { path: '/explore', icon: Compass, label: 'Explore' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 pb-safe pt-3 px-4 z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)]">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center transition-all duration-300
              ${isActive ? 'text-white' : 'text-white/70'}
              min-h-[60px] min-w-[60px]
            `}
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <div className={`
                  p-2.5 rounded-2xl transition-all duration-300 mb-1
                  ${isActive ? 'bg-white/20 backdrop-blur-sm shadow-sm' : 'bg-transparent'}
                  flex items-center justify-center
                `}>
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    fill={isActive ? "currentColor" : "none"} 
                    className={isActive ? "text-white" : "text-white/70"}
                  />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;