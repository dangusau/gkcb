import { supabase } from './client';
import { Job, Event, RSVPResult } from '../../types/explore';

export const exploreService = {
  // Jobs
  async getJobs(filters?: {
    jobType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    const { data, error } = await supabase.rpc('get_jobs_list', {
      p_job_type: filters?.jobType,
      p_search: filters?.search,
      p_limit: filters?.limit || 20,
      p_offset: filters?.offset || 0
    });

    if (error) throw error;
    return data || [];
  },

  async createJob(jobData: {
    title: string;
    description: string;
    salary: string;
    job_type: string;
    location: string;
    contact_info?: Record<string, any>;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_job', {
      p_title: jobData.title,
      p_description: jobData.description,
      p_salary: jobData.salary,
      p_job_type: jobData.job_type,
      p_location: jobData.location,
      p_contact_info: jobData.contact_info || {}
    });

    if (error) throw error;
    return data;
  },

  // Events
  async getEvents(filters?: {
    upcomingOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Event[]> {
    const { data, error } = await supabase.rpc('get_events_list', {
      p_upcoming_only: filters?.upcomingOnly ?? true,
      p_search: filters?.search,
      p_limit: filters?.limit || 20,
      p_offset: filters?.offset || 0
    });

    if (error) throw error;
    return data || [];
  },

  async createEvent(eventData: {
  title: string;
  description: string;
  event_date: string;
  location: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_event', {
    p_title: eventData.title,
    p_description: eventData.description,
    p_event_date: eventData.event_date,
    p_location: eventData.location
  });

  if (error) throw error;
  return data;
},

  async toggleEventRSVP(eventId: string, rsvpStatus: string = 'going'): Promise<RSVPResult> {
    const { data, error } = await supabase.rpc('toggle_event_rsvp', {
      p_event_id: eventId,
      p_rsvp_status: rsvpStatus
    });

    if (error) throw error;
    return data;
  }
};