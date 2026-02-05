import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

export const authService = {
    // Helper to generate virtual email from loginId
    getVirtualEmail(loginId: string) {
        if (loginId.includes('@')) return loginId; // Handle case where email is provided
        return `${loginId}@jeisys.com`;
    },

    async signUp(loginId: string, password: string, userData: Omit<User, 'id' | 'email' | 'loginId'>) {
        const email = this.getVirtualEmail(loginId);

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: userData.name,
                    hospital_name: userData.hospitalName,
                    login_id: loginId
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // 2. Insert into public.users table
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                login_id: loginId,
                email: email,
                name: userData.name,
                hospital_name: userData.hospitalName,
                business_number: userData.businessNumber,
                phone: userData.phone
            });

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw profileError;
        }

        return authData;
    },

    async signIn(loginId: string, password: string) {
        const email = this.getVirtualEmail(loginId);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Fetch profile from public.users table
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return {
                id: user.id,
                loginId: user.user_metadata?.login_id || '',
                email: user.email || '',
                name: user.user_metadata?.name || '',
                hospitalName: user.user_metadata?.hospital_name || '',
                businessNumber: '',
                phone: ''
            };
        }

        return {
            id: profile.id,
            loginId: profile.login_id,
            email: profile.email || user.email || '',
            name: profile.name,
            hospitalName: profile.hospital_name,
            businessNumber: profile.business_number,
            phone: profile.phone,
            address: profile.address,
            addressDetail: profile.address_detail,
            role: profile.role,
            approvalStatus: profile.approval_status
        };
    }
};
