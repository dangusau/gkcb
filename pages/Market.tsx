import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, ShoppingBag, Upload, Tag, MapPin, DollarSign, Filter, Package, X, Image as ImageIcon } from 'lucide-react';
import { Classified } from '../types';
import { supabase } from '../services/supabase';

const Market = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<Classified[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    
    // Form state
    const [classifiedForm, setClassifiedForm] = useState({
        title: '',
        price: '',
        category: '',
        condition: '',
        location: '',
        description: '',
        image_url: ''
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        const fetchClassifieds = async () => {
            try {
                setLoading(true);
                
                // Fetch classifieds with seller info
                const { data, error } = await supabase
                    .from('classifieds')
                    .select(`
                        *,
                        seller:profiles!classifieds_seller_id_fkey (
                            id,
                            first_name,
                            last_name
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                setItems(data || []);
            } catch (error) {
                console.error('Error fetching classifieds:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClassifieds();
    }, []);

    const categories = ['All', 'Machinery', 'Real Estate', 'Vehicles', 'Electronics', 'Services', 'Fashion', 'Home & Garden', 'Other'];

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                setImageError('Please select an image file (JPG, PNG, etc.)');
                return;
            }
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setImageError('Image size should be less than 5MB');
                return;
            }
            
            setSelectedImage(file);
            setImageError(null);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImageToStorage = async (file: File): Promise<string | null> => {
        try {
            setUploading(true);
            
            // First, check if user is authenticated
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setImageError('Please sign in to upload images');
                return null;
            }

            // Create a unique file name
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('classifieds')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                
                // If bucket doesn't exist, try alternative approach
                if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
                    setImageError('Image upload not available. Please use image URL instead.');
                    return null;
                }
                
                throw uploadError;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('classifieds')
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            setImageError('Failed to upload image. Please try using a URL instead.');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClassifiedForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setImageError(null);
    };

    const handleCreateClassified = async () => {
        if (!classifiedForm.title || !classifiedForm.price) {
            alert('Please fill in title and price');
            return;
        }

        try {
            // Get authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to post a listing');
                navigate('/auth');
                return;
            }

            // Check if profile exists, create if not
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                // Profile doesn't exist, create one
                const { error: createError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: user.id,
                            first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
                            email: user.email || '',
                            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                            role: 'member',
                            approval_status: 'pending'
                        }
                    ]);

                if (createError) {
                    console.error('Error creating profile:', createError);
                    // Continue anyway, the classified will use user.id as seller_id
                }
            }

            // Handle image - try upload first, then fall back to URL
            let imageUrl = classifiedForm.image_url;
            
            if (selectedImage) {
                console.log('Attempting to upload image...');
                const uploadedUrl = await uploadImageToStorage(selectedImage);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                    console.log('Image uploaded successfully');
                } else {
                    console.log('Image upload failed, using URL if provided');
                    // Keep the existing URL or leave as empty string
                }
            }

            const newClassified = {
                title: classifiedForm.title,
                price: classifiedForm.price,
                category: classifiedForm.category || null,
                condition: classifiedForm.condition || null,
                location: classifiedForm.location || null,
                description: classifiedForm.description || null,
                image_url: imageUrl || null,
                seller_id: user.id,
                created_at: new Date().toISOString(),
            };

            console.log('Creating classified:', newClassified);

            const { data, error } = await supabase
                .from('classifieds')
                .insert([newClassified])
                .select()
                .single();

            if (error) {
                console.error('Error creating classified:', error);
                
                // If there's a foreign key error, try without seller_id first
                if (error.message.includes('foreign key constraint')) {
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('classifieds')
                        .insert([{
                            ...newClassified,
                            seller_id: null
                        }])
                        .select()
                        .single();
                    
                    if (fallbackError) throw fallbackError;
                    
                    // Success with fallback
                    data = fallbackData;
                } else {
                    throw error;
                }
            }

            // Refresh classifieds list
            const { data: updatedClassifieds, error: classifiedsError } = await supabase
                .from('classifieds')
                .select(`
                    *,
                    seller:profiles!classifieds_seller_id_fkey (
                        id,
                        first_name,
                        last_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (classifiedsError) {
                console.error('Error refreshing classifieds:', classifiedsError);
                // Don't throw, just continue
            } else {
                setItems(updatedClassifieds || []);
            }
            
            setIsCreating(false);
            
            // Reset form
            setClassifiedForm({
                title: '',
                price: '',
                category: '',
                condition: '',
                location: '',
                description: '',
                image_url: ''
            });
            setSelectedImage(null);
            setImagePreview(null);
            setImageError(null);
            
            alert('Listing created successfully!');
            
        } catch (error) {
            console.error('Error creating listing:', error);
            
            // Try one more time without image_url
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');
                
                const fallbackClassified = {
                    title: classifiedForm.title,
                    price: classifiedForm.price,
                    category: classifiedForm.category || null,
                    condition: classifiedForm.condition || null,
                    location: classifiedForm.location || null,
                    description: classifiedForm.description || null,
                    image_url: null, // Force null to avoid upload issues
                    seller_id: user.id,
                    created_at: new Date().toISOString(),
                };
                
                const { data, error: fallbackError } = await supabase
                    .from('classifieds')
                    .insert([fallbackClassified])
                    .select()
                    .single();
                
                if (fallbackError) throw fallbackError;
                
                // Refresh list
                const { data: updatedClassifieds } = await supabase
                    .from('classifieds')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                setItems(updatedClassifieds || []);
                setIsCreating(false);
                resetForm();
                
                alert('Listing created successfully (without image)!');
                
            } catch (finalError) {
                console.error('Final error creating listing:', finalError);
                alert('Failed to create listing. Please check your connection and try again.');
            }
        }
    };

    const resetForm = () => {
        setClassifiedForm({
            title: '',
            price: '',
            category: '',
            condition: '',
            location: '',
            description: '',
            image_url: ''
        });
        setSelectedImage(null);
        setImagePreview(null);
        setImageError(null);
    };

    if (isCreating) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
                {/* Custom Header */}
                <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
                        <button 
                            onClick={() => setIsCreating(false)}
                            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">Sell Item</h1>
                            <p className="text-xs text-gray-500">Reach thousands of buyers in your network</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6 mb-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag size={28} className="text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">New Listing</h2>
                            <p className="text-sm text-gray-600">Images are optional - you can add them later</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Item Title *</label>
                                <input 
                                    type="text" 
                                    name="title"
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                                    placeholder="e.g. 50KVA Generator" 
                                    value={classifiedForm.title}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Price (₦) *</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            name="price"
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                                            placeholder="0.00" 
                                            value={classifiedForm.price}
                                            onChange={handleFormChange}
                                            required
                                        />
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-bold">₦</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Category</label>
                                    <div className="relative">
                                        <select 
                                            name="category"
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm text-gray-700"
                                            value={classifiedForm.category}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Select category...</option>
                                            {categories.filter(c => c !== 'All').map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Condition (Optional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setClassifiedForm(prev => ({ ...prev, condition: 'Used' }))}
                                        className={`py-3 rounded-xl text-xs font-bold transition-all ${
                                            classifiedForm.condition === 'Used'
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                    >
                                        Used
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClassifiedForm(prev => ({ ...prev, condition: 'New' }))}
                                        className={`py-3 rounded-xl text-xs font-bold transition-all ${
                                            classifiedForm.condition === 'New'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                    >
                                        New
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Location (Optional)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="location"
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm" 
                                        placeholder="Pickup Area" 
                                        value={classifiedForm.location}
                                        onChange={handleFormChange}
                                    />
                                    <MapPin size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Description (Optional)</label>
                                <div className="relative">
                                    <textarea 
                                        name="description"
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm min-h-[100px] resize-none" 
                                        placeholder="Describe your item..."
                                        value={classifiedForm.description}
                                        onChange={handleFormChange}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Item Image (Optional)</label>
                                
                                {/* Image Preview */}
                                {imagePreview ? (
                                    <div className="relative">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-48 object-cover rounded-xl border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeSelectedImage}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {/* File Upload */}
                                        <label className="block">
                                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer">
                                                <Upload size={24} className="mb-2" />
                                                <span className="text-sm font-medium mb-1">Upload Item Image</span>
                                                <span className="text-xs text-gray-500">JPG, PNG up to 5MB (optional)</span>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                            />
                                        </label>
                                        
                                        {/* Or URL Input */}
                                        <div className="mt-3">
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    name="image_url"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm" 
                                                    placeholder="Or paste image URL (optional)" 
                                                    value={classifiedForm.image_url}
                                                    onChange={handleFormChange}
                                                />
                                                <ImageIcon size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {imageError && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="text-xs text-red-600">{imageError}</p>
                                        <p className="text-xs text-red-500 mt-1">You can continue without an image</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-4">
                                    * Required fields. Images are optional and can be added later.
                                </p>
                                <button 
                                    onClick={handleCreateClassified}
                                    disabled={uploading}
                                    className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all duration-200 text-sm ${
                                        uploading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {uploading ? 'Uploading...' : 'Post Listing'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-200/80">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">Marketplace</h1>
                            <p className="text-xs text-gray-500">Buy & sell within your network</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200/50 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        Sell
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
                {/* Search & Categories */}
                <div className="mb-6">
                    {/* Search Bar */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4 mb-4">
                        <div className="relative mb-3 group">
                            <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Search for items, services..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`
                                    px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2
                                    ${selectedCategory === cat 
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}
                                `}
                            >
                                {cat === 'All' && <ShoppingBag size={14} />}
                                {cat === 'Machinery' && <Package size={14} />}
                                {cat === 'Real Estate' && <MapPin size={14} />}
                                {cat === 'Vehicles' && <Tag size={14} />}
                                {cat === 'Electronics' && <Filter size={14} />}
                                {cat === 'Services' && <DollarSign size={14} />}
                                {cat === 'Fashion' && <ImageIcon size={14} />}
                                {cat === 'Home & Garden' && <MapPin size={14} />}
                                {cat === 'Other' && <ShoppingBag size={14} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Items Grid */}
                <div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Loading listings...</p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {filteredItems.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => navigate(`/market/${item.id}`)}
                                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow active:scale-[0.98]"
                                >
                                    <div className="h-36 bg-gradient-to-br from-emerald-100 to-emerald-50 overflow-hidden relative">
                                        {item.image_url ? (
                                            <img 
                                                src={item.image_url} 
                                                alt={item.title} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // If image fails to load, show placeholder
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center">
                                                            <svg class="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                                            </svg>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag size={32} className="text-emerald-400" />
                                            </div>
                                        )}
                                        {item.condition && (
                                            <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg">
                                                {item.condition}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-bold text-gray-900 text-xs mb-1 line-clamp-1">{item.title}</h4>
                                        {item.price ? (
                                            <p className="text-blue-600 font-bold text-sm mb-2">{item.price}</p>
                                        ) : (
                                            <p className="text-gray-400 text-xs mb-2 italic">Price not specified</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            {item.category ? (
                                                <span className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-[10px] font-bold rounded-lg">
                                                    {item.category}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg">
                                                    Uncategorized
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-500">{formatTimeAgo(item.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {searchTerm || selectedCategory !== 'All' ? 'No Items Found' : 'No Listings Available'}
                            </h4>
                            <p className="text-gray-600 text-sm mb-6">
                                {searchTerm || selectedCategory !== 'All' 
                                    ? 'Try changing your search or category filter' 
                                    : 'Be the first to post a listing in your network'}
                            </p>
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                            >
                                Create Listing
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Banner */}
                <div className="mt-8">
                    <div className="bg-gradient-to-r from-emerald-600/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl border border-emerald-200/50 p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                                <div className="text-xs text-gray-600">Total Listings</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {items.filter(i => i.condition === 'New').length}
                                </div>
                                <div className="text-xs text-gray-600">New Items</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {selectedCategory === 'All' ? items.length : items.filter(i => i.category === selectedCategory).length}
                                </div>
                                <div className="text-xs text-gray-600">{selectedCategory}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Market;