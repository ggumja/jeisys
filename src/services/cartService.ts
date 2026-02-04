import { supabase } from '../lib/supabaseClient';
import { CartItem } from '../types';

export const cartService = {
    // Get cart items for current user
    async getCart(): Promise<CartItem[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return []; // Or generic empty if not logged in

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
        product_id,
        quantity,
        is_subscription
      `)
            .eq('user_id', user.id);

        if (error) throw error;

        return data.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            isSubscription: item.is_subscription,
        }));
    },

    // Add item to cart
    async addToCart(productId: string, quantity: number, isSubscription: boolean = false) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Check if item exists
        const { data: existing } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            // Update quantity
            const { error } = await supabase
                .from('cart_items')
                .update({
                    quantity: existing.quantity + quantity,
                    is_subscription: isSubscription // Update subscription status if needed
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
                    is_subscription: isSubscription
                });
            if (error) throw error;
        }
    },

    // Update item quantity
    async updateQuantity(productId: string, quantity: number) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;
    },

    // Toggle subscription (using update)
    async updateSubscription(productId: string, isSubscription: boolean) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .update({ is_subscription: isSubscription })
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;
    },

    // Remove item
    async removeItem(productId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

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
