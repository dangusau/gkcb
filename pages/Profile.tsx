import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit3, MessageCircle, UserPlus, UserMinus, Check, 
  MoreVertical, Camera, Building, Briefcase, Calendar,
  ChevronLeft, Trash2, Pencil
} from 'lucide-react';
import { profileService } from '../services/supabase/profile';
import { formatTimeAgo } from '../utils/formatters';
import EditModal from '../components/profile/EditModal';
import DeleteModal from '../components/profile/DeleteModal';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');

  const isOwner = profileData?.relationship?.is_owner;
  const isConnected = profileData?.relationship?.is_connected;
  const connectionStatus = profileData?.relationship?.connection_status;

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  useEffect(() => {
    if (profileData?.profile?.id) {
      loadTabData(activeTab, profileData.profile.id);
    }
  }, [activeTab, profileData?.profile?.id]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfileData(
        userId || 'current', 
        'current'
      );
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string, profileId: string) => {
    if (!profileData?.relationship?.is_owner && !profileData?.relationship?.is_connected) {
      return;
    }

    try {
      switch (tab) {
        case 'posts':
          const postsData = await profileService.getUserPosts(profileId, 'current');
          setPosts(postsData);
          break;
        case 'marketplace':
          const listingsData = await profileService.getUserListings(profileId, 'current');
          setListings(listingsData);
          break;
        case 'businesses':
          const businessesData = await profileService.getUserBusinesses(profileId, 'current');
          setBusinesses(businessesData);
          break;
        case 'jobs':
          const jobsData = await profileService.getUserJobs(profileId, 'current');
          setJobs(jobsData);
          break;
        case 'events':
          const eventsData = await profileService.getUserEvents(profileId, 'current');
          setEvents(eventsData);
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab}:`, error);
    }
  };

  const handleConnect = async () => {
    try {
      await profileService.toggleConnection(profileData.profile.id);
      loadProfileData();
    } catch (error) {
      console.error('Error toggling connection:', error);
    }
  };

  const handleEditProfile = () => {
    setSelectedItem({ type: 'profile', ...profileData.profile });
    setActionType('edit');
    setShowEditModal(true);
  };

  const handleEditItem = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setActionType('edit');
    setShowEditModal(true);
  };

  const handleDeleteItem = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setActionType('delete');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      switch (selectedItem.type) {
        case 'post':
          await profileService.deletePost(selectedItem.id);
          setPosts(posts.filter(p => p.id !== selectedItem.id));
          break;
        case 'listing':
          await profileService.deleteListing(selectedItem.id);
          setListings(listings.filter(l => l.id !== selectedItem.id));
          break;
        case 'business':
          await profileService.deleteBusiness(selectedItem.id);
          setBusinesses(businesses.filter(b => b.id !== selectedItem.id));
          break;
        case 'job':
          await profileService.deleteJob(selectedItem.id);
          setJobs(jobs.filter(j => j.id !== selectedItem.id));
          break;
        case 'event':
          await profileService.deleteEvent(selectedItem.id);
          setEvents(events.filter(e => e.id !== selectedItem.id));
          break;
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
    } finally {
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  const handleSave = async (updatedData: any) => {
    try {
      if (selectedItem?.type === 'profile') {
        await profileService.updateProfile(updatedData);
        loadProfileData(); // Refresh profile
      } else if (selectedItem?.type === 'listing') {
        await profileService.updateListing(selectedItem.id, updatedData);
        setListings(prev => prev.map(item => 
          item.id === selectedItem.id ? { ...item, ...updatedData } : item
        ));
      } else if (selectedItem?.type === 'business') {
        await profileService.updateBusiness(selectedItem.id, updatedData);
        setBusinesses(prev => prev.map(item => 
          item.id === selectedItem.id ? { ...item, ...updatedData } : item
        ));
      } else if (selectedItem?.type === 'job') {
        await profileService.updateJob(selectedItem.id, updatedData);
        setJobs(prev => prev.map(item => 
          item.id === selectedItem.id ? { ...item, ...updatedData } : item
        ));
      } else if (selectedItem?.type === 'event') {
        await profileService.updateEvent(selectedItem.id, updatedData);
        setEvents(prev => prev.map(item => 
          item.id === selectedItem.id ? { ...item, ...updatedData } : item
        ));
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update. Please try again.');
      throw error;
    }
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'header') => {
    try {
      await profileService.uploadProfileImage(file, type);
      loadProfileData(); // Refresh profile with new images
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <button onClick={() => navigate(-1)} className="text-blue-600">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { profile, stats, relationship } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b z-20">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Profile</h1>
          <button className="p-2">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Header Image with Upload */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 relative">
          {profile.header_image_url ? (
            <img
              src={profile.header_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : null}
          {isOwner && (
            <label className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg cursor-pointer hover:bg-white">
              <Camera size={20} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(e.target.files[0], 'header');
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Avatar with Upload */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-white shadow-2xl overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {profile.first_name?.charAt(0)}
                </div>
              )}
            </div>
            {isOwner && (
              <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0], 'avatar');
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="pt-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {profile.first_name} {profile.last_name}
        </h1>
        {profile.business_name && (
          <p className="text-gray-600 mt-1">{profile.business_name}</p>
        )}
        {profile.bio && (
          <p className="text-gray-500 mt-3">{profile.bio}</p>
        )}
        
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
          <span className="text-sm text-gray-600">
            Member since {formatTimeAgo(profile.created_at)}
          </span>
        </div>
      </div>

      <div className="px-4 mt-6 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {[
            { key: 'posts', icon: '📝', label: 'Posts', count: stats.posts_count },
            { key: 'connections', icon: '👥', label: 'Connections', count: stats.connections_count },
            { key: 'marketplace', icon: '🛒', label: 'Marketplace', count: stats.listings_count },
            { key: 'businesses', icon: '🏢', label: 'Businesses', count: stats.businesses_count },
            { key: 'jobs', icon: '💼', label: 'Jobs', count: stats.jobs_count },
            { key: 'events', icon: '📅', label: 'Events', count: stats.events_count }
          ].map((stat) => (
            <StatCard
              key={stat.key}
              icon={stat.icon}
              count={stat.count}
              label={stat.label}
              active={activeTab === stat.key}
              onClick={() => {
                if (stat.key === 'connections') {
                  navigate(`/profile/${profile.id}/connections`);
                } else {
                  setActiveTab(stat.key);
                }
              }}
            />
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex gap-3">
          {isOwner ? (
            <button 
              onClick={handleEditProfile}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:from-blue-700 hover:to-blue-800"
            >
              <Edit3 size={20} />
              Edit Profile
            </button>
          ) : isConnected ? (
            <>
              <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                <MessageCircle size={20} />
                Message
              </button>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200"
              >
                <UserMinus size={20} />
              </button>
            </>
          ) : connectionStatus === 'pending' ? (
            <button
              onClick={handleConnect}
              className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-600"
            >
              <Check size={20} />
              Pending
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:from-green-600 hover:to-emerald-700"
            >
              <UserPlus size={20} />
              Connect
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 border-t">
        <div className="flex border-b">
          {['posts', 'marketplace', 'businesses', 'jobs', 'events'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'posts' && (
            <PostGrid posts={posts} isOwner={isOwner} onDelete={handleDeleteItem} />
          )}
          {activeTab === 'marketplace' && (
            <ListingGrid 
              listings={listings} 
              isOwner={isOwner} 
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}
          {activeTab === 'businesses' && (
            <BusinessGrid 
              businesses={businesses} 
              isOwner={isOwner} 
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}
          {activeTab === 'jobs' && (
            <JobGrid 
              jobs={jobs} 
              isOwner={isOwner} 
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}
          {activeTab === 'events' && (
            <EventGrid 
              events={events} 
              isOwner={isOwner} 
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditModal
          type={selectedItem?.type}
          data={selectedItem}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          type={selectedItem?.type}
          name={selectedItem?.title || selectedItem?.name || selectedItem?.content?.substring(0, 30)}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

// Supporting Components
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="h-48 bg-gray-200 animate-pulse"></div>
    <div className="px-4 -mt-16">
      <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto animate-pulse"></div>
    </div>
  </div>
);

const StatCard = ({ icon, count, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-4 rounded-2xl min-w-[100px] transition-all ${
      active 
        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' 
        : 'bg-white border border-gray-200 hover:bg-gray-50'
    }`}
  >
    <span className="text-2xl mb-2">{icon}</span>
    <span className="text-xl font-bold text-gray-900">{count}</span>
    <span className="text-sm text-gray-600 mt-1">{label}</span>
  </button>
);

const PostGrid = ({ posts, isOwner, onDelete }: any) => {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No Posts"
        description={isOwner ? "You haven't created any posts yet." : "No posts to show."}
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {posts.map((post: any) => (
        <div key={post.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
          {post.media_urls?.[0] && (
            <img
              src={post.media_urls[0]}
              alt="Post"
              className="w-full h-full object-cover"
            />
          )}
          {isOwner && (
            <button 
              onClick={() => onDelete(post, 'post')}
              className="absolute top-2 right-2 w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const ListingGrid = ({ listings, isOwner, onEdit, onDelete }: any) => {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="No Listings"
        description={isOwner ? "You haven't created any listings yet." : "No listings to show."}
      />
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing: any) => (
        <div key={listing.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {listing.images?.[0] && (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{listing.title}</h3>
              <p className="text-blue-600 font-bold">₦{listing.price?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{listing.location}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {listing.category}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {listing.condition}
                </span>
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onEdit(listing, 'listing')}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => onDelete(listing, 'listing')}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const BusinessGrid = ({ businesses, isOwner, onEdit, onDelete }: any) => {
  if (businesses.length === 0) {
    return (
      <EmptyState
        icon={<Building size={48} className="text-gray-400" />}
        title="No Businesses"
        description={isOwner ? "You haven't added any businesses yet." : "No businesses to show."}
      />
    );
  }

  return (
    <div className="space-y-4">
      {businesses.map((business: any) => (
        <div key={business.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {business.logo_url && (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{business.name}</h3>
              <p className="text-sm text-gray-600">{business.business_type} • {business.category}</p>
              <p className="text-sm text-gray-500">{business.location_axis}</p>
              {business.average_rating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm text-gray-700">{business.average_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {isOwner && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onEdit(business, 'business')}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => onDelete(business, 'business')}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const JobGrid = ({ jobs, isOwner, onEdit, onDelete }: any) => {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase size={48} className="text-gray-400" />}
        title="No Jobs"
        description={isOwner ? "You haven't posted any jobs yet." : "No jobs to show."}
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job: any) => (
        <div key={job.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900">{job.title}</h3>
              <p className="text-blue-600 font-bold">{job.salary}</p>
              <p className="text-sm text-gray-600">{job.job_type} • {job.location}</p>
              {job.description && (
                <p className="text-sm text-gray-500 mt-2">{job.description.substring(0, 100)}...</p>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(job, 'job')}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => onDelete(job, 'job')}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const EventGrid = ({ events, isOwner, onEdit, onDelete }: any) => {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={48} className="text-gray-400" />}
        title="No Events"
        description={isOwner ? "You haven't created any events yet." : "No events to show."}
      />
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event: any) => (
        <div key={event.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(event.event_date).toLocaleDateString()} • {event.location}
              </p>
              {event.description && (
                <p className="text-sm text-gray-500 mt-2">{event.description.substring(0, 100)}...</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-500">{event.rsvp_count} RSVPs</span>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(event, 'event')}
                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => onDelete(event, 'event')}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ icon, title, description }: any) => (
  <div className="text-center py-12">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Profile;