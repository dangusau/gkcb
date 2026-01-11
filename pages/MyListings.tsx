import React, { useState, useEffect } from 'react';
import { Edit, Trash2, CheckCircle, Package } from 'lucide-react';
import { marketplaceService } from '../services/supabase/marketplace';
import { supabase } from '../services/supabase/client';
import { MarketplaceListing } from '../types/marketplace';
import { formatTimeAgo } from '../utils/formatters';

const MyListings: React.FC = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyListings();
  }, []);

  const loadMyListings = async () => {
    try {
      const allListings = await marketplaceService.getListings({ limit: 100 });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const myListings = allListings.filter(listing => listing.seller_id === user.id);
        setListings(myListings);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSold = async (listingId: string) => {
    try {
      await marketplaceService.markAsSold(listingId);
      setListings(prev => prev.map(listing => 
        listing.id === listingId ? { ...listing, is_sold: true } : listing
      ));
    } catch (error) {
      console.error('Error marking as sold:', error);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!window.confirm('Delete this listing?')) return;
    
    try {
      await marketplaceService.deleteListing(listingId);
      setListings(prev => prev.filter(listing => listing.id !== listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow border p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-600 mb-6">Create your first listing in the marketplace</p>
          <a
            href="/marketplace"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Go to Marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white border-b">
        <h1 className="text-xl font-bold">My Listings</h1>
        <p className="text-gray-600 text-sm">Manage your marketplace items</p>
      </div>

      <div className="p-4 space-y-4">
        {listings.map(listing => (
          <div key={listing.id} className="bg-white rounded-xl shadow border p-4">
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {listing.images[0] && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-bold truncate">{listing.title}</h3>
                  <span className="font-bold text-blue-600">₦{listing.price.toLocaleString()}</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {listing.category}
                  </span>
                  {listing.is_sold && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      Sold
                    </span>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <span>{formatTimeAgo(listing.created_at)}</span>
                  <span className="mx-2">•</span>
                  <span>{listing.views_count} views</span>
                  <span className="mx-2">•</span>
                  <span>{listing.favorite_count} favorites</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              {!listing.is_sold && (
                <button
                  onClick={() => handleMarkSold(listing.id)}
                  className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100"
                >
                  <CheckCircle size={16} />
                  Mark Sold
                </button>
              )}
              
              <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                <Edit size={16} />
              </button>
              
              <button
                onClick={() => handleDelete(listing.id)}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyListings;