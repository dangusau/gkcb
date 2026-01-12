import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Check, Clock, MapPin, Building, Map, Users, UserCheck } from 'lucide-react';
import { membersService } from '../services/supabase/members';
import { useConnections } from '../hooks/useConnections';
import { Member } from '../types/index';
import { formatTimeAgo } from '../utils/formatters';

const Members: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'connections' | 'requests'>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [marketArea, setMarketArea] = useState('');

  const { 
    receivedRequests, 
    friends, 
    loading: connectionsLoading, 
    loadReceivedRequests, 
    loadFriends, 
    acceptRequest, 
    rejectRequest 
  } = useConnections();

  const marketAreas = [
    'Central / Old City',
    'Sabon Gari / Kantin Kwari',
    'Farm Center / Beirut',
    'France Road',
    'Zoo Road',
    'Zaria Road',
    'Dawanau',
    'Sharada / Challawa',
    'Hotoro',
    'Gyadi-Gyadi / Tarauni',
    'Jigawa Road',
    'Mariri / Sheka',
    'Bompai',
    'Transport (Kano Line / Sabon Gari Park)',
    'Others'
  ];

  const loadMembers = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const data = await membersService.getMembers(search, businessType, marketArea, currentPage, 20);
      
      if (reset) {
        setMembers(data);
        setPage(1);
      } else {
        setMembers(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(data.length === 20);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all') {
      loadMembers(true);
    } else if (activeTab === 'requests') {
      loadReceivedRequests();
    } else if (activeTab === 'connections') {
      loadFriends();
    }
  }, [search, businessType, marketArea, activeTab]);

  const handleConnect = async (memberId: string) => {
    try {
      await membersService.sendConnectionRequest(memberId);
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, connection_status: 'pending' }
          : member
      ));
    } catch (error) {
      console.error('Error sending connection:', error);
    }
  };

  const getConnectionButton = (member: Member) => {
    switch (member.connection_status) {
      case 'accepted':
        return (
          <button className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-300 text-sm">
            <Check size={14} />
            Connected
          </button>
        );
      case 'pending':
        return (
          <button className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-300 text-sm">
            <Clock size={14} />
            Pending
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleConnect(member.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm border border-blue-700"
          >
            <UserPlus size={14} />
            Connect
          </button>
        );
    }
  };

  const clearFilters = () => {
    setSearch('');
    setBusinessType('');
    setMarketArea('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b border-blue-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold mb-1">GKBC Kano Members Directory</h1>
          <p className="text-blue-200 text-sm">Connect with business people across Kano markets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-blue-200">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('all')} 
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              All Members
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('connections')} 
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'connections' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck size={18} />
              Connections
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('requests')} 
            className={`flex-1 py-3 text-center font-medium relative ${activeTab === 'requests' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus size={18} />
              Requests
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Search & Filters - Only show on All Members tab */}
      {activeTab === 'all' && (
        <div className="sticky top-14 z-10 bg-white border-b border-blue-200 p-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col space-y-3">
              {/* Main Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, business..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Business Type Filter */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building size={14} className="text-gray-500" />
                    <label className="text-xs text-gray-600 font-medium">Business Type</label>
                  </div>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Business Types</option>
                    <option value="Retail">Retail</option>
                    <option value="Services">Services</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Technology">Technology</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Import/Export">Import/Export</option>
                  </select>
                </div>

                {/* Market Area Filter */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Map size={14} className="text-gray-500" />
                    <label className="text-xs text-gray-600 font-medium">Market Area</label>
                  </div>
                  <select
                    value={marketArea}
                    onChange={(e) => setMarketArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Market Areas</option>
                    {marketAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 text-sm font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-3">
        {/* All Members Tab */}
        {activeTab === 'all' && (
          <>
            {loading && page === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-blue-200 animate-pulse">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center border border-blue-300">
                  <Building size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No members found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="bg-white rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-colors hover:shadow-sm">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden border-2 border-blue-300 shadow flex-shrink-0">
                            {member.avatar_url ? (
                              <img 
                                src={member.avatar_url} 
                                alt={member.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="font-bold text-gray-900 text-sm">
                                {member.first_name} {member.last_name}
                              </h3>
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded border border-blue-300">
                                ✓
                              </span>
                            </div>
                            {member.business_name && (
                              <p className="text-gray-700 text-xs font-medium truncate max-w-[120px]">
                                {member.business_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          {getConnectionButton(member)}
                        </div>
                      </div>

                      {member.business_type && (
                        <div className="mb-2">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-200">
                            {member.business_type}
                          </span>
                        </div>
                      )}

                      {member.market_area && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-blue-500" />
                            <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-300">
                              {member.market_area}
                            </span>
                          </div>
                        </div>
                      )}

                      {member.location && member.location !== member.market_area && (
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs mb-2">
                          <MapPin size={12} className="text-gray-400" />
                          <span className="truncate">{member.location}</span>
                        </div>
                      )}

                      {member.bio && (
                        <p className="text-gray-700 text-xs line-clamp-2 mt-1">{member.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {members.length > 0 && (
              <div className="flex justify-between items-center mt-6 mb-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{members.length}</span> members
                  {(search || businessType || marketArea) && (
                    <span className="ml-2">
                      matching your filters
                    </span>
                  )}
                </div>
                {hasMore && (
                  <button
                    onClick={() => loadMembers(false)}
                    disabled={loading}
                    className="px-5 py-2.5 bg-white text-blue-600 font-medium rounded-lg border border-blue-300 hover:bg-blue-50 text-sm disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More Members'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div>
            {connectionsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center border border-blue-300">
                  <UserCheck size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h3>
                <p className="text-gray-600 mb-4">Connect with members to build your network</p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Browse Members
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.user_id} className="bg-white rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden border-2 border-blue-300">
                          {friend.user_avatar ? (
                            <img src={friend.user_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {friend.user_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{friend.user_name}</h3>
                          <p className="text-sm text-gray-500">{friend.user_email}</p>
                          <p className="text-xs text-gray-400">Connected {formatTimeAgo(friend.connected_at)}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-300 text-sm">
                        <Check size={14} />
                        Connected
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {connectionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center border border-blue-300">
                  <UserPlus size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No connection requests</h3>
                <p className="text-gray-600">When someone sends you a connection request, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full overflow-hidden border-2 border-blue-300">
                        {request.sender_avatar ? (
                          <img src={request.sender_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {request.sender_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{request.sender_name}</h3>
                        <p className="text-sm text-gray-500">{request.sender_email}</p>
                        <p className="text-xs text-gray-400">Sent {formatTimeAgo(request.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;