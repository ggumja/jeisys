import { supabase } from '../lib/supabaseClient';

export interface PaymentHistory {
    id: string;
    orderId: string;
    transactionType: 'PAYMENT' | 'REFUND' | 'PARTIAL_REFUND';
    amount: number;
    pgTid?: string;
    status: 'SUCCESS' | 'FAILURE';
    reason?: string;
    method?: string;
    createdAt: string;
}

export interface OrderHistory {
    id: string;
    orderId: string;
    beforeStatus?: string;
    afterStatus: string;
    actionTitle: string;
    actionDescription?: string;
    adminId?: string;
    createdAt: string;
}

export const adminService = {
    // Dashboard Stats
    async getDashboardStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // 1. Sales & Orders
        const { data: monthOrders, error: monthError } = await supabase
            .from('orders')
            .select('total_amount, id')
            .gte('ordered_at', startOfMonth);

        if (monthError) throw monthError;

        const monthSales = monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const monthOrderCount = monthOrders.length;

        // 2. Counts
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: pendingUserCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('approval_status', 'PENDING');
        const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10);
        const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });

        // 3. Member Grade Distribution
        const { data: allUsers } = await supabase.from('users').select('id');
        const { data: allOrders } = await supabase.from('orders').select('user_id, total_amount').neq('status', 'cancelled');

        const salesMap = (allOrders || []).reduce((acc: any, order) => {
            acc[order.user_id] = (acc[order.user_id] || 0) + Number(order.total_amount);
            return acc;
        }, {});

        const distribution = {
            VIP: 0,
            Gold: 0,
            Silver: 0,
            Bronze: 0
        };

        (allUsers || []).forEach((user) => {
            const totalSales = salesMap[user.id] || 0;
            if (totalSales >= 50000000) distribution.VIP++;
            else if (totalSales >= 30000000) distribution.Gold++;
            else if (totalSales >= 10000000) distribution.Silver++;
            else distribution.Bronze++;
        });

        const totalU = allUsers?.length || 1;
        const gradeStats = {
            VIP: { count: distribution.VIP, percentage: Number(((distribution.VIP / totalU) * 100).toFixed(1)) },
            Gold: { count: distribution.Gold, percentage: Number(((distribution.Gold / totalU) * 100).toFixed(1)) },
            Silver: { count: distribution.Silver, percentage: Number(((distribution.Silver / totalU) * 100).toFixed(1)) },
            Bronze: { count: distribution.Bronze, percentage: Number(((distribution.Bronze / totalU) * 100).toFixed(1)) },
        };

        const { count: newUserCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth);

        return {
            monthSales,
            monthOrderCount,
            totalUsers: userCount || 0,
            newUsers: newUserCount || 0,
            pendingUsers: pendingUserCount || 0,
            lowStockProducts: lowStockCount || 0,
            totalProducts: totalProducts || 0,
            gradeStats
        };
    },

    // Orders
    async getOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        user:users!user_id(name, hospital_name, phone),
        order_items(
          *,
          product:products(name, category, image_url)
        )
      `)
            .order('ordered_at', { ascending: false });

        if (error) throw error;

        return data.map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            customerName: order.user?.name || 'Unknown',
            hospitalName: order.user?.hospital_name || '',
            orderDate: new Date(order.ordered_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            totalAmount: Number(order.total_amount),
            paymentMethod: order.payment_method === 'virtual' ? '가상계좌결제' :
                order.payment_method === 'credit' ? '신용카드결제' :
                    order.payment_method,
            status: order.status as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'cancel_requested' | 'return_requested' | 'returning' | 'returned' | 'exchange_requested',
            items: order.order_items?.length || 0,
            itemsSummary: order.order_items?.[0]
                ? (order.order_items.length > 1
                    ? `${order.order_items[0].product?.name} 외 ${order.order_items.length - 1}건`
                    : order.order_items[0].product?.name)
                : '상품 정보 없음',
            orderItems: order.order_items?.map((item: any) => ({
                id: item.id,
                productName: item.product?.name || 'Unknown Product',
                category: item.product?.category || '',
                quantity: item.quantity,
                price: Number(item.unit_price)
            })),
            shippingInfo: {
                recipient: order.user?.name || '',
                address: order.delivery_address || '',
                phone: order.user?.phone || ''
            },
            paymentInfo: {
                method: order.payment_method
            },
            // Keep original dates for sorting if needed
            orderedAt: order.ordered_at
        }));
    },
    async getOrderById(orderId: string) {
        // 1. 주문 기본 정보와 사용자 정보 로드
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                user:users!user_id(name, hospital_name, phone, email, address, address_detail, zip_code)
            `)
            .eq('id', orderId)
            .single();

        if (orderError) throw orderError;

        // 2. 주문 상품 내역을 별도로 로드 (재고 정보 포함)
        const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
                *,
                selected_product_ids,
                product:products(name, category, image_url, sku, stock, is_promotion, buy_quantity)
            `)
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('Error fetching order items:', itemsError);
        }

        // 2a. 번들 상품의 bonus_items 별도 조회
        const productIds = itemsData?.map((i: any) => i.product_id).filter(Boolean) || [];
        let bonusItemsByProductId: Record<string, Array<{ productName: string; quantity: number }>> = {};
        if (productIds.length > 0) {
            const { data: bonusData } = await supabase
                .from('product_bonus_items')
                .select(`
                    parent_product_id,
                    quantity,
                    calculation_method,
                    percentage,
                    product:products!bonus_product_id(id, name)
                `)
                .in('parent_product_id', productIds);

            if (bonusData) {
                bonusData.forEach((b: any) => {
                    if (!bonusItemsByProductId[b.parent_product_id]) {
                        bonusItemsByProductId[b.parent_product_id] = [];
                    }
                    bonusItemsByProductId[b.parent_product_id].push({
                        productId: b.product?.id || '',
                        productName: b.product?.name || '',
                        quantity: b.quantity || 1,
                        calculationMethod: b.calculation_method || 'fixed',
                        percentage: b.percentage || 0,
                    });
                });
            }
        }


        const { data: shipmentsData, error: shipmentsError } = await supabase
            .from('shipments')
            .select(`
                *,
                items:shipment_items(
                    quantity:shipped_quantity,
                    product_id,
                    product:products(name)
                )
            `)
            .eq('order_id', orderId)
            .order('shipped_at', { ascending: false });

        if (shipmentsError) {
            console.error('Error fetching shipments:', shipmentsError);
        }

        // 3. 결제 히스토리 조회
        const { data: payHistoryData, error: payHistoryError } = await supabase
            .from('payment_history')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (payHistoryError) {
            console.error('Error fetching payment history:', payHistoryError);
        }

        // 4. 주문 이력 조회 (통합 히스토리)
        const { data: historyData, error: historyError } = await supabase
            .from('order_status_history')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (historyError) {
            console.error('Error fetching order history:', historyError);
        }

        return {
            id: orderData.id,
            userId: orderData.user_id,
            orderNumber: orderData.order_number,
            customerName: orderData.user?.name || 'Unknown',
            hospitalName: orderData.user?.hospital_name || '',
            orderDate: new Date(orderData.ordered_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            totalAmount: Number(orderData.total_amount),
            status: orderData.status as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped' | 'cancel_requested' | 'return_requested' | 'returning' | 'returned' | 'exchange_requested',
            items: itemsData?.length || 0,
            orderItems: itemsData?.map((item: any) => ({
                id: item.id,
                productId: item.product_id,
                productName: item.product?.name || 'Unknown Product',
                category: item.product?.category || '',
                quantity: item.quantity,
                shippedQuantity: item.shipped_quantity || 0,
                stock: item.product?.stock ?? null,
                price: Number(item.unit_price),
                originalPrice: item.original_unit_price ? Number(item.original_unit_price) : null,
                discountRate: Number(item.discount_rate || 0),
                totalPrice: Number(item.total_price || (item.unit_price * item.quantity)),
                sku: item.product?.sku,
                selected_product_ids: item.selected_product_ids,
                product: item.product,
                shipped_selected_indices: item.shipped_selected_indices,
                shipped_quantity: item.shipped_quantity,
                bonusItems: bonusItemsByProductId[item.product_id] || []
            })) || [],
            shippingInfo: {
                recipient: orderData.user?.name || '',
                address: orderData.delivery_address || '',
                addressDetail: orderData.user?.address_detail || '',
                zipCode: orderData.user?.zip_code || '',
                phone: orderData.user?.phone || '',
                email: orderData.user?.email
            },
            paymentInfo: {
                method: orderData.payment_method === 'virtual' ? '가상계좌결제' :
                    orderData.payment_method === 'credit' ? '신용카드결제' :
                        orderData.payment_method
            },
            paymentMethod: orderData.payment_method,
            trackingNumber: orderData.tracking_number,
            shippedAt: orderData.shipped_at,
            isSubscription: orderData.is_subscription,
            subscriptionCycle: orderData.subscription_cycle,
            subscriptionStatus: orderData.subscription_status as 'active' | 'paused' | 'cancelled',
            subscriptionStartDate: orderData.subscription_start_date,
            deliveryCount: orderData.delivery_count,
            shipments: shipmentsData?.map((shipment: any) => ({
                id: shipment.id,
                trackingNumber: shipment.tracking_number,
                shippedAt: shipment.shipped_at,
                isPartial: shipment.is_partial,
                items: shipment.items?.map((item: any) => ({
                    productName: item.product?.name || 'Unknown',
                    productId: item.product_id,
                    quantity: item.quantity,
                    bonusItems: bonusItemsByProductId[item.product_id] || []
                })) || [],
                bonusItems: shipment.bonus_items || [],
                shippingInfo: shipment.shipping_info || null
            })) || [],
            paymentHistory: payHistoryData?.map((h: any) => ({
                id: h.id,
                orderId: h.order_id,
                transactionType: h.transaction_type,
                amount: Number(h.amount),
                pgTid: h.pg_tid,
                status: h.status,
                reason: h.reason,
                method: h.method,
                createdAt: h.created_at
            })) || [],
            orderHistory: historyData?.map((h: any) => ({
                id: h.id,
                orderId: h.order_id,
                beforeStatus: h.before_status,
                afterStatus: h.after_status,
                actionTitle: h.action_title,
                actionDescription: h.action_description,
                adminId: h.admin_id,
                createdAt: h.created_at
            })) || [],
            claimInfo: orderData.claim_type ? {
                type: orderData.claim_type,
                reason: orderData.claim_reason,
                requestedAt: orderData.claim_requested_at,
                processedAt: orderData.claim_processed_at,
                rejectedReason: orderData.claim_rejected_reason,
                returnTrackingNumber: orderData.return_tracking_number,
                exchangeTrackingNumber: orderData.exchange_tracking_number
            } : undefined
        };
    },
    async registerLogenInvoice(order: any, boxCount: number = 1, overrideAddress?: {
        recipient?: string;
        phone: string;
        zipCode: string;
        address: string;
        addressDetail?: string;
    }) {
        // 로젠택배 테스트 연동업체코드 및 거래처코드 사용
        const userId = "10358007";
        const custCd = "20179999";
        const rcvBranCd = "244"; // 테스트 배송점코드
        const fareTy = "030"; // 신용 처리

        const today = new Date();
        const takeDt = today.toISOString().slice(0, 10).replace(/-/g, '');

        const payloadData = [];
        const fallbackSlipNos = [];

        // 요청한 박스 수(boxCount)만큼 payload data 배열 생성
        for (let i = 0; i < boxCount; i++) {
            const randomSuffix = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
            const slipNo = `9${randomSuffix}`;
            fallbackSlipNos.push(slipNo);

            payloadData.push({
                printYn: "Y",
                slipNo,
                slipTy: "100",
                custCd,
                sndCustNm: "제이시스메디칼",
                sndTelNo: "02-1234-5678",
                sndCustAddr1: "서울 강남구 테헤란로 123",
                sndCustAddr2: "제이시스타워",
                rcvCustNm: overrideAddress?.recipient || order.customerName || order.user?.name || "고객명",
                rcvTelNo: overrideAddress?.phone || order.shippingInfo?.phone || order.user?.phone || "010-0000-0000",
                rcvZipCd: overrideAddress?.zipCode || order.shippingInfo?.zipCode || order.user?.zip_code || "06236",
                rcvCustAddr1: overrideAddress?.address || order.shippingInfo?.address || order.user?.address || "수하인 주소",
                rcvCustAddr2: overrideAddress?.addressDetail || order.shippingInfo?.addressDetail || order.user?.address_detail || "",
                fareTy,
                qty: 1, // 각 박스의 단위
                rcvBranCd,
                goodsNm: order.orderItems && order.orderItems.length > 0
                    ? `${order.orderItems[0].productName} 외 ${order.orderItems.length - 1}건 (박스 ${i + 1}/${boxCount})`
                    : `의료기기 소모품 (박스 ${i + 1}/${boxCount})`,
                dlvFare: 3000,
                extraFare: 0,
                goodsAmt: 0,
                takeDt
            });
        }

        const payload = {
            userId,
            data: payloadData
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃 제한

        try {
            // vite.config.ts에 설정된 프록시(/logenApi)를 통해 실제 서버로 요청
            // 로컬 환경에서는 프록시, 운영 환경에서는 다른 방식을 사용해야 합니다.
            const response = await fetch('/logenApi/edi/slipPrintM', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn("Logen API Fetch Error:", response.statusText);
                return fallbackSlipNos.join(", ");
            }

            const data = await response.json();
            console.log("Logen API Response:", data);

            // 로젠 API 성공 응답 파싱. 단일 혹은 복수 처리를 대응
            if (data.data) {
                if (Array.isArray(data.data)) {
                    // 다중 응답인 경우 (문서에 따라 배열일 가능성 고려)
                    const returnedSlips = data.data.map((row: any) => row.slipNo).filter(Boolean);
                    if (returnedSlips.length > 0) return returnedSlips.join(", ");
                } else if (data.data.slipNo) {
                    return data.data.slipNo;
                }
            }

            return fallbackSlipNos.join(", ");
        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.warn("Logen API 10초 초과 타임아웃 발생 -> 임시 송장 생성");
            } else {
                console.error("Logen API Integration Failed:", e);
            }
            return fallbackSlipNos.join(", ");
        }
    },

    /** 주문 고객의 배송지 목록 조회 (어드민용) */
    async getOrderShippingAddresses(userId: string) {
        const { data, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            label: row.label,
            recipient: row.recipient,
            phone: row.phone,
            zipCode: row.zip_code,
            address: row.address,
            addressDetail: row.address_detail || '',
            isDefault: row.is_default,
            createdAt: row.created_at,
        }));
    },

    async updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
        const updateData: any = { status };
        if (trackingNumber) {
            updateData.tracking_number = trackingNumber;
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) throw error;

        // 히스토리 기록
        await this.logOrderHistory(orderId, status,
            status === 'paid' ? '입금 확인' :
                status === 'shipped' ? '배송 시작' :
                    status === 'delivered' ? '배송 완료' :
                        status === 'cancelled' ? '주문 취소' : '상태 변경',
            trackingNumber ? `송장번호: ${trackingNumber}` : undefined
        );
    },

    // 히스토리 기록 헬퍼
    async logOrderHistory(orderId: string, afterStatus: string, title: string, description?: string) {
        try {
            // 현재 상태 가져오기 (before_status 기록용)
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

    // 부분 발송 처리
    async partialShipOrder(params: {
        deliveryHistory?: DeliveryHistory[];
        paymentHistory?: PaymentHistory[];
        orderId: string;
        trackingNumber: string;
        userId?: string;
        orderNumber?: string;
        items: {
            orderItemId: string;
            productId: string;
            shipQty: number;
            shippedSelectedIndices?: number[];
        }[];
        bonusItems?: { productId: string; productName: string; quantity: number }[];
        shippingInfo?: { recipient?: string; phone?: string; zipCode?: string; address?: string; addressDetail?: string };
    }) {
        const { orderId, trackingNumber, userId, orderNumber, items, bonusItems = [], shippingInfo } = params;

        // 1. shipments 레코드 생성
        const isPartial = true; // 이 함수는 항상 부분발송 처리
        const { data: shipment, error: shipErr } = await supabase
            .from('shipments')
            .insert({
                order_id: orderId,
                tracking_number: trackingNumber,
                is_partial: isPartial,
                shipped_at: new Date().toISOString(),
                bonus_items: bonusItems,
                shipping_info: shippingInfo || null
            })
            .select('id')
            .single();

        if (shipErr) throw shipErr;

        // 2. shipment_items 생성 + order_items 업데이트 + 재고 차감
        for (const item of items) {
            // shipment_items INSERT
            await supabase.from('shipment_items').insert({
                shipment_id: shipment.id,
                order_item_id: item.orderItemId,
                product_id: item.productId,
                shipped_quantity: item.shipQty,
                shipped_selected_indices: item.shippedSelectedIndices || []
            });

            // order_items 정보 가져오기
            const { data: currentItem } = await supabase
                .from('order_items')
                .select('shipped_quantity, quantity, selected_product_ids, shipped_selected_indices')
                .eq('id', item.orderItemId)
                .single();

            // 3a. 전체 수량 업데이트
            const newShippedQty = (currentItem?.shipped_quantity || 0) + item.shipQty;

            // 3b. 번들 세부 인덱스 업데이트
            let newIndices = currentItem?.shipped_selected_indices || [];
            if (item.shippedSelectedIndices && item.shippedSelectedIndices.length > 0) {
                newIndices = [...newIndices, ...item.shippedSelectedIndices];
            }

            await supabase
                .from('order_items')
                .update({
                    shipped_quantity: newShippedQty,
                    shipped_selected_indices: newIndices
                })
                .eq('id', item.orderItemId);

            // products.stock 재고 차감
            const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.productId)
                .single();

            if (product && product.stock !== null) {
                await supabase
                    .from('products')
                    .update({ stock: Math.max(0, product.stock - item.shipQty) })
                    .eq('id', item.productId);
            }
        }

        // 3. 전체 발송 완료 여부 판단 → 주문 상태 업데이트
        const { data: allItems } = await supabase
            .from('order_items')
            .select('quantity, shipped_quantity, selected_product_ids')
            .eq('order_id', orderId);

        const allShipped = allItems?.every(i => {
            const isBundle = i.selected_product_ids && i.selected_product_ids.length > 0;
            const targetQty = isBundle ? i.quantity * i.selected_product_ids.length : i.quantity;
            return (i.shipped_quantity || 0) >= targetQty;
        });
        const newStatus = allShipped ? 'shipped' : 'partially_shipped';

        // 이번 배송 이력의 is_partial 상태 업데이트 (전체 발급인 경우 false로)
        if (allShipped && shipment.id) {
            await supabase
                .from('shipments')
                .update({ is_partial: false })
                .eq('id', shipment.id);
        }

        const { data: updatedRows, error: orderUpdateError } = await supabase
            .from('orders')
            .update({
                status: newStatus,
                tracking_number: trackingNumber,
                ...(allShipped ? { shipped_at: new Date().toISOString() } : {})
            })
            .eq('id', orderId)
            .select('id, status');

        if (orderUpdateError) {
            console.error('[partialShipOrder] orders 상태 업데이트 실패 (에러):', orderUpdateError);
            throw new Error(`주문 상태 업데이트 실패: ${orderUpdateError.message}`);
        }

        // 실제로 업데이트된 행이 있는지 확인
        if (!updatedRows || updatedRows.length === 0) {
            console.error('[partialShipOrder] ⚠️ orderId와 매칭되는 행 없음 - RLS 정책 또는 잘못된 ID:', orderId);
            throw new Error('주문 상태 업데이트 실패: 해당 주문을 찾을 수 없거나 권한이 없습니다.');
        }

        console.log('[partialShipOrder] orders 상태 업데이트 성공:', newStatus, '/ 업데이트된 row:', updatedRows[0]);

        // 히스토리 기록
        await this.logOrderHistory(orderId, newStatus,
            allShipped ? '전체 배송 시작' : '부분 배송 시작',
            `송장번호: ${trackingNumber} / 대상 품목: ${items.length}종`
        );

        return { status: newStatus };
    },

    // 발송 취소 로직
    async cancelShipment(shipmentId: string, orderId: string) {
        // 1. 발송 아이템 조회 및 수량 복구
        const { data: items } = await supabase
            .from('shipment_items')
            .select('*')
            .eq('shipment_id', shipmentId);

        if (items && items.length > 0) {
            for (const item of items) {
                // order_items 수량 및 인덱스 복구
                const { data: orderItem } = await supabase
                    .from('order_items')
                    .select('shipped_quantity, shipped_selected_indices')
                    .eq('id', item.order_item_id)
                    .single();

                if (orderItem) {
                    const currentIndices = orderItem.shipped_selected_indices || [];
                    const cancelledIndices = item.shipped_selected_indices || [];
                    // 취소된 인덱스들을 제외한 나머지로 업데이트
                    const restoredIndices = currentIndices.filter((idx: number) => !cancelledIndices.includes(idx));

                    await supabase
                        .from('order_items')
                        .update({
                            shipped_quantity: Math.max(0, (orderItem.shipped_quantity || 0) - item.shipped_quantity),
                            shipped_selected_indices: restoredIndices
                        })
                        .eq('id', item.order_item_id);
                }

                // products.stock 복구
                if (item.product_id) {
                    const { data: product } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', item.product_id)
                        .single();

                    if (product && product.stock !== null) {
                        await supabase
                            .from('products')
                            .update({ stock: product.stock + item.shipped_quantity })
                            .eq('id', item.product_id);
                    }
                }
            }
        }

        // 2. 발송 이력 삭제 (DB 외래키 CASCADE 설정되어 있으면 아이템도 삭제됨)
        await supabase.from('shipments').delete().eq('id', shipmentId);

        // 3. 남은 발송 건 확인 및 주문 상태 롤백
        const { count } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', orderId);

        if (count === 0) {
            // 발송이 아예 없으면 결제완료 상태로 복구
            await supabase.from('orders').update({ status: 'paid', tracking_number: null }).eq('id', orderId);
        } else {
            // 남은 발송 건이 있으면 가장 최근 발송건 기준으로 송장번호 업데이트
            const { data: latestShipment } = await supabase
                .from('shipments')
                .select('tracking_number')
                .eq('order_id', orderId)
                .order('shipped_at', { ascending: false })
                .limit(1)
                .single();
            if (latestShipment) {
                await supabase.from('orders').update({ tracking_number: latestShipment.tracking_number, status: 'partially_shipped' }).eq('id', orderId);
            }
        }

        // 히스토리 기록
        await this.logOrderHistory(orderId, 'paid', '배송 취소', `배송건(ID: ${shipmentId.slice(0, 8)})이 취소되어 상태가 롤백되었습니다.`);
    },

    // Users
    async getUsers() {
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) {
            console.error('Supabase getUsers error:', usersError);
            throw usersError;
        }

        // Fetch cumulative sales for all users
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('user_id, total_amount')
            .neq('status', 'cancelled');

        if (ordersError) throw ordersError;

        // Group sales by user_id
        const salesMap = orders.reduce((acc: any, order) => {
            acc[order.user_id] = (acc[order.user_id] || 0) + Number(order.total_amount);
            return acc;
        }, {});

        // Fetch order counts
        const { data: orderCounts, error: countError } = await supabase
            .from('orders')
            .select('user_id');

        if (countError) throw countError;

        const countMap = orderCounts.reduce((acc: any, order) => {
            acc[order.user_id] = (acc[order.user_id] || 0) + 1;
            return acc;
        }, {});

        const result = users.map((user: any) => {
            const totalSales = salesMap[user.id] || 0;

            // Grading Logic
            let grade: 'VIP' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
            if (totalSales >= 50000000) grade = 'VIP';
            else if (totalSales >= 30000000) grade = 'Gold';
            else if (totalSales >= 10000000) grade = 'Silver';

            return {
                id: user.id,
                userId: user.email,
                name: user.name,
                email: user.email,
                hospitalName: user.hospital_name,
                businessNumber: user.business_number,
                grade: grade as 'VIP' | 'Gold' | 'Silver' | 'Bronze',
                status: (user.approval_status === 'APPROVED' ? 'active' : (user.approval_status === 'PENDING' ? 'pending' : 'suspended')) as 'active' | 'pending' | 'suspended',
                joinDate: new Date(user.created_at).toISOString().split('T')[0],
                totalOrders: countMap[user.id] || 0,
                totalSales: totalSales,
                phone: user.phone,
                mobile: user.mobile,
                address: user.address,
                addressDetail: user.address_detail,
                zipCode: user.zip_code,
                role: user.role,
                region: user.region,
                hospitalEmail: user.hospital_email,
                taxEmail: user.tax_email,
                memberType: user.member_type || null
            };
        });

        return result;
    },

    // ── 회원 분류 타입 관련 ──────────────────────────────────────
    async getMemberTypes() {
        const { data, error } = await supabase
            .from('member_types')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createMemberType(name: string, color: string = '#6B7280') {
        const { data: existing } = await supabase
            .from('member_types')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();
        const nextOrder = ((existing as any)?.sort_order || 0) + 1;
        const { data, error } = await supabase
            .from('member_types')
            .insert({ name, color, sort_order: nextOrder })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteMemberType(id: string) {
        // 해당 타입을 사용하는 users를 NULL로 초기화
        await supabase.from('users').update({ member_type: null }).eq('member_type', id);
        const { error } = await supabase.from('member_types').delete().eq('id', id);
        if (error) throw error;
    },

    async updateUserMemberType(userId: string, memberType: string | null) {
        const { error } = await supabase
            .from('users')
            .update({ member_type: memberType })
            .eq('id', userId);
        if (error) throw error;
    },
    // ──────────────────────────────────────────────────────────────

    async getUserEquipments(userId: string) {
        const { data, error } = await supabase
            .from('user_equipments')
            .select(`
                *,
                equipment:equipments(model_name, category, image_url)
            `)
            .eq('user_id', userId);

        if (error) throw error;

        return data.map((ue: any) => ({
            id: ue.id,
            name: ue.equipment?.model_name || 'Unknown',
            serialNumber: ue.serial_number,
            installDate: ue.install_date,
            warrantyEndDate: ue.warranty_end_date,
            imageUrl: ue.equipment?.image_url
        }));
    },

    async processClaim(orderId: string, action: 'APPROVE' | 'REJECT', params: {
        claimType: 'CANCEL' | 'RETURN' | 'EXCHANGE',
        reason?: string,
        refundAmount?: number
    }) {
        const { claimType, reason, refundAmount } = params;
        let newStatus = '';

        if (action === 'APPROVE') {
            switch (claimType) {
                case 'CANCEL': newStatus = 'cancelled'; break;
                case 'RETURN': newStatus = 'returned'; break;
                case 'EXCHANGE': newStatus = 'shipped'; break; // 교환 출고 시 다시 배송중으로
            }
        } else {
            // 거절 시 이전 상태로 복구? 여기서는 단순하게 다시 이전 상태로 돌리는 로직이 필요할 수 있으나
            // 우선은 현재 상태 유지하며 거절 사유만 기록
            const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();
            newStatus = currentOrder?.status || 'paid';
        }

        const updateData: any = {
            status: newStatus,
            claim_processed_at: new Date().toISOString()
        };

        if (action === 'REJECT') {
            updateData.claim_rejected_reason = reason;
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) throw error;

        // 히스토리 기록
        await this.logOrderHistory(orderId, newStatus,
            action === 'APPROVE' ? `클레임 승인 (${claimType})` : `클레임 거절 (${claimType})`,
            action === 'REJECT' ? `거절 사유: ${reason}` : `상태가 ${newStatus}로 처리되었습니다.`
        );

        // 반품 완료(returned) 시 재고 환원 로직
        if (action === 'APPROVE' && claimType === 'RETURN') {
            const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', orderId);
            if (items) {
                for (const item of items) {
                    if (item.product_id) {
                        const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                        if (product && product.stock !== null) {
                            await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
                        }
                    }
                }
            }
        }
    },

    async requestClaim(orderId: string, params: {
        type: 'CANCEL' | 'RETURN' | 'EXCHANGE',
        reason: string
    }) {
        const { type, reason } = params;
        let status = '';
        switch (type) {
            case 'CANCEL': status = 'cancel_requested'; break;
            case 'RETURN': status = 'return_requested'; break;
            case 'EXCHANGE': status = 'exchange_requested'; break;
        }

        const { error } = await supabase
            .from('orders')
            .update({
                status,
                claim_type: type,
                claim_reason: reason,
                claim_requested_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;

        // 히스토리 기록
        await this.logOrderHistory(orderId, status, `클레임 요청 (${type})`, `사유: ${reason}`);
    },

    async updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
        const { error } = await supabase
            .from('users')
            .update({ approval_status: status })
            .eq('id', userId);

        if (error) throw error;
    }
};
