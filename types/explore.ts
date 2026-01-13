export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  salary: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  location: string;
  contact_info: Record<string, any>;
  views_count: number;
  created_at: string;
  company_name: string;
  company_avatar: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
  rsvp_count: number;
  created_at: string;
  organizer_name: string;
  organizer_avatar: string;
  user_rsvp_status: string | null;
}

export interface RSVPResult {
  action: string;
  rsvp_status: string | null;
  rsvp_count: number;
}