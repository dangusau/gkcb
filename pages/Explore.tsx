import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, Search, Filter, Plus } from 'lucide-react';
import { useExplore } from '../hooks/useExplore';
import JobCard from '../components/explore/JobCard';
import EventCard from '../components/explore/EventCard';
import CreateJobModal from '../components/explore/CreateJobModal';
import CreateEventModal from '../components/explore/CreateEventModal';

const Explore: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'events'>('jobs');
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const { jobs, events, loading, getJobs, getEvents } = useExplore();

  useEffect(() => {
    if (activeTab === 'jobs') {
      getJobs();
    } else {
      getEvents({ upcomingOnly: true });
    }
  }, [activeTab, getJobs, getEvents]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none"
            />
          </div>
          <button className="p-2 bg-gray-100 rounded-lg">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 ${
            activeTab === 'jobs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          <Briefcase size={20} />
          <span className="font-medium">Jobs</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 ${
            activeTab === 'events'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          <Calendar size={20} />
          <span className="font-medium">Events</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'jobs' ? (
        <div className="p-4 space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={48} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-600 mb-6">Be the first to post a job opportunity!</p>
              <button
                onClick={() => setShowJobModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Post a Job
              </button>
            </div>
          ) : (
            jobs.map(job => <JobCard key={job.id} job={job} />)
          )}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No events scheduled yet</h3>
              <p className="text-gray-600 mb-6">Be the first to create an event!</p>
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Create Event
              </button>
            </div>
          ) : (
            events.map(event => <EventCard key={event.id} event={event} />)
          )}
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={() => activeTab === 'jobs' ? setShowJobModal(true) : setShowEventModal(true)}
        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-30"
      >
        <Plus size={24} />
      </button>

      {/* Modals */}
      <CreateJobModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
      />
      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
    </div>
  );
};

export default Explore;