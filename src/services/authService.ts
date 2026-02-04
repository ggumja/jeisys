import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

export const authService = {
    async signUp(email: string, password: string, userData: Omit<User, 'id' | 'email'>) {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: userData.name,
                    hospital_name: userData.hospitalName,
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // 2. Insert into public.users table (assuming RLS allows insert for authenticated user matching ID)
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: email,
                name: userData.name,
                hospital_name: userData.hospitalName,
                business_number: userData.businessNumber,
                phone: userData.phone
            });

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Optional: Cleanup auth user if profile creation fails
            throw profileError;
        }

        return authData;
    },

    async signIn(email: string, password: string) {
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
            // Fallback to auth metadata if profile fetch fails
            return {
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || '',
                hospitalName: user.user_metadata?.hospital_name || '',
                businessNumber: '',
                phone: ''
            };
        }

        return {
            id: profile.id,
            email: profile.email || user.email || '',
            name: profile.name,
            hospitalName: profile.hospital_name,
            businessNumber: profile.business_number,
            phone: profile.phone
        };
    }
};
