import { supabase } from '../lib/supabaseClient';
import { CartItem } from '../types';

export const cartService = {
    // Get cart items for current user
    async getCart(): Promise<CartItem[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                product_id,
                quantity,
                is_subscription,
                selected_product_ids,
                option_id,
                option_name
            `)
            .eq('user_id', user.id);

        if (error) throw error;

        return data.map(item => ({
            id: item.id,
            productId: item.product_id,
            quantity: item.quantity,
            isSubscription: item.is_subscription,
            selectedProductIds: item.selected_product_ids,
            optionId: item.option_id,
            optionName: item.option_name,
        }));
    },

    // Add item to cart
    async addToCart(
        productId: string, 
        quantity: number, 
        isSubscription: boolean = false, 
        selectedProductIds?: string[],
        optionId?: string,
        optionName?: string
    ) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Check if identical item exists (same product AND same selections AND same option)
        let query = supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (selectedProductIds && selectedProductIds.length > 0) {
            query = query.eq('selected_product_ids', selectedProductIds);
        } else {
            query = query.is('selected_product_ids', null);
        }

        if (optionId) {
            query = query.eq('option_id', optionId);
        } else {
            query = query.is('option_id', null);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
            // Update quantity
            const { error } = await supabase
                .from('cart_items')
                .update({
                    quantity: existing.quantity + quantity,
                    is_subscription: isSubscription
                })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: user.id,
                    product_id: productId,
                    quantity,
                    is_subscription: isSubscription,
                    selected_product_ids: selectedProductIds || null,
                    option_id: optionId || null,
                    option_name: optionName || null
                });
            if (error) throw error;
        }
    },

    // Update item quantity
    async updateQuantity(cartItemId: string, quantity: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItemId)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    // Toggle subscription (using update)
    async updateSubscription(cartItemId: string, isSubscription: boolean) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .update({ is_subscription: isSubscription })
            .eq('id', cartItemId)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    // Remove item
    async removeItem(cartItemId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId)
            .eq('user_id', user.id);

        if (error) throw error;
    },

    // Clear cart
    async clearCart() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;
    }
};
