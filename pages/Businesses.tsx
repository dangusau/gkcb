import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import {
  Search,
  Users,
  Briefcase,
  Building,
  MapPin,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Calendar,
  Globe,
  Phone,
  Mail,
  Star,
  Package,
  Clock,
  CheckCircle,
  Filter
} from 'lucide-react';
import { supabase } from '../services/supabase';

type Business = {
  id: string;
  name: string;
  description: string;
  address: string;
  logo_url: string;
  cover_image_url: string;
  category: string;
  rating: number;
  is_verified: boolean;
  email: string;
  phone: string;
  website: string;
  operating_hours: string;
  products_services: string[];
  created_at: string;
  owner_id: string;
  owner: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  is_owned: boolean;
};

const Businesses = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    operating_hours: '',
    products_services: '',
    logo_url: '',
    cover_image_url: ''
  });

  const categories = ['All', 'Manufacturing', 'Agriculture', 'Tech', 'Hospitality', 'Retail'];

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          navigate('/login');
          return;
        }

        setUserProfile(profile);
        await fetchBusinesses(profile.id);
        
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  const fetchBusinesses = async (currentUserId: string) => {
    try {
      const { data: businessesData, error } = await supabase
        .from('businesses')
        .select(`
          *,
          owner:profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching businesses:', error);
        return;
      }

      // Enrich with ownership status
      const enrichedBusinesses = businessesData.map(business => ({
        ...business,
        is_owned: business.owner_id === currentUserId,
        products_services: business.products_services || []
      }));

      setBusinesses(enrichedBusinesses);
      setFilteredBusinesses(enrichedBusinesses);

    } catch (error) {
      console.error('Error in fetchBusinesses:', error);
    }
  };

  // Filter businesses based on search and tab
  useEffect(() => {
    let result = businesses;

    // Filter by active tab
    if (activeTab === 'my') {
      result = result.filter(business => business.is_owned);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(business => 
        business.name?.toLowerCase().includes(term) ||
        business.description?.toLowerCase().includes(term) ||
        business.address?.toLowerCase().includes(term) ||
        business.category?.toLowerCase().includes(term) ||
        business.products_services?.some((p: string) => p.toLowerCase().includes(term))
      );
    }

    setFilteredBusinesses(result);
  }, [searchTerm, activeTab, businesses]);

  const handleCreateBusiness = async () => {
    if (!userProfile) return;

    try {
      const productsArray = newBusiness.products_services
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

      const { data, error } = await supabase
        .from('businesses')
        .insert({
          owner_id: userProfile.id,
          name: newBusiness.name,
          category: newBusiness.category,
          description: newBusiness.description,
          address: newBusiness.address,
          email: newBusiness.email,
          phone: newBusiness.phone,
          website: newBusiness.website,
          operating_hours: newBusiness.operating_hours,
          products_services: productsArray,
          logo_url: newBusiness.logo_url,
          cover_image_url: newBusiness.cover_image_url,
          is_verified: false,
          rating: 0
        })
        .select(`
          *,
          owner:profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `);

      if (error) throw error;

      // Add to local state
      const newBusinessData = {
        ...data[0],
        is_owned: true,
        products_services: productsArray
      };

      setBusinesses(prev => [newBusinessData, ...prev]);
      setFilteredBusinesses(prev => [newBusinessData, ...prev]);
      setShowCreateForm(false);
      
      // Reset form
      setNewBusiness({
        name: '',
        category: '',
        description: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        operating_hours: '',
        products_services: '',
        logo_url: '',
        cover_image_url: ''
      });

      alert('Business listed successfully!');

    } catch (error) {
      console.error('Error creating business:', error);
      alert('Failed to create business');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Businesses...</p>
          <p className="text-gray-400 text-sm mt-2">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 safe-area pb-20">
      {/* HEADER */}
      <Header title="Business Directory" showBack={false} />

      {/* MAIN CONTENT */}
      <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
        {/* SEARCH & TABS */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Search businesses, products, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Users size={16} />
                All Businesses
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {businesses.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'my'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Briefcase size={16} />
                My Businesses
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {businesses.filter(b => b.is_owned).length}
                </span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800"
              >
                <Plus size={16} />
                List New
              </button>
            </div>
          </div>
        </div>

        {/* BUSINESS STATS */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{businesses.length}</div>
                <div className="text-xs text-gray-600">Total Businesses</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {businesses.filter(b => b.is_verified).length}
                </div>
                <div className="text-xs text-gray-600">Verified</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {businesses.filter(b => b.is_owned).length}
                </div>
                <div className="text-xs text-gray-600">My Businesses</div>
              </div>
            </div>
          </div>
        </div>

        {/* BUSINESS LIST */}
        <div>
          {filteredBusinesses.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {activeTab === 'all' ? (
                  <Building className="w-8 h-8 text-blue-600" />
                ) : (
                  <Briefcase className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {activeTab === 'all' ? 'No Businesses Found' : 'No Businesses Listed'}
              </h4>
              <p className="text-gray-600 text-sm mb-6">
                {searchTerm
                  ? 'Try adjusting your search'
                  : activeTab === 'all'
                  ? 'No businesses available in the directory'
                  : 'You haven\'t listed any businesses yet'}
              </p>
              {searchTerm ? (
                <button
                  onClick={clearSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  List Your First Business
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBusinesses.map(business => (
                <div 
                  key={business.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Business Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                            {business.logo_url ? (
                              <img 
                                src={business.logo_url} 
                                alt={business.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(business.name)
                            )}
                          </div>
                          {business.is_verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <CheckCircle size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 truncate">
                              {business.name}
                            </h3>
                            {business.is_owned && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs rounded-full">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {business.category}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={`${
                                    i < Math.floor(business.rating)
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {business.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Category Badge */}
                      <div className="flex-shrink-0 ml-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                          {business.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="space-y-2">
                      {business.address && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin size={12} />
                          <span className="truncate">{business.address}</span>
                        </div>
                      )}
                      
                      {business.owner && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users size={12} />
                          <span>Owner: {business.owner.first_name} {business.owner.last_name}</span>
                        </div>
                      )}
                      
                      {business.operating_hours && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock size={12} />
                          <span>{business.operating_hours}</span>
                        </div>
                      )}
                      
                      {business.products_services && business.products_services.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                          <Package size={12} className="mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {business.products_services.slice(0, 3).map((item, index) => (
                              <span key={index} className="px-2 py-0.5 bg-gray-100 rounded-md">
                                {item}
                              </span>
                            ))}
                            {business.products_services.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-500">
                                +{business.products_services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar size={12} />
                        <span>Listed {formatDate(business.created_at)}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => navigate(`/business/${business.id}`)}
                      className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                      View Business Details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CREATE BUSINESS MODAL */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">List New Business</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={newBusiness.name}
                      onChange={(e) => setNewBusiness({...newBusiness, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                      placeholder="Enter business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={newBusiness.category}
                      onChange={(e) => setNewBusiness({...newBusiness, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                    >
                      <option value="">Select category</option>
                      {categories.filter(c => c !== 'All').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newBusiness.description}
                      onChange={(e) => setNewBusiness({...newBusiness, description: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                      placeholder="Describe your business..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={14} className="inline mr-2" /> Address
                    </label>
                    <input
                      type="text"
                      value={newBusiness.address}
                      onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                      placeholder="Business address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail size={14} className="inline mr-2" /> Email
                      </label>
                      <input
                        type="email"
                        value={newBusiness.email}
                        onChange={(e) => setNewBusiness({...newBusiness, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                        placeholder="contact@business.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone size={14} className="inline mr-2" /> Phone
                      </label>
                      <input
                        type="tel"
                        value={newBusiness.phone}
                        onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe size={14} className="inline mr-2" /> Website
                    </label>
                    <input
                      type="url"
                      value={newBusiness.website}
                      onChange={(e) => setNewBusiness({...newBusiness, website: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={14} className="inline mr-2" /> Operating Hours
                    </label>
                    <input
                      type="text"
                      value={newBusiness.operating_hours}
                      onChange={(e) => setNewBusiness({...newBusiness, operating_hours: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                      placeholder="Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Package size={14} className="inline mr-2" /> Products/Services
                    </label>
                    <input
                      type="text"
                      value={newBusiness.products_services}
                      onChange={(e) => setNewBusiness({...newBusiness, products_services: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
                      placeholder="Separate with commas: Product 1, Service 2, Product 3"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleCreateBusiness}
                      disabled={!newBusiness.name || !newBusiness.category}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        !newBusiness.name || !newBusiness.category
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      }`}
                    >
                      <Plus size={16} />
                      List Business
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
};

export default Businesses;