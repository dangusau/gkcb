export type NotificationType = 
  | 'friend_request'
  | 'friend_request_accepted'
  | 'business_approved'
  | 'business_rejected'
  | 'system_message'
  | 'help_support';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  action_url: string | null;
  created_at: string;
}