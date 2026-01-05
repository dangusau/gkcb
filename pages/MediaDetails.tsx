import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MessageSquare, Eye, Calendar, Play, Download, MoreVertical } from 'lucide-react';
import { MediaItem } from '../types';
import { getMediaItem } from '../services/mockApi';

const MediaDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<MediaItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (id) {
            getMediaItem(parseInt(id)).then(setItem);
        }
    }, [id]);

    if (!item) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-safe">
            {/* Player / Viewer Area */}
            <div className="w-full bg-black relative aspect-video flex items-center justify-center group sticky top-0 z-40">
                {item.type === 'video' && isPlaying ? (
                    // Mock Video Player UI
                    <div className="w-full h-full bg-gray-900 flex flex-col justify-between p-4">
                         <div className="text-white text-xs">Video Player Placeholder</div>
                         <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                             <div className="w-1/3 h-full bg-primary-500"></div>
                         </div>
                    </div>
                ) : (
                    <>
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
                        
                        {/* Custom Nav overlay on image */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50">
                             <button 
                                onClick={() => navigate(-1)}
                                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/20"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/20">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={() => setIsPlaying(true)}
                            className="absolute z-10 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 hover:scale-110 transition-transform cursor-pointer"
                        >
                            {item.type === 'video' ? (
                                <Play size={32} className="text-white fill-white ml-1" />
                            ) : (
                                <span className="text-white font-bold text-xs">Open</span>
                            )}
                        </button>
                    </>
                )}
            </div>

            <div className="px-4 py-5">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-lg font-bold text-gray-900 leading-snug flex-1 mr-4">{item.title}</h1>
                    <button className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95 transition-transform">
                        <Download size={20} />
                    </button>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-primary-900/10">
                    <span className="flex items-center gap-1.5">
                        <Eye size={14} /> {item.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar size={14} /> {item.created_at}
                    </span>
                </div>

                {/* Author Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold border border-primary-200">
                            {item.author_name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">{item.author_name}</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{item.category}</p>
                        </div>
                    </div>
                    <button className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-full">
                        Subscribe
                    </button>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed bg-white p-3 rounded-2xl border border-primary-900/10">
                        {item.description}
                    </p>
                </div>

                {/* Interaction Actions */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button className="flex flex-col items-center justify-center gap-1 py-3 bg-white rounded-2xl border border-primary-900/10 shadow-sm active:scale-95 transition-transform">
                        <Heart size={20} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500">Like</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 py-3 bg-white rounded-2xl border border-primary-900/10 shadow-sm active:scale-95 transition-transform">
                        <MessageSquare size={20} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500">Comment</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 py-3 bg-white rounded-2xl border border-primary-900/10 shadow-sm active:scale-95 transition-transform">
                        <Share2 size={20} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500">Share</span>
                    </button>
                </div>

                {/* Related Section (Mock) */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Up Next</h3>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                             <div key={i} className="flex gap-3 bg-white p-2 rounded-2xl border border-primary-900/10">
                                <div className="w-24 h-16 bg-gray-200 rounded-xl shrink-0 relative overflow-hidden">
                                     <img src={`https://picsum.photos/id/${200+i}/200/200`} className="w-full h-full object-cover" alt="" />
                                     <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">10:00</div>
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                    <h4 className="font-bold text-xs text-gray-900 line-clamp-2 mb-1">Related Media Item Title Goes Here</h4>
                                    <p className="text-[10px] text-gray-500">GKBC Media • 1.2k views</p>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaDetails;