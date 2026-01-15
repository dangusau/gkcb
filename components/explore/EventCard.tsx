import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Check, User, ChevronRight } from 'lucide-react';
import { Event } from '../../types/explore';
import { formatTimeAgo } from '../../utils/formatters';
import { useExplore } from '../../hooks/useExplore';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  event: Event;
}

const EventCard: React.FC<Props> = ({ event }) => {
  const [localEvent, setLocalEvent] = useState(event);
  const { toggleRSVP } = useExplore();
  const { user } = useAuth();

  const isOwner = event.organizer_id === user?.id;
  const hasRSVPed = localEvent.user_rsvp_status !== null;

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRSVP = async (status: string) => {
    if (isOwner) {
      alert("You can't RSVP to your own event");
      return;
    }
    
    if (hasRSVPed) {
      alert("You have already RSVPed to this event");
      return;
    }

    try {
      const result = await toggleRSVP(event.id, status);
      setLocalEvent(prev => ({
        ...prev,
        rsvp_count: result.rsvp_count,
        user_rsvp_status: result.rsvp_status
      }));
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const getRSVPButtonStyle = () => {
    if (isOwner) {
      return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 cursor-default";
    }
    
    if (hasRSVPed) {
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md cursor-default";
    }
    
    return "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md";
  };

  const getButtonText = () => {
    if (isOwner) return "Your Event";
    if (hasRSVPed) {
      return localEvent.user_rsvp_status === 'going' ? "Going ✓" : "Interested ✓";
    }
    return "RSVP Now";
  };

  const getRSVPCountText = () => {
    if (localEvent.rsvp_count === 0) return "No RSVPs yet";
    if (localEvent.rsvp_count === 1) return "1 person going";
    return `${localEvent.rsvp_count} people going`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Event Header with Gradient */}
      <div className="relative">
        {/* Event Image or Gradient Placeholder */}
        {event.image_url ? (
          <div className="h-48 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <Calendar size={48} className="text-white/80" />
          </div>
        )}

        {/* Event Status Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-medium shadow-md flex items-center gap-2">
            <Users size={14} />
            <span className="font-bold">{localEvent.rsvp_count}</span>
          </div>
        </div>

        {/* Owner Badge */}
        {isOwner && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
            Your Event
          </div>
        )}
      </div>

      {/* Event Content */}
      <div className="p-5">
        {/* Event Title */}
        <h3 className="font-bold text-gray-900 text-xl mb-2">{event.title}</h3>

        {/* Organizer */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {event.organizer_name?.charAt(0) || 'O'}
          </div>
          <div>
            <div className="text-sm text-gray-600">Organized by</div>
            <div className="font-medium text-gray-900">{event.organizer_name}</div>
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Date & Time</div>
              <div className="font-medium text-gray-900 text-sm">{formatEventDate(event.event_date)}</div>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium text-gray-900 text-sm truncate">{event.location}</div>
              </div>
            </div>
          )}

          {/* RSVP Count */}
          <div className="col-span-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Attendance</div>
                  <div className="font-bold text-gray-900">{getRSVPCountText()}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-5">
            <div className="text-sm text-gray-500 mb-2 font-medium">About this event</div>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm line-clamp-3">
              {event.description}
            </p>
          </div>
        )}

        {/* Single RSVP Button */}
        <button
          onClick={() => handleRSVP('going')}
          disabled={isOwner || hasRSVPed}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${getRSVPButtonStyle()} ${
            (isOwner || hasRSVPed) ? 'cursor-default' : 'hover:shadow-lg'
          }`}
        >
          {hasRSVPed && !isOwner && <Check size={20} />}
          {getButtonText()}
        </button>

        {/* Info messages */}
        <div className="mt-3 space-y-1">
          {isOwner && (
            <p className="text-center text-blue-600 text-sm">You are the organizer of this event</p>
          )}
          {hasRSVPed && !isOwner && (
            <p className="text-center text-green-600 text-sm">
              You are {localEvent.user_rsvp_status === 'going' ? 'going' : 'interested'}
            </p>
          )}
        </div>

        {/* Posted Time */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
          <Clock size={12} />
          <span>Posted {formatTimeAgo(event.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;