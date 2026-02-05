import { supabase } from '../lib/supabaseClient';
import { User, SignupEquipment } from '../types';

export const authService = {
    // Helper to generate virtual email from loginId
    getVirtualEmail(loginId: string) {
        if (loginId.includes('@')) return loginId; // Handle case where email is provided
        return `${loginId}@jeisys.com`;
    },

    async checkLoginIdAvailability(loginId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('users')
            .select('login_id')
            .eq('login_id', loginId)
            .maybeSingle();

        if (error) throw error;
        return !data; // Returns true if available (no data found), false if taken
    },

    async uploadBusinessCertificate(userId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('business-certificates')
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('business-certificates')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    async signUp(
        loginId: string,
        password: string,
        userData: Omit<User, 'id' | 'email' | 'loginId'>,
        equipmentList: SignupEquipment[] = [],
        businessCertificateFile?: File | null
    ) {
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

        let businessCertificateUrl = null;
        if (businessCertificateFile) {
            try {
                businessCertificateUrl = await this.uploadBusinessCertificate(authData.user.id, businessCertificateFile);
            } catch (error) {
                console.error('Business certificate upload failed:', error);
                // Continue signup even if file upload fails, or decide to fail?
                // For now, log and continue.
            }
        }

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
                phone: userData.phone,
                mobile: userData.mobile,
                zip_code: userData.zipCode,
                address: userData.address,
                address_detail: userData.addressDetail,
                region: userData.region,
                hospital_email: userData.hospitalEmail,
                tax_email: userData.taxEmail,
                business_certificate_url: businessCertificateUrl,
                email_notification: userData.emailNotification,
                holiday_week: userData.holidayWeek,
                holiday_day: userData.holidayDay,
                is_public_holiday: userData.isPublicHoliday
            });

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw profileError;
        }

        // 3. Insert User Equipments
        const selectedEquipments = equipmentList.filter(e => e.selected);
        if (selectedEquipments.length > 0) {
            // Fetch equipment IDs based on names
            const { data: dbEquipments, error: eqError } = await supabase
                .from('equipments')
                .select('id, model_name')
                .in('model_name', selectedEquipments.map(e => e.name));

            if (eqError) {
                console.error('Error fetching equipments:', eqError);
            } else if (dbEquipments && dbEquipments.length > 0) {
                const equipmentMap = new Map(dbEquipments.map(e => [e.model_name, e.id]));

                const userEquipmentsToInsert = selectedEquipments
                    .filter(e => equipmentMap.has(e.name))
                    .map(e => ({
                        user_id: authData.user!.id,
                        equipment_id: equipmentMap.get(e.name),
                        serial_number: e.serialNumber
                    }));

                if (userEquipmentsToInsert.length > 0) {
                    const { error: insertEqError } = await supabase
                        .from('user_equipments')
                        .insert(userEquipmentsToInsert);

                    if (insertEqError) console.error('Error inserting user equipments:', insertEqError);
                }
            }
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
            mobile: profile.mobile,
            zipCode: profile.zip_code,
            address: profile.address,
            addressDetail: profile.address_detail,
            region: profile.region,
            hospitalEmail: profile.hospital_email,
            taxEmail: profile.tax_email,
            businessCertificateUrl: profile.business_certificate_url,
            emailNotification: profile.email_notification,
            holidayWeek: profile.holiday_week,
            holidayDay: profile.holiday_day,
            isPublicHoliday: profile.is_public_holiday,
            role: profile.role,
            approvalStatus: profile.approval_status
        };
    }
};
