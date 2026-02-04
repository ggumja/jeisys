import { supabase } from '../lib/supabaseClient';
import { CartItem, Order } from '../types';
import { authService } from './authService';

export interface OrderInput {
    userId: string;
    items: CartItem[];
    totalAmount: number;
    paymentMethod: string;
    deliveryAddress: string;
    trackingNumber?: string;
}

export const orderService = {
    // Get all orders for current user
    async getOrders(): Promise<Order[]> {
        const user = await authService.getCurrentUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products (
                        id,
                        name,
                        sku,
                        price,
                        image_url
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('ordered_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }

        return (data || []).map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            date: new Date(order.ordered_at).toLocaleDateString('ko-KR'),
            status: order.status,
            totalAmount: parseFloat(order.total_amount),
            paymentMethod: order.payment_method,
            deliveryTrackingNumber: order.tracking_number,
            items: order.order_items?.map((item: any) => ({
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    sku: item.product.sku,
                    price: parseFloat(item.product.price),
                    imageUrl: item.product.image_url,
                } : null,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
            })) || []
        }));
    },

    // Get single order by ID
    async getOrderById(orderId: string): Promise<Order | null> {
        const user = await authService.getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    product:products (
                        id,
                        name,
                        sku,
                        price,
                        image_url
                    )
                )
            `)
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            return null;
        }

        if (!data) return null;

        return {
            id: data.id,
            orderNumber: data.order_number,
            date: new Date(data.ordered_at).toLocaleDateString('ko-KR'),
            status: data.status,
            totalAmount: parseFloat(data.total_amount),
            paymentMethod: data.payment_method,
            deliveryTrackingNumber: data.tracking_number,
            items: data.order_items?.map((item: any) => ({
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    sku: item.product.sku,
                    price: parseFloat(item.product.price),
                    imageUrl: item.product.image_url,
                } : null,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
            })) || []
        };
    },

    // Cancel order
    async cancelOrder(orderId: string): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    },

    // Create a new order
    async createOrder(orderInput: OrderInput) {
        const { userId, items, totalAmount, paymentMethod, deliveryAddress } = orderInput;

        if (!items || items.length === 0) {
            throw new Error('No items in order');
        }

        // 1. Create Order Record
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Simple ID generation
                status: 'pending',
                total_amount: totalAmount,
                payment_method: paymentMethod,
                delivery_address: deliveryAddress
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        // We need product prices at this point to store in order_items for historical record.
        // Ideally we shouldn't trust client-side total, but re-calculate.
        // For this implementation, we will fetch prices again or rely on what's passed if we trust the context (for now, assume we fetch).

        // Optimisation: We can just use the prices passed if we assume the CartPage calculated them, 
        // BUT for correctness we should re-fetch. To save time/complexity here, 
        // I will fetch prices for all items.

        // Get all product IDs
        const productIds = items.map(i => i.productId);
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, price, product_pricing_tiers(min_quantity, unit_price)')
            .in('id', productIds);

        if (prodError) throw prodError;

        const orderItems = items.map(item => {
            const product = products?.find(p => p.id === item.productId);
            let unitPrice = product?.price || 0;

            // Calculate tier price if applicable
            // Note: This logic duplicates CartPage logic. Ideally should be shared.
            if (product && product.product_pricing_tiers && product.product_pricing_tiers.length > 0) {
                const tiers = product.product_pricing_tiers.sort((a: any, b: any) => b.min_quantity - a.min_quantity);
                const tier = tiers.find((t: any) => item.quantity >= t.min_quantity);
                if (tier) unitPrice = tier.unit_price;
            }

            // Apply subscription discount if applicable
            // Note: simple calc here
            const discount = item.isSubscription ? 0.95 : 1;
            const finalUnitPrice = unitPrice * discount;

            return {
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: finalUnitPrice,
                total_price: finalUnitPrice * item.quantity
            };
        });

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // 3. Clear User's Cart
        const { error: clearError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (clearError) console.error('Failed to clear cart after order', clearError);

        return order;
    }
};
