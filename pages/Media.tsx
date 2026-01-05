import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Play, Image as ImageIcon, Video, Upload, Clock, Eye } from 'lucide-react';
import { MediaItem } from '../types';
import { getMediaItems } from '../services/mockApi';

const Media = () => {
    const navigate = useNavigate();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'video' | 'gallery'>('all');

    useEffect(() => {
        getMediaItems().then(setMediaItems);
    }, []);

    const filteredItems = mediaItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || item.type === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
             {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-sm border-b border-primary-900/10">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white border border-primary-900/10 rounded-full text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">Media Center</h1>
                </div>
                <button className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors border border-primary-900/10">
                    <Upload size={20} />
                </button>
            </div>

            {/* Search & Tabs */}
            <div className="sticky top-[60px] z-20 bg-gray-50 px-4 pt-4 pb-2 backdrop-blur-sm">
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-primary-900/10 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 focus:border-primary-400 sm:text-sm transition-all shadow-sm"
                        placeholder="Search videos, galleries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex p-1 bg-white rounded-xl border border-primary-900/10 shadow-sm">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            activeTab === 'all' 
                                ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-900/10' 
                                : 'text-gray-500 hover:text-gray-700 border border-transparent'
                        }`}
                    >
                        All Media
                    </button>
                    <button
                        onClick={() => setActiveTab('video')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            activeTab === 'video' 
                                ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-900/10' 
                                : 'text-gray-500 hover:text-gray-700 border border-transparent'
                        }`}
                    >
                        Videos
                    </button>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            activeTab === 'gallery' 
                                ? 'bg-primary-50 text-primary-600 shadow-sm border border-primary-900/10' 
                                : 'text-gray-500 hover:text-gray-700 border border-transparent'
                        }`}
                    >
                        Photos
                    </button>
                </div>
            </div>

            {/* Media Grid */}
            <div className="px-4 mt-2">
                <div className="grid grid-cols-1 gap-4">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => navigate(`/media/${item.id}`)}
                            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-primary-900/10 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] group"
                        >
                            <div className="relative h-48 bg-gray-200">
                                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                                
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 text-white border border-white/10">
                                    {item.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                                    {item.type === 'video' ? (
                                        <Play size={20} className="text-white fill-white ml-0.5" />
                                    ) : (
                                        <ImageIcon size={20} className="text-white" />
                                    )}
                                </div>
                                
                                {item.duration && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-mono">
                                        {item.duration}
                                    </div>
                                )}
                                {item.photo_count && (
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[10px] font-medium flex items-center gap-1">
                                        <ImageIcon size={10} /> {item.photo_count} Photos
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-1 leading-tight">{item.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                                
                                <div className="flex items-center justify-between text-[10px] text-gray-400">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Eye size={12} /> {item.views.toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {item.created_at}
                                        </span>
                                    </div>
                                    <span className="font-bold text-primary-600">{item.author_name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">No media found</div>
                )}
            </div>
        </div>
    );
};

export default Media;