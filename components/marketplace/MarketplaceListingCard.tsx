import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Eye, User } from 'lucide-react';
import { MarketplaceListing } from '../../types/marketplace';
import { formatTimeAgo } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  listing: MarketplaceListing;
  onToggleFavorite?: (listingId: string) => void;
}

const MarketplaceListingCard: React.FC<Props> = ({ listing, onToggleFavorite }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isOwner = listing.seller_id === user?.id;

  const handleCardClick = () => {
    navigate(`/marketplace/${listing.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwner) return; // Owners can't favorite their own listings
    if (onToggleFavorite) {
      onToggleFavorite(listing.id);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-200 relative">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <User size={32} className="text-gray-400" />
          </div>
        )}
        
        {/* Favorite button - only show if not owner */}
        {!isOwner && (
          <button 
            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            onClick={handleFavoriteClick}
            title={listing.is_favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={20}
              fill={listing.is_favorited ? 'red' : 'none'}
              strokeWidth={2}
              className={listing.is_favorited ? 'text-red-500' : 'text-gray-700 hover:text-red-500'}
            />
          </button>
        )}
        
        {/* Owner badge */}
        {isOwner && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
            Your Listing
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-gray-900 truncate">{listing.title}</h3>
        <p className="text-lg font-bold text-blue-600 mt-1">₦{listing.price.toLocaleString()}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span className="truncate max-w-[100px]">{listing.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{listing.views_count}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {listing.seller_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-600 truncate block">{listing.seller_name}</span>
            <span className="text-xs text-gray-400">{formatTimeAgo(listing.created_at)}</span>
          </div>
          {isOwner && (
            <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              Owner
            </div>
          )}
        </div>
        
        {/* Stats row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Heart size={12} />
              <span>{listing.favorite_count}</span>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              listing.condition === 'new' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {listing.condition}
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
            {listing.category}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceListingCard;