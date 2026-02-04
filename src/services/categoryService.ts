import { supabase } from '../lib/supabaseClient';

export interface Category {
    id: string;
    name: string;
    productCount: number;
    parentId: string | null;
    order: number;
}

export const categoryService = {
    async getCategories(): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }

        return data.map(item => ({
            id: item.id,
            name: item.name,
            productCount: 0, // Should be calculated later if needed
            parentId: item.parent_id,
            order: item.display_order,
        }));
    },

    async saveCategories(categories: Category[]): Promise<void> {
        // This is a bit complex because we need to handle sync.
        // Simplifying: Delete all and re-insert, or perform upsert.
        // For hierarchies, we need to be careful with IDs if they are temporary.

        // First, separate categories by those that already have UUIDs and those that have temporary IDs
        const existingCategories = categories.filter(c => c.id.length === 36); // Typical UUID length
        const newCategories = categories.filter(c => c.id.length !== 36);

        // For simplicity and to match the current UI logic (which uses temporary IDs for new items),
        // we should probably handle this carefully.

        // Better way: Upsert all with correct parent mapping.
        // Since the UI might have changed orders and names, we'll sync.

        for (const cat of categories) {
            const isNew = cat.id.length !== 36;
            const { data, error } = await supabase
                .from('categories')
                .upsert({
                    ...(isNew ? {} : { id: cat.id }),
                    name: cat.name,
                    parent_id: cat.parentId && cat.parentId.length === 36 ? cat.parentId : null,
                    display_order: cat.order
                })
                .select()
                .single();

            if (error) throw error;

            // If it was new, we might need to update its children's parent_id
            if (isNew) {
                const tempId = cat.id;
                const realId = data.id;
                categories.forEach(child => {
                    if (child.parentId === tempId) {
                        child.parentId = realId;
                    }
                });
                cat.id = realId; // Update local ref
            }
        }

        // Finally, remove categories that are no longer in the list
        const currentIds = categories.map(c => c.id);
        const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .not('id', 'in', `(${currentIds.join(',')})`);

        if (deleteError) {
            console.warn('Error deleting old categories:', deleteError);
        }
    },

    async deleteCategory(id: string): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateCategoryName(id: string, name: string): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .update({ name })
            .eq('id', id);

        if (error) throw error;
    }
};
