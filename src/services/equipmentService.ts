import { supabase } from '../lib/supabaseClient';
import { Equipment } from '../types';

export interface EquipmentModel {
    id: string;
    model_name: string;
    code: string;
    category: string;
    image_url: string;
}

export const equipmentService = {
    // Get all equipment models (for registration dropdown)
    async getEquipmentModels(): Promise<EquipmentModel[]> {
        const { data, error } = await supabase
            .from('equipments')
            .select('*')
            .order('model_name');

        if (error) throw error;
        return data || [];
    },

    // Get user's registered equipment
    async getUserEquipment(): Promise<Equipment[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('user_equipments')
            .select(`
        id,
        serial_number,
        install_date,
        warranty_end_date,
        equipment:equipments (
          model_name,
          category,
          image_url
        )
      `)
            .eq('user_id', user.id);

        if (error) throw error;

        // Transform to frontend Equipment type
        return (data || []).map(item => ({
            id: item.id,
            serialNumber: item.serial_number,
            installDate: item.install_date,
            warrantyEndDate: item.warranty_end_date,
            // @ts-ignore - Supabase types join
            modelName: item.equipment?.model_name || 'Unknown',
            // @ts-ignore
            category: item.equipment?.category || 'Unknown',
            // @ts-ignore
            imageUrl: item.equipment?.image_url || '',
        }));
    },

    // Register new equipment for user
    async registerEquipment(equipmentId: string, serialNumber: string, installDate: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Calculate warranty end date (default 1 year from install)
        const install = new Date(installDate);
        const warrantyEnd = new Date(install);
        warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);

        const { data, error } = await supabase
            .from('user_equipments')
            .insert({
                user_id: user.id,
                equipment_id: equipmentId,
                serial_number: serialNumber,
                install_date: installDate,
                warranty_end_date: warrantyEnd.toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
