import React, { useState } from 'react';
import { CheckCircle, MessageCircle, UserPlus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Member } from '../../types';

interface MemberCardProps {
    member: Member;
}

const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
    const navigate = useNavigate();
    const [requestSent, setRequestSent] = useState(false);

    const handleCardClick = () => {
        navigate(`/profile/${member.id}`);
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (member.is_friend) {
            navigate('/messages');
        } else {
            if (!requestSent) {
                setRequestSent(true);
            }
        }
    };

    return (
        <div 
            onClick={handleCardClick}
            className="bg-white rounded-3xl p-4 shadow-sm border border-primary-900/10 flex flex-col items-center relative overflow-hidden group hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
        >
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-br from-primary-50 to-primary-100 opacity-50 z-0"></div>
            
            <div className="relative z-10 w-20 h-20 rounded-full p-1 bg-white shadow-sm border border-primary-900/10 mt-2 mb-3">
                <img 
                    src={member.image_url} 
                    alt={member.full_name} 
                    className="w-full h-full rounded-full object-cover"
                />
                {member.verified && (
                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 border border-primary-900/10">
                        <CheckCircle size={16} className="text-blue-500 fill-blue-100" />
                    </div>
                )}
            </div>
            
            <div className="relative z-10 text-center w-full">
                <h3 className="font-bold text-gray-800 text-sm truncate">{member.full_name}</h3>
                <p className="text-xs text-primary-600 font-medium truncate">{member.position}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{member.company}</p>
                
                <button 
                    onClick={handleActionClick}
                    className={`
                        mt-3 w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold rounded-xl transition-all border
                        ${member.is_friend 
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200 hover:bg-primary-700' 
                            : (requestSent 
                                ? 'bg-green-50 text-green-600 border-green-200'
                                : 'bg-white text-primary-600 border-primary-900/10 hover:bg-primary-50')
                        }
                    `}
                >
                    {member.is_friend ? (
                        <>
                            <MessageCircle size={14} />
                            <span>Chat</span>
                        </>
                    ) : (
                        requestSent ? (
                            <>
                                <Check size={14} />
                                <span>Requested</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={14} />
                                <span>Connect</span>
                            </>
                        )
                    )}
                </button>
            </div>
        </div>
    );
};

export default MemberCard;