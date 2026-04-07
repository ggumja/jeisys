import { supabase } from '../lib/supabaseClient';

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
            orderDate: new Date(order.ordered_at).toISOString().split('T')[0],
            totalAmount: Number(order.total_amount),
            status: order.status,
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
                product:products(name, category, image_url, sku, stock)
            `)
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('Error fetching order items:', itemsError);
        }

        const { data: shipmentsData, error: shipmentsError } = await supabase
            .from('shipments')
            .select(`
                *,
                items:shipment_items(
                    quantity:shipped_quantity,
                    product:products(name)
                )
            `)
            .eq('order_id', orderId)
            .order('shipped_at', { ascending: false });

        if (shipmentsError) {
            console.error('Error fetching shipments:', shipmentsError);
        }

        return {
            id: orderData.id,
            orderNumber: orderData.order_number,
            customerName: orderData.user?.name || 'Unknown',
            hospitalName: orderData.user?.hospital_name || '',
            orderDate: new Date(orderData.ordered_at).toISOString().split('T')[0],
            totalAmount: Number(orderData.total_amount),
            status: orderData.status as 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'partially_shipped',
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
                sku: item.product?.sku
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
                method: orderData.payment_method
            },
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
                    quantity: item.quantity
                })) || []
            })) || []
        };
    },
    async registerLogenInvoice(order: any, boxCount: number = 1) {
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
                rcvCustNm: order.customerName || order.user?.name || "고객명",
                rcvTelNo: order.shippingInfo?.phone || order.user?.phone || "010-0000-0000",
                rcvZipCd: order.shippingInfo?.zipCode || order.user?.zip_code || "06236",
                rcvCustAddr1: order.shippingInfo?.address || order.user?.address || "수하인 주소",
                rcvCustAddr2: order.shippingInfo?.addressDetail || order.user?.address_detail || "",
                fareTy,
                qty: 1, // 각 박스의 단위
                rcvBranCd,
                goodsNm: order.orderItems && order.orderItems.length > 0 
                  ? `${order.orderItems[0].productName} 외 ${order.orderItems.length - 1}건 (박스 ${i+1}/${boxCount})` 
                  : `의료기기 소모품 (박스 ${i+1}/${boxCount})`,
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
    },

    // 부분 발송 처리
    async partialShipOrder(params: {
        orderId: string;
        trackingNumber: string;
        userId?: string;
        orderNumber?: string;
        items: { orderItemId: string; productId: string; shipQty: number }[];
    }) {
        const { orderId, trackingNumber, userId, orderNumber, items } = params;

        // 1. shipments 레코드 생성
        const isPartial = true; // 이 함수는 항상 부분발송 처리
        const { data: shipment, error: shipErr } = await supabase
            .from('shipments')
            .insert({
                order_id: orderId,
                tracking_number: trackingNumber,
                is_partial: isPartial,
                shipped_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (shipErr) throw shipErr;

        // 2. shipment_items 생성 + order_items.shipped_quantity 업데이트 + 재고 차감
        for (const item of items) {
            // shipment_items INSERT
            await supabase.from('shipment_items').insert({
                shipment_id: shipment.id,
                order_item_id: item.orderItemId,
                product_id: item.productId,
                shipped_quantity: item.shipQty
            });

            // order_items shipped_quantity 업데이트 (RPC 없이 현재값 가져와서 더하기)
            const { data: currentItem } = await supabase
                .from('order_items')
                .select('shipped_quantity, quantity')
                .eq('id', item.orderItemId)
                .single();

            const newShipped = (currentItem?.shipped_quantity || 0) + item.shipQty;
            await supabase
                .from('order_items')
                .update({ shipped_quantity: newShipped })
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
            .select('quantity, shipped_quantity')
            .eq('order_id', orderId);

        const allShipped = allItems?.every(i => (i.shipped_quantity || 0) >= i.quantity);
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

        // 4. 고객 알림 생성
        if (userId) {
            const message = allShipped
                ? `주문번호 ${orderNumber}의 상품이 모두 발송되었습니다. 송장번호: ${trackingNumber}`
                : `주문번호 ${orderNumber}의 상품 일부가 발송되었습니다. 나머지 상품은 재입고 후 발송 예정입니다. 송장번호: ${trackingNumber}`;

            await supabase.from('notifications').insert({
                user_id: userId,
                order_id: orderId,
                type: allShipped ? 'shipped' : 'partial_shipped',
                title: allShipped ? '상품이 발송되었습니다' : '상품 일부가 발송되었습니다',
                message
            });
        }

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
                // order_items.shipped_quantity 차감
                const { data: orderItem } = await supabase
                    .from('order_items')
                    .select('shipped_quantity')
                    .eq('id', item.order_item_id)
                    .single();
                
                if (orderItem) {
                    await supabase
                        .from('order_items')
                        .update({ shipped_quantity: Math.max(0, (orderItem.shipped_quantity || 0) - item.shipped_quantity) })
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
                taxEmail: user.tax_email
            };
        });

        return result;
    },

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

    async updateUserStatus(userId: string, status: 'APPROVED' | 'REJECTED') {
        const { error } = await supabase
            .from('users')
            .update({ approval_status: status })
            .eq('id', userId);

        if (error) throw error;
    }
};
