import { supabase } from '../lib/supabaseClient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super' | 'manager' | 'staff';
  permissions: string[];
  createdDate: string;
  lastLogin: string;
}

export const adminService = {
  // 모든 관리자 목록 조회
  async getAdmins(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, admin_role, permissions, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }

    return (data || []).map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.admin_role || 'staff',
      permissions: user.permissions || [],
      createdDate: new Date(user.created_at).toISOString().split('T')[0],
      lastLogin: '-', // Auth 로그인이 별도 로깅되지 않으면 '-'
    }));
  },

  // 관리자 생성 (Edge Function 호출)
  async createAdmin(adminData: { name: string; email: string; password?: string; role: string; permissions: string[] }) {
    const { data, error } = await supabase.functions.invoke('create-admin', {
      body: adminData,
    });

    if (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
    return data;
  },

  // 관리자 수정 (DB 정보만 업데이트, 비밀번호 수정은 미포함)
  async updateAdmin(id: string, updates: { name: string; role: string; permissions: string[] }) {
    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        admin_role: updates.role,
        permissions: updates.role === 'super' ? ['all'] : updates.permissions,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating admin:', error);
      throw error;
    }
  },

  // 관리자 삭제
  async deleteAdmin(id: string) {
    // 실제 운영 환경에서는 soft delete를 하거나 Auth 테이블에서도 삭제해야 할 수 있습니다.
    // 여기서는 Edge Function 없이 간단히 DB에서만 삭제(또는 권한 박탈)하는 로직입니다.
    // Auth 사용자 삭제는 백엔드(Admin API)에서만 가능하므로, 
    // 실제로는 is_deleted 플래그를 두거나 역할을 일반 user로 강등시킵니다.
    const { error } = await supabase
      .from('users')
      .update({ role: 'user', admin_role: null, permissions: [] })
      .eq('id', id);

    if (error) {
      console.error('Error deleting admin:', error);
      throw error;
    }
  }
};
