import { supabase } from '../lib/supabaseClient';
import { CartItem, Order } from '../types';
import { authService } from './authService';
import { paymentService } from './paymentService';

export interface OrderInput {
    userId: string;
    items: CartItem[];
    totalAmount: number;
    paymentMethod: string;
    deliveryAddress: string;
    trackingNumber?: string;
    billingKeyId?: string; // KICC Billing Key ID from user_payment_methods
    billingKey?: string;   // KICC Billing Key string
    subscriptionCycle?: number; // Days (30, 60, 90)
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
        const { userId, items, totalAmount, paymentMethod, deliveryAddress, billingKeyId, billingKey, subscriptionCycle } = orderInput;

        if (!items || items.length === 0) {
            throw new Error('No items in order');
        }

        // 1. Handle Payment if Billing Key is provided (KICC EasyPay Integration)
        let initialStatus = 'pending';
        let paymentReference = '';

        if (paymentMethod === 'credit' && billingKey) {
            const paymentResult: any = await paymentService.requestPayment({
                userId,
                billingKey,
                amount: totalAmount,
                orderName: items.length > 1 ? `${items[0].productId} 외 ${items.length - 1}건` : `Order ${Date.now()}`,
                orderNumber: `ORD-${Date.now()}`
            });

            if (paymentResult.success) {
                initialStatus = 'paid';
                paymentReference = paymentResult.tid;
            } else {
                throw new Error('Payment failed: ' + (paymentResult.message || 'Unknown error'));
            }
        }

        // 2. Create Order Record
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                status: initialStatus,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                delivery_address: deliveryAddress,
                pg_tid: paymentReference // Store TID for reference/refunds
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 3. Create Subscription Records if applicable
        const hasSubscriptionItems = items.some(i => i.isSubscription);
        if (hasSubscriptionItems && billingKeyId && subscriptionCycle) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + subscriptionCycle);

            const { error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    original_order_id: order.id,
                    status: 'active',
                    billing_key_id: billingKeyId,
                    cycle_days: subscriptionCycle,
                    next_billing_date: nextDate.toISOString().split('T')[0]
                });

            if (subError) console.error('Failed to create subscription record:', subError);
        }

        // 4. Create Order Items
        const productIds = items.map(i => i.productId);
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, price, product_pricing_tiers(min_quantity, unit_price)')
            .in('id', productIds);

        if (prodError) throw prodError;

        const orderItems = items.map(item => {
            const product = products?.find(p => p.id === item.productId);
            let unitPrice = product?.price || 0;

            if (product && product.product_pricing_tiers && product.product_pricing_tiers.length > 0) {
                const tiers = [...product.product_pricing_tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity);
                const tier = tiers.find((t: any) => item.quantity >= t.min_quantity);
                if (tier) unitPrice = tier.unit_price;
            }

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

        // 5. Update Inventory
        for (const item of items) {
            try {
                const { data: product, error: fetchError } = await supabase
                    .from('products')
                    .select('id, stock, base_product_id, stock_multiplier')
                    .eq('id', item.productId)
                    .single();

                if (fetchError || !product) continue;

                const targetProductId = product.base_product_id || product.id;
                const decrementAmount = (item.quantity || 1) * (product.stock_multiplier || 1);

                const { error: stockError } = await supabase.rpc('decrement_stock', {
                    row_id: targetProductId,
                    amount: decrementAmount
                });

                if (stockError) {
                    const { data: targetProd } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', targetProductId)
                        .single();

                    if (targetProd) {
                        await supabase
                            .from('products')
                            .update({ stock: Math.max(0, targetProd.stock - decrementAmount) })
                            .eq('id', targetProductId);
                    }
                }
            } catch (err) {
                console.error('Failed to update stock for item', item.productId, err);
            }
        }

        // 6. Clear User's Cart
        const { error: clearError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (clearError) console.error('Failed to clear cart after order', clearError);

        return order;
    }
};
