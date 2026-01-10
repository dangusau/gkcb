import React, { ReactNode } from 'react';

interface MobileAppWrapperProps {
  children: ReactNode;
}

const MobileAppWrapper: React.FC<MobileAppWrapperProps> = ({ children }) => {
  return (
    <div className="mobile-wrapper">
      {/* iOS Safe Area Top */}
      <div className="h-[env(safe-area-inset-top)] bg-transparent" />
      
      {/* Main App Container */}
      <div className="min-h-screen bg-gray-50">
        {/* Mobile width constraint - max 640px (iPhone width) */}
        <div className="max-w-screen-sm mx-auto w-full min-h-screen bg-white">
          {children}
        </div>
      </div>
      
      {/* iOS Safe Area Bottom */}
      <div className="h-[env(safe-area-inset-bottom)] bg-transparent" />
      
      {/* Mobile optimization styles */}
      <style jsx global>{`
        /* For tablets/desktops: center the mobile app */
        @media (min-width: 641px) {
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          
          .mobile-wrapper {
            width: 100%;
            max-width: 640px;
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            max-height: 90vh;
          }
        }
        
        /* Mobile-specific optimizations */
        @media (max-width: 640px) {
          /* Prevent text selection except on inputs */
          body {
            user-select: none;
          }
          
          input, textarea {
            user-select: text;
            font-size: 16px; /* Prevents iOS zoom */
          }
          
          /* Minimum touch target size */
          button, a, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileAppWrapper;