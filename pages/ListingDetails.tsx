import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MapPin, Eye, MessageCircle, Phone, Shield } from 'lucide-react';
import { marketplaceService } from '../services/supabase/marketplace';
import { useMessaging } from '../hooks/useMessaging';
import { MarketplaceListing } from '../types/marketplace';
import { formatTimeAgo } from '../utils/formatters';

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const { sendMessage } = useMessaging();

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    try {
      const listings = await marketplaceService.getListings({ limit: 50 });
      const found = listings.find(l => l.id === id);
      setListing(found || null);
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!listing) return;
    try {
      const result = await marketplaceService.toggleFavorite(listing.id);
      setListing(prev => prev ? { ...prev, ...result } : null);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!listing) return;
    try {
      await sendMessage(listing.id, listing.seller_id, "Is this item still available?");
      setShowContact(false);
      alert('Message sent to seller!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Listing Not Found</h2>
          <button onClick={() => navigate('/marketplace')} className="text-blue-600">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button onClick={handleFavorite} className="p-2 bg-gray-100 rounded-full">
            <Heart
              size={20}
              fill={listing.is_favorited ? 'red' : 'none'}
              className={listing.is_favorited ? 'text-red-500' : 'text-gray-600'}
            />
          </button>
          <button className="p-2 bg-gray-100 rounded-full">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="h-80 bg-gray-200">
          {listing.images[selectedImage] && (
            <img
              src={listing.images[selectedImage]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {listing.images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {listing.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  selectedImage === idx ? 'border-blue-500' : 'border-gray-300'
                }`}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {selectedImage + 1}/{listing.images.length}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <span className="text-2xl font-bold text-blue-600">₦{listing.price.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-4 text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={16} />
            <span>{listing.views_count} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={16} />
            <span>{listing.favorite_count}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {listing.category}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {listing.condition}
          </span>
          {listing.is_sold && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              Sold
            </span>
          )}
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
        </div>

        <div className="border-t border-b py-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {listing.seller_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h4 className="font-bold">{listing.seller_name}</h4>
              <p className="text-sm text-gray-500">Member since {formatTimeAgo(listing.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield size={16} />
            <span>Verified Seller</span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-yellow-800 mb-2">Safety Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Meet in a public place</li>
            <li>• Inspect item before paying</li>
            <li>• Never pay in advance</li>
            <li>• Avoid sharing personal information</li>
          </ul>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
        <button
          onClick={() => setShowContact(true)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
        >
          <MessageCircle size={20} />
          Contact Seller
        </button>
        <button onClick={handleFavorite} className="px-4 bg-gray-100 rounded-lg flex items-center justify-center">
          <Heart
            size={20}
            fill={listing.is_favorited ? 'red' : 'none'}
            className={listing.is_favorited ? 'text-red-500' : 'text-gray-600'}
          />
        </button>
      </div>

      {showContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Contact Seller</h3>
            
            <div className="space-y-3 mb-6">
              <button 
                onClick={handleSendMessage}
                className="w-full p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center gap-3"
              >
                <MessageCircle size={24} />
                <span className="font-bold">Send Message</span>
              </button>
              
              <button className="w-full p-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-3">
                <Phone size={24} />
                <span className="font-bold">Call Seller</span>
              </button>
            </div>

            <button
              onClick={() => setShowContact(false)}
              className="w-full py-3 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;