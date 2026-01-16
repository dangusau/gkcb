import { supabase } from './client';

export const supportService = {
  // Submit a new support ticket
  async submitSupportTicket(ticketData: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
  }) {
    console.log('Submitting support ticket:', ticketData);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: ticketData.subject,
        message: ticketData.message,
        category: ticketData.category || 'general',
        priority: ticketData.priority || 'normal',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting ticket:', error);
      throw error;
    }
    
    console.log('Ticket submitted successfully:', data);
    return data;
  },

  // Get user's support tickets
  async getUserSupportTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get ticket by ID
  async getTicketById(ticketId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
    
    return data;
  },

  // Format date for display
  formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Get status color
  getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  // Get priority color
  getPriorityColor(priority: string) {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  getTicketReplies: async (ticketId: string) => {
    const { data, error } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },
  
  addTicketReply: async (ticketId: string, message: string) => {
    const { data, error } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        message,
        is_admin: false // This would be true for admin replies
      });
    
    if (error) throw error;
    return data;
  }
  
};