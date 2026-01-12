import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Plus, MessageCircle, X } from 'lucide-react';
import { useMarketplace } from '../hooks/useMarketplace';
import MarketplaceListingCard from '../components/marketplace/MarketplaceListingCard';
import CreateListingModal from '../components/marketplace/CreateListingModal';

const Marketplace: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    location: '',
    condition: 'all'
  });
  
  const { listings, loading, getListings, createListing } = useMarketplace();
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Custom debounce function
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      loadListingsWithFilters(query);
    }, 500);
  }, [selectedCategory, filters]);

  useEffect(() => {
    debouncedSearch(searchQuery);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  const loadListingsWithFilters = async (searchText?: string) => {
    const filterParams: any = {};
    
    if (selectedCategory !== 'All') {
      filterParams.category = selectedCategory;
    }
    
    if (filters.minPrice) {
      filterParams.minPrice = parseFloat(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      filterParams.maxPrice = parseFloat(filters.maxPrice);
    }
    
    if (filters.location) {
      filterParams.location = filters.location;
    }
    
    if (filters.condition !== 'all') {
      filterParams.condition = filters.condition;
    }
    
    if (searchText) {
      filterParams.search = searchText;
    }
    
    await getListings(filterParams);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadListingsWithFilters(searchQuery);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      location: '',
      condition: 'all'
    });
    setSelectedCategory('All');
    setSearchQuery('');
    getListings();
  };

  const handleCreateListing = async (listingData: any) => {
    try {
      await createListing(listingData);
      await getListings();
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  };

  const categories = ['All', 'Electronics', 'Fashion', 'Vehicles', 'Property', 'Services', 'Others'];
  const conditions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Blue Background */}
      <div className="sticky top-0 z-20">
        {/* Page Title - Blue Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4">
          <h1 className="text-xl font-bold text-white">GKBC Marketplace</h1>
          <p className="text-sm text-blue-100">Buy and sell within the GKBC community</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by title..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
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
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b p-4 space-y-4 animate-slideDown">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Filters</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min Price (₦)</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price (₦)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Any"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="City or area"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="w-full p-2 border rounded"
            >
              {conditions.map(cond => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={applyFilters}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 p-4 bg-white">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              loadListingsWithFilters(searchQuery);
            }}
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
      {loading && listings.length === 0 ? (
        <div className="p-4 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
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

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Marketplace;