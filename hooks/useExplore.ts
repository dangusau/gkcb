import { useState, useCallback } from 'react';
import { exploreService } from '../services/supabase/explore';
import { Job, Event, RSVPResult } from '../types/explore';

export const useExplore = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Jobs
  const getJobs = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const data = await exploreService.getJobs(filters);
      setJobs(data);
      return data;
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (jobData: any) => {
    try {
      setLoading(true);
      const jobId = await exploreService.createJob(jobData);
      await getJobs(); // Refresh list
      return jobId;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getJobs]);

  // Events
  const getEvents = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const data = await exploreService.getEvents(filters);
      setEvents(data);
      return data;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData: any) => {
    try {
      setLoading(true);
      const eventId = await exploreService.createEvent(eventData);
      await getEvents(); // Refresh list
      return eventId;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getEvents]);

  const toggleRSVP = useCallback(async (eventId: string, rsvpStatus: string) => {
    try {
      const result = await exploreService.toggleEventRSVP(eventId, rsvpStatus);
      
      // Update local state
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            rsvp_count: result.rsvp_count,
            user_rsvp_status: result.rsvp_status
          };
        }
        return event;
      }));
      
      return result;
    } catch (error) {
      console.error('Error toggling RSVP:', error);
      throw error;
    }
  }, []);

  return {
    // State
    jobs,
    events,
    loading,
    
    // Methods
    getJobs,
    createJob,
    getEvents,
    createEvent,
    toggleRSVP,
    
    // Setters
    setJobs,
    setEvents
  };
};