import { supabase } from '../lib/supabaseClient';
import { CartItem, Order } from '../types';
import { authService } from './authService';
import { paymentService } from './paymentService';
import { creditService } from './creditService';

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
    splitPayments?: {
        method: 'credit' | 'virtual';
        amount: number;
        billingKeyId?: string;
        billingKey?: string;
    }[];
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
                        image_url,
                        is_promotion,
                        buy_quantity,
                        get_quantity
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('ordered_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }

        const orders = data || [];

        // 주문 ID 목록으로 shipments 별도 조회
        const orderIds = orders.map((o: any) => o.id);
        let bonusMap: Record<string, Array<{ productName: string; quantity: number }>> = {};
        let shipmentsByOrderId: Record<string, any[]> = {};
        if (orderIds.length > 0) {
            const { data: shipmentsData } = await supabase
                .from('shipments')
                .select(`
                    *,
                    items:shipment_items(
                        quantity:shipped_quantity,
                        product_id,
                        product:products(name)
                    )
                `)
                .in('order_id', orderIds)
                .order('shipped_at', { ascending: true });

            // product_bonus_items를 위한 product_id 목록 수집 (shipment + order_items 모두)
            const productIds = new Set<string>();
            (shipmentsData || []).forEach((s: any) => s.items?.forEach((i: any) => {
                if (i.product_id) productIds.add(i.product_id);
            }));
            orders.forEach((o: any) => o.order_items?.forEach((i: any) => {
                if (i.product_id) productIds.add(i.product_id);
            }));

            if (productIds.size > 0) {
                const { data: bonusData } = await supabase
                    .from('product_bonus_items')
                    .select(`
                        parent_product_id,
                        quantity,
                        calculation_method,
                        percentage,
                        product:products!bonus_product_id(id, name)
                    `)
                    .in('parent_product_id', Array.from(productIds));

                if (bonusData) {
                    bonusData.forEach((b: any) => {
                        if (!bonusMap[b.parent_product_id]) bonusMap[b.parent_product_id] = [];
                        bonusMap[b.parent_product_id].push({
                            productName: b.product?.name || '',
                            quantity: b.quantity || 1,
                            calculationMethod: b.calculation_method || 'fixed',
                            percentage: b.percentage || 0,
                        });
                    });
                }
            }

            if (shipmentsData) {
                // 주문 수량 맵 (orderId → productId → orderedQty) — 발송 bonus 비례 계산용
                const orderedQtyMap: Record<string, Record<string, number>> = {};
                orders.forEach((o: any) => {
                    o.order_items?.forEach((oi: any) => {
                        if (!orderedQtyMap[o.id]) orderedQtyMap[o.id] = {};
                        orderedQtyMap[o.id][oi.product_id] = oi.quantity;
                    });
                });

                shipmentsData.forEach((s: any) => {
                    if (!shipmentsByOrderId[s.order_id]) shipmentsByOrderId[s.order_id] = [];
                    shipmentsByOrderId[s.order_id].push({
                        id: s.id,
                        trackingNumber: s.tracking_number,
                        shippedAt: s.shipped_at,
                        isPartial: s.is_partial,
                        items: s.items?.map((item: any) => {
                            const orderedQty = orderedQtyMap[s.order_id]?.[item.product_id] || item.quantity;
                            return {
                                productName: item.product?.name || 'Unknown',
                                quantity: item.quantity,
                                // bonus 수량 = DB 전체 수량 × (발송수량 / 주문수량)
                                bonusItems: (bonusMap[item.product_id] || []).map(b => ({
                                    ...b,
                                    quantity: Math.round(b.quantity * item.quantity / orderedQty),
                                })),
                            };
                        }) || [],
                    });
                });
            }
        }

        return orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            date: new Date(order.ordered_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            status: order.status,
            totalAmount: parseFloat(order.total_amount),
            paymentMethod: order.payment_method,
            deliveryTrackingNumber: order.tracking_number,
            claimInfo: order.claim_info ? {
                type: order.claim_info.type,
                reason: order.claim_info.reason,
                requestedAt: order.claim_info.requested_at,
                processedAt: order.claim_info.processed_at,
                rejectedReason: order.claim_info.rejected_reason,
                returnTrackingNumber: order.claim_info.return_tracking_number,
                exchangeTrackingNumber: order.claim_info.exchange_tracking_number,
            } : undefined,
            shipments: shipmentsByOrderId[order.id] || [],
            vactBankName: order.vact_bank_name,
            vactNum: order.vact_num,
            vactName: order.vact_name,
            vactInputDeadline: order.vact_input_deadline,
            items: order.order_items?.map((item: any) => ({
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    sku: item.product.sku,
                    price: parseFloat(item.product.price),
                    imageUrl: item.product.image_url,
                    isPromotion: item.product.is_promotion,
                    buyQuantity: item.product.buy_quantity,
                    getQuantity: item.product.get_quantity,
                } : null,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
                totalPrice: parseFloat(item.total_price || item.unit_price),
                originalPrice: item.original_unit_price ? parseFloat(item.original_unit_price) : null,
                discountRate: parseFloat(item.discount_rate || '0'),
                shippedQuantity: item.shipped_quantity ?? undefined,
                selectedProductIds: item.selected_product_ids,
                bonusItems: bonusMap[item.product_id] || [],
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
                        image_url,
                        is_promotion,
                        buy_quantity,
                        get_quantity
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
            date: new Date(data.ordered_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            status: data.status,
            totalAmount: parseFloat(data.total_amount),
            paymentMethod: data.payment_method,
            deliveryTrackingNumber: data.tracking_number,
            claimInfo: data.claim_info ? {
                type: data.claim_info.type,
                reason: data.claim_info.reason,
                requestedAt: data.claim_info.requested_at,
                processedAt: data.claim_info.processed_at,
                rejectedReason: data.claim_info.rejected_reason,
                returnTrackingNumber: data.claim_info.return_tracking_number,
                exchangeTrackingNumber: data.claim_info.exchange_tracking_number,
            } : undefined,
            shipments: data.shipments || [],
            vactBankName: data.vact_bank_name,
            vactNum: data.vact_num,
            vactName: data.vact_name,
            vactInputDeadline: data.vact_input_deadline,
            items: data.order_items?.map((item: any) => ({
                product: item.product ? {
                    id: item.product.id,
                    name: item.product.name,
                    sku: item.product.sku,
                    price: parseFloat(item.product.price),
                    imageUrl: item.product.image_url,
                    isPromotion: item.product.is_promotion,
                    buyQuantity: item.product.buy_quantity,
                    getQuantity: item.product.get_quantity,
                } : null,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
                totalPrice: parseFloat(item.total_price || item.unit_price),
                originalPrice: item.original_unit_price ? parseFloat(item.original_unit_price) : null,
                discountRate: parseFloat(item.discount_rate || '0'),
                shippedQuantity: item.shipped_quantity ?? undefined,
                selectedProductIds: item.selected_product_ids
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

        // 히스토리 기록
        await this.logOrderHistory(orderId, 'cancelled', '주문 취소 (사용자)', '사용자가 직접 주문을 취소하였습니다.');

        // 크레딧 환불 처리
        try {
          const refunded = await creditService.refundOrderCredits(orderId);
          if (refunded > 0) {
            console.log(`크레딧 환불 완료: ₩${refunded.toLocaleString()}`);
          }
        } catch (creditError) {
          // 환불 실패 시 콘솔 에러만 - 주문 취소 자체는 유지
          console.error('크레딧 환불 중 오류:', creditError);
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
        let vactInfo: any = null;

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
        } else if (paymentMethod === 'virtual') {
            const vactResult: any = await paymentService.issueVirtualAccount({
                amount: totalAmount,
                orderNumber: `ORD-${Date.now()}`,
                customerName: 'Customer' // In real app, fetch from user profile
            });

            if (vactResult.success) {
                initialStatus = 'pending';
                vactInfo = vactResult;
            } else {
                throw new Error('Virtual account issuance failed');
            }
        } else if (paymentMethod === 'transfer') {
            initialStatus = 'pending';
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
                pg_tid: vactInfo?.tid || paymentReference, // Store TID for reference/refunds
                vact_bank_name: vactInfo?.bankName,
                vact_num: vactInfo?.accountNum,
                vact_name: vactInfo?.accountName,
                vact_input_deadline: vactInfo?.deadline
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2-1. Record Initial Payment in History
        if (initialStatus === 'paid' || (paymentMethod === 'virtual' && vactInfo) || paymentMethod === 'transfer') {
            await supabase.from('payment_history').insert({
                order_id: order.id,
                transaction_type: 'PAYMENT',
                amount: totalAmount,
                pg_tid: vactInfo?.tid || paymentReference || null,
                status: paymentMethod === 'transfer' ? 'PENDING' : 'SUCCESS',
                method: paymentMethod,
                reason: paymentMethod === 'virtual' ? '가상계좌 발급 완료' : paymentMethod === 'transfer' ? '무통장입금 대기' : '신용카드 결제 완료'
            });
        }

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
        const allProductIds = new Set<string>();
        items.forEach(item => {
            allProductIds.add(item.productId);
            item.selectedProductIds?.forEach(id => allProductIds.add(id));
        });

        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, price, is_promotion, buy_quantity, product_pricing_tiers(min_quantity, unit_price)')
            .in('id', Array.from(allProductIds));

        if (prodError) throw prodError;

        // 옵션 할인율 조회 (product_quantity_options)
        const allOptionIds = items.map(i => (i as any).optionId).filter(Boolean);
        let optionsMap: Record<string, { discount_rate: number; price: number | null; quantity: number }> = {};
        if (allOptionIds.length > 0) {
            const { data: optData } = await supabase
                .from('product_quantity_options')
                .select('id, discount_rate, price, quantity')
                .in('id', allOptionIds);
            (optData || []).forEach((o: any) => {
                optionsMap[o.id] = { discount_rate: Number(o.discount_rate || 0), price: o.price, quantity: o.quantity || 1 };
            });
        }

        const orderItems = items.map(item => {
            const product = products?.find(p => p.id === item.productId);
            let unitPrice = 0;
            let listPrice = 0;

            const isBundle = !!(item.selectedProductIds && item.selectedProductIds.length > 0);
            const opt = optionsMap[(item as any).optionId];

            if (isBundle) {
                // ─── 번들 상품 ───
                // unit_price = 1세트 전체 결제금액 (per-unit 아님)
                const buyQty = product?.buy_quantity || 0;
                const paidItemIds = buyQty > 0
                    ? item.selectedProductIds!.slice(0, buyQty)
                    : item.selectedProductIds!;

                const paidSubTotal = paidItemIds.reduce((sum, id) => {
                    const subProd = products?.find(p => p.id === id);
                    return sum + (subProd?.price || 0);
                }, 0);
                const allSubTotal = item.selectedProductIds!.reduce((sum, id) => {
                    const subProd = products?.find(p => p.id === id);
                    return sum + (subProd?.price || 0);
                }, 0);

                if (paidSubTotal > 0) {
                    // 구성품 가격 합산 사용
                    unitPrice = paidSubTotal;
                    listPrice = allSubTotal > paidSubTotal ? allSubTotal : paidSubTotal;
                } else {
                    // fallback: product.price × opt.quantity 또는 product.price
                    const optQty = opt?.quantity || 1;
                    const totalBase = (opt?.price && opt.price > 0)
                        ? opt.price
                        : (product?.price || 0) * optQty;
                    listPrice = totalBase;
                    unitPrice = totalBase;
                }

                // 옵션 할인율 적용 (set 전체에 적용, ÷3qty 하지 않음)
                if (opt && opt.discount_rate > 0) {
                    listPrice = listPrice || unitPrice;
                    unitPrice = Math.round(unitPrice * (1 - opt.discount_rate / 100));
                }

            } else {
                // ─── 일반 상품 ───
                if (opt) {
                    // 옵션 선택 시: per-unit 가격으로 저장
                    const baseQty = opt.quantity || 1;
                    const totalBase = (opt.price && opt.price > 0)
                        ? opt.price
                        : (product?.price || 0) * baseQty;
                    listPrice = Math.round(totalBase / baseQty);          // per-unit 정가
                    unitPrice = Math.round(listPrice * (1 - opt.discount_rate / 100)); // per-unit 할인가
                } else {
                    listPrice = product?.price || 0;
                    unitPrice = listPrice;
                    // 구간 할인 적용
                    if (product?.product_pricing_tiers && product.product_pricing_tiers.length > 0) {
                        const tiers = [...product.product_pricing_tiers].sort((a: any, b: any) => b.min_quantity - a.min_quantity);
                        const tier = tiers.find((t: any) => item.quantity >= t.min_quantity);
                        if (tier) unitPrice = tier.unit_price;
                    }
                }
            }

            const subscriptionDiscount = item.isSubscription ? 0.95 : 1;
            const finalUnitPrice = unitPrice * subscriptionDiscount;
            // 번들: 정가에도 구독 할인 미적용된 원본 사용
            const finalListPrice = isBundle ? listPrice : listPrice;

            // 총 할인율
            const discountRate = finalListPrice > 0
                ? Math.round((1 - finalUnitPrice / finalListPrice) * 100 * 10) / 10
                : 0;

            // 번들: total_price = unit_price(= 세트 전체 가격)  /  일반: total_price = unit_price × 수량
            const totalPrice = isBundle ? finalUnitPrice : finalUnitPrice * item.quantity;

            return {
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: finalUnitPrice,
                total_price: totalPrice,
                original_unit_price: finalListPrice || null,
                discount_rate: discountRate,
                selected_product_ids: item.selectedProductIds
            };
        });

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // 5. Update Inventory
        for (const item of items) {
            try {
                // Determine which products to decrement
                const decrementList: { id: string, amount: number }[] = [];
                
                if (item.selectedProductIds && item.selectedProductIds.length > 0) {
                    // Bundle: Decrement each selected product
                    item.selectedProductIds.forEach(id => {
                        decrementList.push({ id, amount: item.quantity });
                    });
                } else {
                    // Regular: Decrement main product
                    decrementList.push({ id: item.productId, amount: item.quantity });
                }

                for (const dec of decrementList) {
                    const { data: product, error: fetchError } = await supabase
                        .from('products')
                        .select('id, stock, base_product_id, stock_multiplier')
                        .eq('id', dec.id)
                        .single();

                    if (fetchError || !product) continue;

                    const targetProductId = product.base_product_id || product.id;
                    const decrementAmount = (dec.amount || 1) * (product.stock_multiplier || 1);

                    const { error: stockError } = await supabase.rpc('decrement_stock', {
                        row_id: targetProductId,
                        amount: decrementAmount
                    });

                    if (stockError) {
                        console.error('Failed to decrement stock via RPC:', stockError);
                        // Fallback: Manual update
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

        // 히스토리 기록
        const methodLabel = paymentMethod === 'credit' ? '신용카드' : paymentMethod === 'virtual' ? '가상계좌' : paymentMethod;
        await this.logOrderHistory(order.id, initialStatus, '주문 생성', 
            `주문이 생성되었습니다. (결제수단: ${methodLabel})`
        );

        return order;
    },

    // 히스토리 기록 헬퍼
    async logOrderHistory(orderId: string, afterStatus: string, title: string, description?: string) {
        try {
            const { data: current } = await supabase.from('orders').select('status').eq('id', orderId).single();
            const { data: { user } } = await supabase.auth.getUser();

            await supabase.from('order_status_history').insert({
                order_id: orderId,
                before_status: current?.status,
                after_status: afterStatus,
                action_title: title,
                action_description: description,
                admin_id: user?.id
            });
        } catch (e) {
            console.error('Error logging order history:', e);
        }
    },

    // 고객 클레임 신청 (취소/반품/교환)
    async requestClaim(orderId: string, type: 'CANCEL' | 'RETURN' | 'EXCHANGE', reason: string): Promise<void> {
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        let newStatus = '';
        if (type === 'CANCEL') newStatus = 'cancel_requested';
        else if (type === 'RETURN') newStatus = 'return_requested';
        else if (type === 'EXCHANGE') newStatus = 'exchange_requested';

        const claimInfo = {
            type,
            reason,
            requested_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('orders')
            .update({
                status: newStatus,
                claim_info: claimInfo,
            })
            .eq('id', orderId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error submitting claim:', error);
            throw error;
        }

        const historyAction = type === 'CANCEL' ? '결제 취소 신청' : type === 'RETURN' ? '반품 신청' : '교환 신청';
        await this.logOrderHistory(
            orderId,
            newStatus,
            historyAction,
            `고객 신청 사유: ${reason}`
        );
    },
};

