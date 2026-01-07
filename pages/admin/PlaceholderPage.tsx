// pages/admin/PlaceholderPage.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop() || 'Page';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Construction className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{formattedName} Management</h1>
          <p className="text-gray-600 mb-6">
            This page is currently under development. Check back soon!
          </p>
          <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
            Coming in Phase {pageName === 'members' || pageName === 'pioneers' ? '2' : 
                           pageName === 'announcements' ? '3' : 
                           pageName === 'analytics' ? '4' : '5'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;