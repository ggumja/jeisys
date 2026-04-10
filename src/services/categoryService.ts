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
        // Fetch existing categories to detect name changes
        const { data: oldCategories } = await supabase.from('categories').select('id, name');
        const oldNameMap = new Map(oldCategories?.map(c => [c.id, c.name]) || []);

        for (const cat of categories) {
            const isNew = cat.id.length !== 36;
            const oldName = oldNameMap.get(cat.id);
            const isNameChanged = !isNew && oldName && oldName !== cat.name;

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

            // If name changed, update all products referencing this category
            if (isNameChanged && oldName) {
                // Determine if this is a parent or child category to update correct field
                const isParent = !cat.parentId;
                
                if (isParent) {
                    await supabase
                        .from('products')
                        .update({ category: cat.name })
                        .eq('category', oldName);
                } else {
                    await supabase
                        .from('products')
                        .update({ subcategory: cat.name })
                        .eq('subcategory', oldName);
                }
            }

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
