import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MessageCircle } from 'lucide-react';
import { useMarketplace } from '../hooks/useMarketplace';
import MarketplaceListingCard from '../components/marketplace/MarketplaceListingCard';
import CreateListingModal from '../components/marketplace/CreateListingModal';

const Marketplace: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { listings, loading, getListings, createListing } = useMarketplace();

  useEffect(() => {
    getListings({ category: selectedCategory === 'All' ? undefined : selectedCategory });
  }, [getListings, selectedCategory]);

  const handleCreateListing = async (listingData: any) => {
    try {
      // TODO: Upload images first, get URLs, then create listing
      const imageUrls = []; // Upload logic here
      await createListing({ ...listingData, images: imageUrls });
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Add debounce search here
  };

  const categories = ['All', 'Electronics', 'Fashion', 'Vehicles', 'Property', 'Services', 'Others'];

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search marketplace..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Filter size={20} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 p-4 bg-white">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-600 mb-6">Be the first to list something for sale!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-4">
          {listings.map(listing => (
            <MarketplaceListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Floating Create Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateListing}
      />
    </div>
  );
};

export default Marketplace;