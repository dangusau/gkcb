import React from 'react';
import { Star, MapPin, Trash2 } from 'lucide-react';
import { Business } from '../../types';
import { useNavigate } from 'react-router-dom';

interface BusinessCardProps {
    business: Business;
    onDelete?: () => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onDelete }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/business/${business.id}`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete();
    };

    return (
        <div 
            onClick={handleClick}
            className="bg-white rounded-2xl shadow-sm border border-primary-900/10 overflow-hidden flex flex-row h-40 mb-4 group hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] relative"
        >
            {onDelete && (
                <button 
                    onClick={handleDelete}
                    className="absolute top-2 right-2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all shadow-sm"
                    title="Delete Listing"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div className="w-1/3 relative">
                <img 
                    src={business.cover_image_url} 
                    alt={business.name} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm border border-primary-900/10">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-bold text-gray-800">{business.rating}</span>
                </div>
            </div>
            
            <div className="w-2/3 p-3 flex flex-col h-full">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1 pr-6">{business.name}</h3>
                        {business.is_verified && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {business.description}
                    </p>
                </div>
                
                <div className="mt-auto">
                    <div className="flex items-center gap-1 mb-2">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 truncate">{business.address}</span>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex-1 py-1.5 bg-primary-600 text-white text-[10px] font-semibold rounded-lg border border-primary-900/10 shadow-primary-200 shadow-sm hover:bg-primary-700 transition-colors">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;