import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Eye } from 'lucide-react';
import { MarketplaceListing } from '../../types/marketplace';
import { formatTimeAgo } from '../../utils/formatters';

interface Props {
  listing: MarketplaceListing;
}

const MarketplaceListingCard: React.FC<Props> = ({ listing }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow border overflow-hidden cursor-pointer"
    >
      <div className="aspect-square bg-gray-200 relative">
        {listing.images[0] && (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        )}
        <button 
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            // Handle favorite toggle
          }}
        >
          <Heart
            size={20}
            fill={listing.is_favorited ? 'red' : 'none'}
            className={listing.is_favorited ? 'text-red-500' : 'text-gray-600'}
          />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-gray-900 truncate">{listing.title}</h3>
        <p className="text-lg font-bold text-blue-600">₦{listing.price.toLocaleString()}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{listing.views_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <span className="text-sm text-gray-600">{listing.seller_name}</span>
          <span className="text-xs text-gray-400">{formatTimeAgo(listing.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceListingCard;