import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, MapPin, ShieldCheck, Heart, MessageCircle, Phone, Tag } from 'lucide-react';
import { Classified } from '../types';
import { getClassified } from '../services/mockApi';

const MarketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<Classified | null>(null);

    useEffect(() => {
        if (id) {
            getClassified(parseInt(id)).then(setItem);
        }
    }, [id]);

    if (!item) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

    return (
        <div className="bg-gray-50 min-h-screen pb-24 relative">
            {/* Hero Image */}
            <div className="h-72 w-full relative bg-gray-200">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                
                {/* Nav Buttons */}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all">
                        <Heart size={20} />
                    </button>
                    <button className="p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all">
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                        {item.category}
                    </span>
                    <span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold">
                        {item.condition || "Used"}
                    </span>
                </div>
            </div>

            {/* Content Container */}
            <div className="px-4 pt-4 pb-20">
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-primary-900/10 mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{item.title}</h1>
                    </div>
                    <p className="text-2xl font-bold text-primary-600 mb-4">{item.price}</p>
                    
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4 bg-gray-50 p-3 rounded-xl border border-primary-900/10">
                        <MapPin size={16} className="shrink-0" />
                        <span>{item.location}</span>
                    </div>

                    <div className="border-t border-primary-900/10 pt-4">
                        <h3 className="font-bold text-gray-900 mb-2 text-sm">Description</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-4">Posted {item.posted_at}</p>
                    </div>
                </div>

                {/* Seller Info */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-primary-900/10 flex items-center gap-3">
                    <img src={item.seller_avatar} alt={item.seller_name} className="w-12 h-12 rounded-full border border-primary-900/10" />
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seller</p>
                        <h3 className="font-bold text-gray-900 text-sm">{item.seller_name}</h3>
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <ShieldCheck size={12} />
                            <span>Verified Member</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/profile/2')} // Mock link to profile
                        className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100"
                    >
                        View Profile
                    </button>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary-900/10 p-4 pb-safe z-30 flex gap-3">
                <button className="flex-1 py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <MessageCircle size={18} />
                    Message
                </button>
                <button className="flex-1 py-3.5 bg-white text-gray-800 border border-primary-900/10 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-gray-50">
                    <Phone size={18} />
                    Call
                </button>
            </div>
        </div>
    );
};

export default MarketDetails;