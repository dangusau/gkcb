// pages/admin/Pioneers.tsx
import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, 
  Filter, RefreshCw,
  CheckCircle, XCircle, Upload, X,
  Image as ImageIcon, AlertCircle, Check,
  ArrowUp, ArrowDown, Calendar, Ban,
  Save, Loader2
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';

interface Pioneer {
  id: string;
  name: string;
  title: string;
  image_url?: string;
  bio?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export default function Pioneers() {
  const [pioneers, setPioneers] = useState<Pioneer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    image_url: '',
    order_index: 0,
    is_active: true
  });

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPioneers();
  }, [statusFilter]);

  // FIXED: Use direct Supabase query
  const fetchPioneers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('pioneers')
        .select('*')
        .order('order_index', { ascending: true });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,title.ilike.%${search}%,bio.ilike.%${search}%`);
      }

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pioneers:', error);
        toast.error('Failed to load pioneers');
        return;
      }

      setPioneers(data || []);
    } catch (error) {
      console.error('Error fetching pioneers:', error);
      toast.error('Error loading pioneers');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // FIXED: Better image upload with detailed feedback
  const uploadImage = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `pioneer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `pioneers/${fileName}`;

      console.log('Uploading image to media bucket:', { filePath, fileName, size: file.size });

      // Upload to Supabase storage - using 'media' bucket
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error details:', error);
        throw new Error(`Failed to upload image to storage: ${error.message}`);
      }

      console.log('Image uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('Error in uploadImage:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // FIXED: Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters';
    }

    if (formData.bio && formData.bio.length > 2000) {
      errors.bio = 'Biography cannot exceed 2000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // FIXED: handleAdd function with detailed error handling
  const handleAdd = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    setProcessingAction('add-pioneer');
    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (selectedFile) {
        try {
          toast.loading('Uploading image...', { id: 'image-upload' });
          imageUrl = await uploadImage(selectedFile);
          toast.success('Image uploaded successfully!', { id: 'image-upload' });
        } catch (error: any) {
          console.error('Image upload error:', error);
          toast.error(`Image upload failed: ${error.message}`, { id: 'image-upload' });
          // Continue without image if upload fails
          imageUrl = formData.image_url || null;
        }
      }

      // Get the next order index
      const nextOrderIndex = pioneers.length > 0 
        ? Math.max(...pioneers.map(p => p.order_index)) + 1 
        : 1;

      console.log('Inserting pioneer with data:', {
        name: formData.name.trim(),
        title: formData.title.trim(),
        bio: formData.bio.trim() || null,
        image_url: imageUrl || null,
        order_index: nextOrderIndex,
        is_active: formData.is_active
      });

      // Direct Supabase insert
      const { data, error } = await supabase
        .from('pioneers')
        .insert([{
          name: formData.name.trim(),
          title: formData.title.trim(),
          bio: formData.bio.trim() || null,
          image_url: imageUrl || null,
          order_index: nextOrderIndex,
          is_active: formData.is_active
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error details:', error);
        
        // Check for specific constraint violations
        if (error.code === '23505') {
          toast.error('A pioneer with this name or title already exists');
        } else if (error.code === '23502') {
          toast.error('Required fields are missing');
        } else {
          toast.error(`Failed to add pioneer: ${error.message}`);
        }
        
        // Log detailed error for debugging
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return;
      }

      console.log('Pioneer inserted successfully:', data);

      // SUCCESS: Show success message and close modal
      toast.success(`"${formData.name}" added as pioneer!`);
      
      // Reset form and close modal
      resetForm();
      setShowAddModal(false);
      
      // Refresh the pioneers list
      fetchPioneers();

    } catch (error: any) {
      console.error('Unexpected error adding pioneer:', error);
      toast.error(`Error adding pioneer: ${error.message}`);
    } finally {
      setProcessingAction(null);
    }
  };

  // FIXED: Use direct Supabase delete
  const handleRemove = async (pioneerId: string, pioneerName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${pioneerName}" as a pioneer?`)) return;
    
    setProcessingAction(`remove-${pioneerId}`);
    try {
      const { error } = await supabase
        .from('pioneers')
        .delete()
        .eq('id', pioneerId);

      if (error) {
        console.error('Error removing pioneer:', error);
        toast.error('Failed to remove pioneer');
        return;
      }

      toast.success(`"${pioneerName}" removed successfully`);
      fetchPioneers();
    } catch (error: any) {
      console.error('Error removing pioneer:', error);
      toast.error('Error removing pioneer');
    } finally {
      setProcessingAction(null);
    }
  };

  // FIXED: Use direct Supabase update
  const handleToggleActive = async (pioneerId: string, currentStatus: boolean, pioneerName: string) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${pioneerName}"?`)) return;
    
    setProcessingAction(`toggle-${pioneerId}`);
    try {
      const { error } = await supabase
        .from('pioneers')
        .update({ is_active: !currentStatus })
        .eq('id', pioneerId);

      if (error) {
        console.error('Error updating pioneer:', error);
        toast.error(`Failed to ${action} pioneer`);
        return;
      }

      toast.success(`Pioneer ${action}d successfully`);
      fetchPioneers();
    } catch (error: any) {
      console.error('Error updating pioneer:', error);
      toast.error('Error updating pioneer');
    } finally {
      setProcessingAction(null);
    }
  };

  // FIXED: Use direct Supabase updates for reordering
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const updatedPioneers = [...pioneers];
    const temp = updatedPioneers[index];
    updatedPioneers[index] = updatedPioneers[index - 1];
    updatedPioneers[index - 1] = temp;

    // Update order indices
    const reordered = updatedPioneers.map((pioneer, idx) => ({
      ...pioneer,
      order_index: idx + 1
    }));

    setPioneers(reordered);

    try {
      // Update all pioneers with new order
      const updates = reordered.map(pioneer =>
        supabase
          .from('pioneers')
          .update({ order_index: pioneer.order_index })
          .eq('id', pioneer.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        throw new Error('Some updates failed');
      }
      
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      fetchPioneers(); // Revert on error
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === pioneers.length - 1) return;
    
    const updatedPioneers = [...pioneers];
    const temp = updatedPioneers[index];
    updatedPioneers[index] = updatedPioneers[index + 1];
    updatedPioneers[index + 1] = temp;

    // Update order indices
    const reordered = updatedPioneers.map((pioneer, idx) => ({
      ...pioneer,
      order_index: idx + 1
    }));

    setPioneers(reordered);

    try {
      // Update all pioneers with new order
      const updates = reordered.map(pioneer =>
        supabase
          .from('pioneers')
          .update({ order_index: pioneer.order_index })
          .eq('id', pioneer.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        throw new Error('Some updates failed');
      }
      
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
      fetchPioneers(); // Revert on error
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      bio: '',
      image_url: '',
      order_index: 0,
      is_active: true
    });
    setSelectedFile(null);
    setImagePreview(null);
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  if (loading && pioneers.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pioneers Management</h1>
          <p className="text-gray-600">Manage community pioneers and their display order</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPioneers}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pioneer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPioneers()}
                placeholder="Search by name or title..."
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchPioneers}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Pioneers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pioneers.map((pioneer, index) => (
          <div
            key={pioneer.id}
            className={`bg-white rounded-lg shadow-sm border ${pioneer.is_active ? 'border-gray-200' : 'border-gray-300 opacity-80'} overflow-hidden hover:shadow-md transition-shadow`}
          >
            <div className="p-6">
              {/* Header with drag handles and status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === pioneers.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    #{pioneer.order_index}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(pioneer.id, pioneer.is_active, pioneer.name)}
                    disabled={processingAction === `toggle-${pioneer.id}`}
                    className={`p-1.5 rounded-full ${pioneer.is_active ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} disabled:opacity-50`}
                    title={pioneer.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                  >
                    {processingAction === `toggle-${pioneer.id}` ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : pioneer.is_active ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemove(pioneer.id, pioneer.name)}
                    disabled={processingAction === `remove-${pioneer.id}`}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full disabled:opacity-50"
                    title="Remove Pioneer"
                  >
                    {processingAction === `remove-${pioneer.id}` ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Pioneer Image & Info */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-20 w-20 flex-shrink-0 relative">
                  <img
                    className="h-20 w-20 rounded-full object-cover border-2 border-white shadow"
                    src={pioneer.image_url || `https://ui-avatars.com/api/?name=${pioneer.name}&background=random&color=fff&size=128`}
                    alt={pioneer.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${pioneer.name}&background=random&color=fff&size=128`;
                    }}
                  />
                  {!pioneer.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Ban className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{pioneer.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{pioneer.title}</p>
                  <div className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${pioneer.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                    {pioneer.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {pioneer.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {pioneer.bio}
                </p>
              )}

              {/* Footer - Remove View button as requested */}
              <div className="text-sm text-gray-500 pt-4 border-t border-gray-100 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(pioneer.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pioneers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No pioneers found</h3>
          <p className="text-gray-500 mb-4">Add your first pioneer to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Pioneer
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Pioneer</h3>
                <p className="text-sm text-gray-500">Fill in the details below</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                disabled={processingAction === 'add-pioneer'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-24 flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative h-24 w-24">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-24 w-24 rounded-full object-cover border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                          disabled={processingAction === 'add-pioneer'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="pioneer-image-upload"
                      disabled={processingAction === 'add-pioneer'}
                    />
                    <label
                      htmlFor="pioneer-image-upload"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center cursor-pointer ${processingAction === 'add-pioneer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {selectedFile ? 'Change Image' : 'Upload Image'}
                        </>
                      )}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: Square image, max 5MB
                    </p>
                    {selectedFile && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  className={`w-full border ${formErrors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${processingAction === 'add-pioneer' ? 'opacity-50' : ''}`}
                  placeholder="John Doe"
                  required
                  disabled={processingAction === 'add-pioneer'}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title/Position *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                  }}
                  className={`w-full border ${formErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${processingAction === 'add-pioneer' ? 'opacity-50' : ''}`}
                  placeholder="Community Leader, Founder, etc."
                  required
                  disabled={processingAction === 'add-pioneer'}
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biography
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => {
                    setFormData({ ...formData, bio: e.target.value });
                    if (formErrors.bio) setFormErrors({ ...formErrors, bio: '' });
                  }}
                  className={`w-full border ${formErrors.bio ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${processingAction === 'add-pioneer' ? 'opacity-50' : ''}`}
                  rows={3}
                  placeholder="Short biography about this pioneer..."
                  maxLength={2000}
                  disabled={processingAction === 'add-pioneer'}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <div>
                    {formErrors.bio && (
                      <span className="text-red-600">{formErrors.bio}</span>
                    )}
                  </div>
                  <div>
                    {formData.bio.length}/2000 characters
                  </div>
                </div>
              </div>

              {/* Manual Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Alternative to upload)
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                  disabled={processingAction === 'add-pioneer'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank if uploading image
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={processingAction === 'add-pioneer'}
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (visible to community)
                </label>
              </div>

              {/* Form Validation Errors Summary */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {Object.values(formErrors).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={processingAction === 'add-pioneer'}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.name.trim() || !formData.title.trim() || processingAction === 'add-pioneer'}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {processingAction === 'add-pioneer' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Pioneer...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Pioneer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}