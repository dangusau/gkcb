import React from 'react';
import { Star, MapPin, CheckCircle, Building } from 'lucide-react';
import { Business } from '../../types/business';
import { Link } from 'react-router-dom';

interface Props {
  business: Business;
}

const BusinessCard: React.FC<Props> = ({ business }) => {
  return (
    <Link to={`/businesses/${business.id}`}>
      <div className="bg-white rounded-xl shadow border overflow-hidden hover:shadow-md transition-shadow">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative">
          {business.banner_url ? (
            <img
              src={business.banner_url}
              alt={`${business.name} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building size={48} className="text-white/80" />
            </div>
          )}
          
          {/* Logo */}
          <div className="absolute -bottom-6 left-4">
            <div className="w-16 h-16 bg-white rounded-xl shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building size={24} className="text-blue-600" />
              )}
            </div>
          </div>

          {/* Verification Badge */}
          {business.is_registered && business.verification_status === 'approved' && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-8 pb-4 px-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-lg truncate">{business.name}</h3>
            <div className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{business.average_rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({business.review_count})</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {business.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              {business.category}
            </span>
            <div className="flex items-center gap-1 text-gray-500 text-sm ml-auto">
              <MapPin size={14} />
              <span>{business.location}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BusinessCard;