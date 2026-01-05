import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Globe, Phone, Mail, Clock, ShieldCheck, Star, Edit, Plus, Image as ImageIcon, Send, Share2, Heart, MessageSquare, Settings, BarChart3, Package } from 'lucide-react';
import { Business, BlogPost } from '../types';
import { getBusinesses, getBusinessPosts } from '../services/mockApi';

const BusinessProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState<Business | null>(null);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [activeTab, setActiveTab] = useState<'about' | 'products' | 'posts'>('about');
    
    // Management State (for owners)
    const [postText, setPostText] = useState("");

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                const allBusinesses = await getBusinesses();
                const foundBusiness = allBusinesses.find(b => b.id === parseInt(id));
                if (foundBusiness) {
                    setBusiness(foundBusiness);
                    const businessPosts = await getBusinessPosts(foundBusiness.id);
                    setPosts(businessPosts);
                    
                    // Default to posts tab if owner for quick access
                    if(foundBusiness.is_owned) setActiveTab('posts');
                }
            }
        };
        loadData();
    }, [id]);

    if (!business) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

    const isOwner = business.is_owned;

    return (
        <div className="bg-gray-50 min-h-screen pb-24 relative">
            {/* Header / Cover */}
            <div className="h-48 w-full bg-gray-200 relative">
                <img src={business.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20"></div>
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                
                {isOwner && (
                    <button className="absolute top-4 right-4 p-2 bg-primary-600 text-white rounded-full shadow-lg border border-primary-500 hover:bg-primary-700 transition-all flex items-center gap-2 px-4">
                        <Settings size={16} />
                        <span className="text-xs font-bold">Manage</span>
                    </button>
                )}
            </div>

            {/* Profile Info Card */}
            <div className="px-4 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl p-5 shadow-md border border-primary-900/10">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-16 h-16 rounded-xl bg-white p-1 border border-primary-900/10 shadow-sm -mt-10 overflow-hidden">
                            <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                             {business.is_verified && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                    <ShieldCheck size={12} /> Verified
                                </span>
                             )}
                             <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-[10px] font-bold border border-yellow-100 flex items-center gap-1">
                                <Star size={12} className="fill-yellow-500 text-yellow-500" /> {business.rating}
                             </span>
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1">{business.name}</h1>
                    <p className="text-xs text-primary-600 font-medium mb-3">{business.category}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{business.description}</p>

                    {/* Lister Info */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-primary-900/10 mb-4">
                        <img src={business.owner_avatar} alt={business.owner_name} className="w-8 h-8 rounded-full border border-white" />
                        <div className="flex-1">
                            <span className="text-[10px] text-gray-400 block uppercase tracking-wide">Listed By</span>
                            <span className="text-xs font-bold text-gray-800">{business.owner_name}</span>
                        </div>
                        <button className="text-xs font-bold text-primary-600 px-3 py-1 bg-white border border-primary-900/10 rounded-lg shadow-sm">
                            Profile
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-200 active:scale-[0.98] transition-all">
                            Contact Us
                        </button>
                        <button className="p-2.5 bg-gray-50 text-gray-600 rounded-xl border border-primary-900/10 hover:bg-gray-100">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm mt-4 px-4 border-b border-primary-900/10">
                <div className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('about')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'about' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                    >
                        About
                    </button>
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'products' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                    >
                        Products
                    </button>
                    <button 
                        onClick={() => setActiveTab('posts')}
                        className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'posts' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                    >
                        Activity
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4 py-4">
                
                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-900/10">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm">Contact Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <MapPin size={18} className="text-gray-400 shrink-0" />
                                    <span>{business.address}</span>
                                </div>
                                {business.phone && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone size={18} className="text-gray-400 shrink-0" />
                                        <span>{business.phone}</span>
                                    </div>
                                )}
                                {business.email && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail size={18} className="text-gray-400 shrink-0" />
                                        <span>{business.email}</span>
                                    </div>
                                )}
                                {business.website && (
                                    <div className="flex items-center gap-3 text-sm text-primary-600">
                                        <Globe size={18} className="text-gray-400 shrink-0" />
                                        <a href={`https://${business.website}`} target="_blank" rel="noreferrer" className="underline">{business.website}</a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-900/10">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm">Operating Hours</h3>
                            <div className="flex items-start gap-3 text-sm text-gray-600">
                                <Clock size={18} className="text-gray-400 shrink-0 mt-0.5" />
                                <span>{business.operating_hours || "Contact for hours"}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {isOwner && (
                            <button className="w-full py-3 border-2 border-dashed border-primary-200 rounded-2xl flex items-center justify-center gap-2 text-primary-600 font-bold bg-primary-50 hover:bg-primary-100 transition-colors">
                                <Plus size={18} />
                                <span>Add Product or Service</span>
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {business.products_services?.map((item, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-2xl border border-primary-900/10 shadow-sm">
                                    <div className="w-full h-24 bg-gray-100 rounded-xl mb-2 flex items-center justify-center text-gray-400">
                                        <Package size={24} />
                                    </div>
                                    <p className="font-bold text-gray-800 text-xs text-center">{item}</p>
                                </div>
                            )) || <div className="col-span-2 text-center text-gray-500 text-sm py-4">No products listed yet.</div>}
                        </div>
                    </div>
                )}

                {/* POSTS TAB (Activity) */}
                {activeTab === 'posts' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        
                        {/* Owner Post Creator */}
                        {isOwner && (
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-900/10">
                                <div className="flex gap-3">
                                    <img src={business.logo_url} alt="Logo" className="w-10 h-10 rounded-full border border-primary-900/10" />
                                    <div className="flex-1">
                                        <textarea 
                                            placeholder={`Post as ${business.name}...`}
                                            className="w-full text-sm outline-none resize-none h-16 placeholder-gray-400"
                                            value={postText}
                                            onChange={(e) => setPostText(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary-900/10">
                                    <button className="text-gray-400 hover:text-primary-600 p-1">
                                        <ImageIcon size={18} />
                                    </button>
                                    <button 
                                        disabled={!postText.trim()}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${postText.trim() ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Stats for Owner */}
                        {isOwner && (
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                <div className="min-w-[120px] bg-white p-3 rounded-2xl border border-primary-900/10 shadow-sm">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Profile Views</span>
                                    <p className="text-xl font-bold text-gray-800 mt-1">1,240</p>
                                </div>
                                <div className="min-w-[120px] bg-white p-3 rounded-2xl border border-primary-900/10 shadow-sm">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">New Followers</span>
                                    <p className="text-xl font-bold text-gray-800 mt-1">+45</p>
                                </div>
                            </div>
                        )}

                        {/* Post Feed */}
                        {posts.map(post => (
                             <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-primary-900/10 overflow-hidden">
                                <div className="p-3 flex items-center gap-3">
                                    <img src={business.logo_url} alt={business.name} className="w-8 h-8 rounded-full border border-primary-900/10" />
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">{business.name}</h4>
                                        <p className="text-[10px] text-gray-400">{post.created_at}</p>
                                    </div>
                                    {isOwner && <button className="ml-auto text-gray-400 hover:text-gray-600"><Edit size={14}/></button>}
                                </div>
                                <div className="px-3 pb-2">
                                     <h3 className="font-bold text-gray-800 text-sm mb-1">{post.title}</h3>
                                     <p className="text-xs text-gray-600 leading-relaxed">{post.excerpt}</p>
                                </div>
                                {post.image_url && (
                                    <img src={post.image_url} alt="" className="w-full h-48 object-cover bg-gray-100" />
                                )}
                                <div className="p-3 flex items-center justify-between border-t border-primary-900/10">
                                    <div className="flex gap-4">
                                        <button className="flex items-center gap-1 text-gray-500 hover:text-red-500">
                                            <Heart size={16} /> <span className="text-xs">{post.likes_count}</span>
                                        </button>
                                        <button className="flex items-center gap-1 text-gray-500 hover:text-primary-600">
                                            <MessageSquare size={16} /> <span className="text-xs">{post.comments_count}</span>
                                        </button>
                                    </div>
                                    <button className="text-gray-400"><Share2 size={16} /></button>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessProfile;