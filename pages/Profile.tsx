import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit3, MessageCircle, UserPlus, UserMinus, Check, 
  MoreVertical, Camera, Building, Briefcase, Calendar,
  ChevronLeft, Upload, X
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<'edit' | 'delete'>('edit');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedItem({ ...profileData.profile, itemType: 'profile' });
    setActionType('edit');
    setShowEditModal(true);
  };

  const handleEditItem = (item: any, type: string) => {
    setSelectedItem({ ...item, itemType: type });
    setActionType('edit');
    setShowEditModal(true);
  };

  const handleDeleteItem = (item: any, type: string) => {
    setSelectedItem({ ...item, itemType: type });
    setActionType('delete');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      switch (selectedItem.itemType) {
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
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    console.log('Profile: handleSaveEdit called');
    console.log('Updated data:', updatedData);
    console.log('Selected item:', selectedItem);
    
    try {
      // Determine what type of item we're editing
      const itemType = selectedItem?.itemType;
      
      if (itemType === 'profile') {
        console.log('Updating profile data...');
        
        // Use the new updateProfileData function (text only)
        await profileService.updateProfileData(updatedData);
        
        // Reload profile data
        await loadProfileData();
        console.log('Profile updated successfully');
        
      } else if (itemType === 'post') {
        await profileService.updatePost(selectedItem.id, {
          content: updatedData.content,
          privacy: updatedData.privacy || 'public'
        });
        if (profileData?.profile?.id) {
          const postsData = await profileService.getUserPosts(profileData.profile.id, 'current');
          setPosts(postsData);
        }
      } else if (itemType === 'listing') {
        await profileService.updateListing(selectedItem.id, {
          title: updatedData.title,
          description: updatedData.description || '',
          price: updatedData.price,
          category: updatedData.category || '',
          condition: updatedData.condition || 'used',
          location: updatedData.location || ''
        });
        if (profileData?.profile?.id) {
          const listingsData = await profileService.getUserListings(profileData.profile.id, 'current');
          setListings(listingsData);
        }
      } else if (itemType === 'business') {
        await profileService.updateBusiness(selectedItem.id, {
          name: updatedData.name,
          description: updatedData.description || '',
          business_type: updatedData.business_type,
          category: updatedData.category,
          location_axis: updatedData.location_axis,
          address: updatedData.address || '',
          email: updatedData.email || '',
          phone: updatedData.phone || '',
          website: updatedData.website || ''
        });
        if (profileData?.profile?.id) {
          const businessesData = await profileService.getUserBusinesses(profileData.profile.id, 'current');
          setBusinesses(businessesData);
        }
      } else if (itemType === 'job') {
        await profileService.updateJob(selectedItem.id, {
          title: updatedData.title,
          description: updatedData.description || '',
          salary: updatedData.salary || '',
          job_type: updatedData.job_type || 'full-time',
          location: updatedData.location || ''
        });
        if (profileData?.profile?.id) {
          const jobsData = await profileService.getUserJobs(profileData.profile.id, 'current');
          setJobs(jobsData);
        }
      } else if (itemType === 'event') {
        await profileService.updateEvent(selectedItem.id, {
          title: updatedData.title,
          description: updatedData.description || '',
          event_date: updatedData.event_date,
          location: updatedData.location || ''
        });
        if (profileData?.profile?.id) {
          const eventsData = await profileService.getUserEvents(profileData.profile.id, 'current');
          setEvents(eventsData);
        }
      }
      
      setShowEditModal(false);
      setSelectedItem(null);
      
    } catch (error: any) {
      console.error('Error saving:', error);
      throw error;
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileData?.profile?.id) return;

    try {
      setUploadingAvatar(true);
      
      // Use the dedicated avatar update function
      await profileService.updateProfileAvatar(file);
      
      // Reload profile data
      await loadProfileData();
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleHeaderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileData?.profile?.id) return;

    try {
      setUploadingHeader(true);
      
      // Use the dedicated header update function
      await profileService.updateProfileHeader(file);
      
      // Reload profile data
      await loadProfileData();
      
    } catch (error) {
      console.error('Error uploading header:', error);
      alert('Failed to upload cover photo. Please try again.');
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) {
        headerInputRef.current.value = '';
      }
    }
  };

  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const triggerHeaderUpload = () => {
    headerInputRef.current?.click();
  };

  const removeAvatar = async () => {
    if (!profileData?.profile?.id) return;

    if (!window.confirm('Remove profile picture?')) return;

    try {
      setUploadingAvatar(true);
      
      // Use the dedicated avatar removal function
      await profileService.removeProfileAvatar();
      
      // Reload profile data
      await loadProfileData();
      
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Failed to remove profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeHeader = async () => {
    if (!profileData?.profile?.id) return;

    if (!window.confirm('Remove cover photo?')) return;

    try {
      setUploadingHeader(true);
      
      // Use the dedicated header removal function
      await profileService.removeProfileHeader();
      
      // Reload profile data
      await loadProfileData();
      
    } catch (error) {
      console.error('Error removing header:', error);
      alert('Failed to remove cover photo. Please try again.');
    } finally {
      setUploadingHeader(false);
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
      {/* Hidden file inputs for image uploads */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={headerInputRef}
        onChange={handleHeaderUpload}
        accept="image/*"
        className="hidden"
      />

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
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 relative">
          {profile.header_image_url ? (
            <img
              src={profile.header_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : null}
          
          {isOwner && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {profile.header_image_url && (
                <button 
                  onClick={removeHeader}
                  disabled={uploadingHeader}
                  className="bg-red-500/90 backdrop-blur-sm p-2 rounded-full shadow-lg text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  title="Remove cover photo"
                >
                  <X size={20} />
                </button>
              )}
              <button 
                onClick={triggerHeaderUpload}
                disabled={uploadingHeader}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white disabled:opacity-50 transition-colors"
                title="Change cover photo"
              >
                {uploadingHeader ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={20} />
                )}
              </button>
            </div>
          )}
        </div>

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
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                {profile.avatar_url && (
                  <button 
                    onClick={removeAvatar}
                    disabled={uploadingAvatar}
                    className="w-8 h-8 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 disabled:opacity-50 transition-colors"
                    title="Remove profile picture"
                  >
                    <X size={14} />
                  </button>
                )}
                <button 
                  onClick={triggerAvatarUpload}
                  disabled={uploadingAvatar}
                  className="w-8 h-8 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  title="Change profile picture"
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                </button>
              </div>
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
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              <Edit3 size={20} />
              Edit Profile
            </button>
          ) : isConnected ? (
            <>
              <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                <MessageCircle size={20} />
                Message
              </button>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <UserMinus size={20} />
              </button>
            </>
          ) : connectionStatus === 'pending' ? (
            <button
              onClick={handleConnect}
              className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors"
            >
              <Check size={20} />
              Pending
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all"
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
              className={`flex-1 py-4 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'posts' && (
            <PostGrid 
              posts={posts} 
              isOwner={isOwner} 
              onEdit={(post) => handleEditItem(post, 'post')}
              onDelete={(post) => handleDeleteItem(post, 'post')}
            />
          )}
          {activeTab === 'marketplace' && (
            <ListingGrid 
              listings={listings} 
              isOwner={isOwner} 
              onEdit={(listing) => handleEditItem(listing, 'listing')}
              onDelete={(listing) => handleDeleteItem(listing, 'listing')}
            />
          )}
          {activeTab === 'businesses' && (
            <BusinessGrid 
              businesses={businesses} 
              isOwner={isOwner} 
              onEdit={(business) => handleEditItem(business, 'business')}
              onDelete={(business) => handleDeleteItem(business, 'business')}
            />
          )}
          {activeTab === 'jobs' && (
            <JobGrid 
              jobs={jobs} 
              isOwner={isOwner} 
              onEdit={(job) => handleEditItem(job, 'job')}
              onDelete={(job) => handleDeleteItem(job, 'job')}
            />
          )}
          {activeTab === 'events' && (
            <EventGrid 
              events={events} 
              isOwner={isOwner} 
              onEdit={(event) => handleEditItem(event, 'event')}
              onDelete={(event) => handleDeleteItem(event, 'event')}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        type={selectedItem?.itemType || 'profile'}
        data={selectedItem}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Delete Modal */}
      <DeleteModal
        type={selectedItem?.itemType}
        name={selectedItem?.title || selectedItem?.name || selectedItem?.first_name}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onConfirm={confirmDelete}
      />
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

const PostGrid = ({ posts, isOwner, onEdit, onDelete }: any) => {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No Posts"
        description={isOwner ? "You haven't created any posts yet." : "No posts to show."}
        action={isOwner ? "Create Post" : null}
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
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(post)}
                  className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                  title="Edit post"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => onDelete(post)}
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  title="Delete post"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
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
        action={isOwner ? "Create Listing" : null}
      />
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing: any) => (
        <div key={listing.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
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
              <h3 className="font-bold">{listing.title}</h3>
              <p className="text-blue-600 font-bold">₦{listing.price?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{listing.location}</p>
            </div>
            {isOwner && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onEdit(listing)}
                  className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(listing)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Delete
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
        action={isOwner ? "Add Business" : null}
      />
    );
  }

  return (
    <div className="space-y-4">
      {businesses.map((business: any) => (
        <div key={business.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
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
              <h3 className="font-bold">{business.name}</h3>
              <p className="text-sm text-gray-600">{business.business_type} • {business.category}</p>
              <p className="text-sm text-gray-500">{business.location_axis}</p>
            </div>
            {isOwner && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onEdit(business)}
                  className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(business)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Delete
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
        action={isOwner ? "Post Job" : null}
      />
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job: any) => (
        <div key={job.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
          <h3 className="font-bold">{job.title}</h3>
          <p className="text-blue-600 font-bold">{job.salary}</p>
          <p className="text-sm text-gray-600">{job.job_type} • {job.location}</p>
          <p className="text-sm text-gray-500 mt-2">{job.description?.substring(0, 100)}...</p>
          {isOwner && (
            <div className="mt-3 flex gap-4 justify-end">
              <button 
                onClick={() => onEdit(job)}
                className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(job)}
                className="text-red-500 hover:text-red-700 text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          )}
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
        action={isOwner ? "Create Event" : null}
      />
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event: any) => (
        <div key={event.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
          <h3 className="font-bold">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {new Date(event.event_date).toLocaleDateString()} • {event.location}
          </p>
          <p className="text-sm text-gray-500 mt-2">{event.description?.substring(0, 100)}...</p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500">{event.rsvp_count} RSVPs</span>
            {isOwner && (
              <div className="flex gap-4">
                <button 
                  onClick={() => onEdit(event)}
                  className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(event)}
                  className="text-red-500 hover:text-red-700 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ icon, title, description, action }: any) => (
  <div className="text-center py-12">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    {action && (
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
        {action}
      </button>
    )}
  </div>
);

export default Profile;