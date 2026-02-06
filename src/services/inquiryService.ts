import { supabase } from '../lib/supabaseClient';
import { Inquiry } from '../types';

export interface InquiryInput {
  type: string;
  title: string;
  content: string;
  is_secret: boolean;
  user_id?: string;
}

export const inquiryService = {
  async getInquiries(): Promise<Inquiry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('inquiries')
      .select(`
        *,
        user:users (
          name,
          hospital_name,
          role,
          phone,
          mobile
        )
      `);

    // If not admin, only show own inquiries
    // Note: RLS will also enforce this, but client-side filter is clearer
    if (user) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }
    } else {
      // If not logged in, show nothing or only public ones? 
      // Usually 1:1 requires login.
      return [];
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      title: item.title,
      content: item.content,
      isSecret: item.is_secret,
      status: item.status,
      answerContent: item.answer_content,
      answeredAt: item.answered_at,
      createdAt: item.created_at,
      user: item.user ? {
        name: item.user.name,
        hospitalName: item.user.hospital_name,
        phone: item.user.phone,
        mobile: item.user.mobile,
      } : null,
    }));
  },

  async getInquiryById(id: string): Promise<Inquiry | null> {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        user:users (
          name,
          hospital_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inquiry:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      content: data.content,
      isSecret: data.is_secret,
      status: data.status,
      answerContent: data.answer_content,
      answeredAt: data.answered_at,
      createdAt: data.created_at,
      user: data.user ? {
        name: data.user.name,
        hospitalName: data.user.hospital_name,
        phone: data.user.phone,
        mobile: data.user.mobile,
      } : null,
    };
  },

  async createInquiry(input: InquiryInput): Promise<any> {
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        type: input.type,
        title: input.title,
        content: input.content,
        is_secret: input.is_secret,
        user_id: input.user_id,
        status: 'waiting',
      })
      .select();

    if (error) {
      console.error('Error creating inquiry:', error);
      throw error;
    }

    return data ? data[0] : null;
  },

  async updateInquiry(id: string, input: Partial<InquiryInput>): Promise<any> {
    const { data, error } = await supabase
      .from('inquiries')
      .update(input)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating inquiry:', error);
      throw error;
    }

    return data ? data[0] : null;
  },

  async deleteInquiry(id: string): Promise<void> {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inquiry:', error);
      throw error;
    }
  },

  async answerInquiry(id: string, answerContent: string): Promise<void> {
    const now = new Date().toISOString();
    console.log('Setting answered_at to:', now);
    const { error } = await supabase
      .from('inquiries')
      .update({
        answer_content: answerContent,
        status: 'answered',
        answered_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('Error answering inquiry:', error);
      throw error;
    }
  },
};
