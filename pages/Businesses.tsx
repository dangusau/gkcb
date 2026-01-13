import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Store, Star, MapPin } from 'lucide-react';
import { useBusiness } from '../hooks/useBusiness';
import { LOCATION_AXIS } from '../types/business';
import CreateBusinessModal from '../components/business/CreateBusinessModal';

const Businesses: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'products' | 'services' | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { businesses, loading, getBusinesses, createBusiness } = useBusiness();

  useEffect(() => {
    const filters = {
      business_type: selectedType === 'all' ? undefined : selectedType,
      location_axis: selectedLocation === 'all' ? undefined : selectedLocation,
      search: searchQuery || undefined
    };
    getBusinesses(filters);
  }, [getBusinesses, selectedType, selectedLocation, searchQuery]);

  if (loading && businesses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search businesses..."
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

      {/* Type Filter */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setSelectedType('all')}
          className={`flex-1 py-3 text-center ${selectedType === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('products')}
          className={`flex-1 py-3 text-center ${selectedType === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Products
        </button>
        <button
          onClick={() => setSelectedType('services')}
          className={`flex-1 py-3 text-center ${selectedType === 'services' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Services
        </button>
      </div>

      {/* Location Filter */}
      <div className="bg-white p-4">
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="all">All Locations</option>
          {LOCATION_AXIS.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      {/* Businesses List */}
      {businesses.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No businesses found</h3>
          <p className="text-gray-600 mb-6">Be the first to list a business in this area!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            List Your Business
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {businesses.map(business => (
            <Link 
              to={`/business/${business.id}`} 
              key={business.id} 
              className="block"
            >
              <div className="bg-white rounded-xl shadow border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {business.logo_url && (
                        <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">{business.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{business.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{business.description?.substring(0, 60)}...</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin size={12} />
                        <span>{business.location_axis}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          business.business_type === 'products' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {business.business_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Create Business Modal */}
      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createBusiness}
      />
    </div>
  );
};

export default Businesses;