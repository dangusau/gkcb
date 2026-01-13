import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Check } from 'lucide-react';
import { Event } from '../../types/explore';
import { formatTimeAgo } from '../../utils/formatters';
import { useExplore } from '../../hooks/useExplore';

interface Props {
  event: Event;
}

const EventCard: React.FC<Props> = ({ event }) => {
  const [localEvent, setLocalEvent] = useState(event);
  const { toggleRSVP } = useExplore();

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

  const getRSVPButtonColor = (status: string) => {
    if (localEvent.user_rsvp_status === status) {
      return 'bg-blue-600 text-white';
    }
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      {/* Event Image */}
      {event.image_url && (
        <div className="h-40 bg-gray-200">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Event Title & Organizer */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600">by {event.organizer_name}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users size={14} />
            <span>{event.rsvp_count}</span>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar size={16} />
            <span>{formatEventDate(event.event_date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin size={16} />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* RSVP Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleRSVP('going')}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${getRSVPButtonColor('going')}`}
          >
            {localEvent.user_rsvp_status === 'going' && <Check size={16} />}
            Going
          </button>
          <button
            onClick={() => handleRSVP('interested')}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${getRSVPButtonColor('interested')}`}
          >
            {localEvent.user_rsvp_status === 'interested' && <Check size={16} />}
            Interested
          </button>
        </div>

        {/* Posted Time */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
          <Clock size={12} />
          <span>Posted {formatTimeAgo(event.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;