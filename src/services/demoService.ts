import { supabase } from '../lib/supabaseClient';

export type DemoStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export interface DemoRequest {
  id: string;
  userId: string | null;
  hospitalName: string;
  contactNumber: string;
  equipment: string;
  preferredDate: string;
  scheduledDate: string | null;
  content: string;
  status: DemoStatus;
  createdAt: string;
  user?: {
    name: string;
    hospitalName?: string | null;
  } | null;
}

export interface DemoRequestInput {
  user_id?: string;
  hospital_name: string;
  contact_number: string;
  equipment: string;
  preferred_date: string;
  content: string;
}

export const demoService = {
  async getDemoRequests(): Promise<DemoRequest[]> {
    const { data, error } = await supabase
      .from('demo_requests')
      .select(`
        *,
        user:users (
          name,
          hospital_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching demo requests:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      hospitalName: item.hospital_name,
      contactNumber: item.contact_number,
      equipment: item.equipment,
      preferredDate: item.preferred_date,
      scheduledDate: item.scheduled_date,
      content: item.content,
      status: item.status as DemoStatus,
      createdAt: item.created_at,
      user: item.user ? {
        name: item.user.name,
        hospitalName: item.user.hospital_name,
      } : null,
    }));
  },

  async getUserDemoRequests(userId: string): Promise<DemoRequest[]> {
    const { data, error } = await supabase
      .from('demo_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user demo requests:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      hospitalName: item.hospital_name,
      contactNumber: item.contact_number,
      equipment: item.equipment,
      preferredDate: item.preferred_date,
      scheduledDate: item.scheduled_date,
      content: item.content,
      status: item.status as DemoStatus,
      createdAt: item.created_at,
    }));
  },

  async createDemoRequest(input: DemoRequestInput): Promise<any> {
    const { data, error } = await supabase
      .from('demo_requests')
      .insert({
        ...input,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating demo request:', error);
      throw error;
    }

    return data;
  },

  async updateDemoStatus(id: string, status: DemoStatus, scheduledDate?: string): Promise<void> {
    const { error } = await supabase
      .from('demo_requests')
      .update({
        status,
        ...(scheduledDate && { scheduled_date: scheduledDate }),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating demo status:', error);
      throw error;
    }
  },

  async deleteDemoRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('demo_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting demo request:', error);
      throw error;
    }
  }
};
