import { supabase } from '../lib/supabaseClient';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super' | 'manager' | 'staff';
  permissions: string[];
  createdDate: string;
  lastLogin: string;
}

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

        // 1. Sales & Orders (This Month, excluding cancelled)
        const { data: monthOrders, error: monthError } = await supabase
            .from('orders')
            .select('total_amount, id')
            .gte('ordered_at', startOfMonth)
            .neq('status', 'cancelled');

        if (monthError) throw monthError;

        const monthSales = monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const monthOrderCount = monthOrders.length;

        // 1-1. Monthly Sales Trend (Last 6 Months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('ordered_at, total_amount')
            .gte('ordered_at', sixMonthsAgo.toISOString())
            .neq('status', 'cancelled');
        
        const monthlySalesMap: Record<string, { sales: number, orders: number }> = {};
        // Initialize the last 6 months in order
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthlySalesMap[`${d.getMonth() + 1}월`] = { sales: 0, orders: 0 };
        }
        
        (recentOrders || []).forEach(order => {
            const date = new Date(order.ordered_at);
            const monthStr = `${date.getMonth() + 1}월`;
            if (monthlySalesMap[monthStr]) {
                monthlySalesMap[monthStr].sales += Number(order.total_amount);
                monthlySalesMap[monthStr].orders += 1;
            }
        });
        
        const salesData = Object.entries(monthlySalesMap).map(([month, data]) => ({
            month,
            sales: data.sales,
            orders: data.orders
        }));

        // 1-2. Category Data & Best Products (This Month)
        let categoryData: { name: string; value: number; color: string }[] = [];
        let bestProducts: { name: string; sales: number; revenue: number }[] = [];
        
        if (monthOrders.length > 0) {
            const orderIds = monthOrders.map(o => o.id);
            const chunkSize = 100;
            let allItems: any[] = [];
            
            for (let i = 0; i < orderIds.length; i += chunkSize) {
                const chunk = orderIds.slice(i, i + chunkSize);
                const { data: itemsChunk } = await supabase
                    .from('order_items')
                    .select('quantity, unit_price, product:products(name, category)')
                    .in('order_id', chunk);
                if (itemsChunk) allItems = [...allItems, ...itemsChunk];
            }
            
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];
            const catMap: Record<string, number> = {};
            const prodMap: Record<string, { sales: number, revenue: number }> = {};
            
            allItems.forEach(item => {
                const category = item.product?.category || '기타소모품';
                const name = item.product?.name || 'Unknown Product';
                const qty = Number(item.quantity);
                const revenue = qty * Number(item.unit_price);
                
                catMap[category] = (catMap[category] || 0) + revenue;
                
                if (!prodMap[name]) prodMap[name] = { sales: 0, revenue: 0 };
                prodMap[name].sales += qty;
                prodMap[name].revenue += revenue;
            });
            
            // Calculate percentage for categories
            const totalRevenue = Object.values(catMap).reduce((a, b) => a + b, 0);
            categoryData = Object.entries(catMap)
                .sort((a, b) => b[1] - a[1]) // sort by revenue desc
                .map(([name, value], index) => ({
                    name,
                    value: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0,
                    color: colors[index % colors.length]
                }));
                
            bestProducts = Object.entries(prodMap)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);
        }

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
            gradeStats,
            salesData,
            categoryData,
            bestProducts
        };
    },
    
    // getDashboardComprehensiveStats (Dashboard High-Level stats with date range)
    async getDashboardComprehensiveStats(filters: {
        dateRange: string;
    }) {
        const { dateRange } = filters;
        
        // 1. Determine Date Range
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        let isCumulative = false;
        
        if (dateRange && dateRange.startsWith('custom:')) {
            const [_, rangeStr] = dateRange.split(':');
            const [startStr, endStr] = rangeStr.split('_');
            startDate = new Date(startStr);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(endStr);
            endDate.setHours(23, 59, 59, 999);
        } else if (dateRange === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (dateRange === 'cumulative') {
            isCumulative = true;
        } else {
            // Default: 'month' (당월)
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const validStatuses = ['paid', 'processing', 'shipped', 'delivered'];

        // 2. Fetch Users to mapping region and signup stats
        const { data: usersData, error: userErr } = await supabase
            .from('users')
            .select('id, name, hospital_name, address, created_at');
        if (userErr) throw userErr;

        const usersMap = (usersData || []).reduce((acc: any, u) => {
            acc[u.id] = {
                name: u.name,
                hospitalName: u.hospital_name || '일반고객',
                address: u.address || '',
                region: u.address ? u.address.trim().split(/\s+/)[0] : '미등록',
                createdAt: new Date(u.created_at)
            };
            return acc;
        }, {});

        // 3. Filter orders and order_items
        let ordersQuery = supabase
            .from('orders')
            .select(`
                id,
                total_amount,
                payment_method,
                ordered_at,
                user_id,
                status,
                order_items (
                    id,
                    product_id,
                    quantity,
                    unit_price,
                    total_price
                )
            `)
            .in('status', validStatuses);
            
        if (!isCumulative) {
            ordersQuery = ordersQuery
                .gte('ordered_at', startDate.toISOString())
                .lte('ordered_at', endDate.toISOString());
        }

        const { data: rawOrders, error: ordersErr } = await ordersQuery;
        if (ordersErr) throw ordersErr;

        const filteredOrders = (rawOrders || []).map((order: any) => {
            const items = order.order_items || [];
            const orderTotalAmount = items.reduce((sum: number, item: any) => sum + Number(item.total_price || (item.unit_price * item.quantity)), 0);
            return {
                ...order,
                order_items: items,
                computed_total: orderTotalAmount
            };
        }).filter(o => o.order_items.length > 0);

        // A. 누적 매출 & 선택 기간 매출
        const periodSales = filteredOrders.reduce((sum, o) => sum + o.computed_total, 0);

        // B. 결제수단별 매출 & 비중
        const methodMapping: Record<string, string> = {
            'virtual': '가상계좌',
            'transfer': '무통장입금',
            'credit': '신용카드(저장)',
            'general': '일반결제(신용카드)',
            'split': '카드분할결제',
            'partial_card': '카드일부결제'
        };
        const paymentMap: Record<string, number> = {};
        filteredOrders.forEach(o => {
            const rawMethod = o.payment_method || 'transfer';
            const method = methodMapping[rawMethod] || rawMethod;
            paymentMap[method] = (paymentMap[method] || 0) + o.computed_total;
        });
        const paymentData = Object.entries(paymentMap).map(([name, value]) => ({
            name,
            value,
            percentage: periodSales > 0 ? Number(((value / periodSales) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.value - a.value);

        // C. 카테고리 요약 지표 (최상단 설정 기간/장비에 따라)
        // 누적 구매 회원수 (중복 제거)
        const uniqueBuyingUsers = new Set(filteredOrders.map(o => o.user_id).filter(Boolean));
        const buyingUsersCount = uniqueBuyingUsers.size;
        
        // 거래처(회원)당 평균 매출 금액 = 기간 매출 / 누적 구매 회원수
        const avgSalesPerCustomer = buyingUsersCount > 0 ? Math.round(periodSales / buyingUsersCount) : 0;
        
        // 주문 건당 평균 매출 금액 = 기간 매출 / 총 주문 건수
        const avgSalesPerOrder = filteredOrders.length > 0 ? Math.round(periodSales / filteredOrders.length) : 0;

        // D. 카테고리별 매출 비율 (도넛 차트용)
        const productIdsInOrders = Array.from(new Set(
            filteredOrders.flatMap(o => o.order_items.map((i: any) => i.product_id))
        )).filter(Boolean);

        let categoryData: { name: string; value: number; color: string }[] = [];
        let bestProducts: { name: string; sales: number; revenue: number }[] = [];
        
        if (productIdsInOrders.length > 0) {
            const { data: prodData, error: prodErr } = await supabase
                .from('products')
                .select('id, name, category')
                .in('id', productIdsInOrders);
            
            if (prodErr) throw prodErr;

            const productCategoryMap = (prodData || []).reduce((acc: any, p) => {
                acc[p.id] = { name: p.name, category: p.category || '기타소모품' };
                return acc;
            }, {});

            const catSalesMap: Record<string, number> = {};
            const prodAggregateMap: Record<string, { sales: number; revenue: number }> = {};

            filteredOrders.forEach(o => {
                o.order_items.forEach((item: any) => {
                    const pInfo = productCategoryMap[item.product_id] || { name: '알수없음', category: '기타소모품' };
                    const rev = Number(item.total_price || (item.unit_price * item.quantity));
                    const qty = Number(item.quantity);

                    catSalesMap[pInfo.category] = (catSalesMap[pInfo.category] || 0) + rev;

                    if (!prodAggregateMap[pInfo.name]) {
                        prodAggregateMap[pInfo.name] = { sales: 0, revenue: 0 };
                    }
                    prodAggregateMap[pInfo.name].sales += qty;
                    prodAggregateMap[pInfo.name].revenue += rev;
                });
            });

            const colors = ['#21358D', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f43f5e'];
            categoryData = Object.entries(catSalesMap)
                .sort((a, b) => b[1] - a[1])
                .map(([name, value], idx) => ({
                    name,
                    value: periodSales > 0 ? Number(((value / periodSales) * 100).toFixed(1)) : 0,
                    color: colors[idx % colors.length]
                }));

            bestProducts = Object.entries(prodAggregateMap)
                .map(([name, d]) => ({ name, sales: d.sales, revenue: d.revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);
        }

        // E. TOP 구매 거래처 (선택값 카테고리 필터 포함)
        const customerSales: Record<string, number> = {};
        filteredOrders.forEach(o => {
            const uId = o.user_id;
            if (uId) {
                customerSales[uId] = (customerSales[uId] || 0) + o.computed_total;
            }
        });
        const topCustomers = Object.entries(customerSales)
            .map(([uId, totalSales]) => {
                const uInfo = usersMap[uId] || { name: '비회원', hospitalName: '-' };
                return {
                    name: uInfo.name,
                    hospitalName: uInfo.hospitalName,
                    totalSales
                };
            })
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 10);

        // F. 지역별 매출 (병원 주소 파싱)
        const regionSalesMap: Record<string, number> = {};
        filteredOrders.forEach(o => {
            const uId = o.user_id;
            const uInfo = usersMap[uId] || { region: '미등록' };
            const region = uInfo.region;
            regionSalesMap[region] = (regionSalesMap[region] || 0) + o.computed_total;
        });
        const regionSales = Object.entries(regionSalesMap)
            .map(([region, sales]) => ({
                region,
                sales,
                percentage: periodSales > 0 ? Number(((sales / periodSales) * 100).toFixed(1)) : 0
            }))
            .sort((a, b) => b.sales - a.sales);

        // G. 신규 회원 수 (선택 기간 내 가입)
        const newUsersCount = (usersData || []).filter(u => {
            const cDate = new Date(u.created_at);
            if (isCumulative) return true;
            return cDate >= startDate && cDate <= endDate;
        }).length;

        // H. 매출 추이 그래프용 데이터 (그룹화)
        const trendDataMap: Record<string, number> = {};
        filteredOrders.forEach(o => {
            const date = new Date(o.ordered_at);
            const key = `${date.getMonth() + 1}/${date.getDate()}`; // default: 일 단위
            trendDataMap[key] = (trendDataMap[key] || 0) + o.computed_total;
        });
        const trendData = Object.entries(trendDataMap).map(([label, sales]) => ({
            label,
            sales
        }));

        return {
            periodSales,
            newUsersCount,
            avgSalesPerCustomer,
            avgSalesPerOrder,
            buyingUsersCount,
            paymentData,
            categoryData,
            bestProducts,
            topCustomers,
            regionSales,
            trendData
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
            paymentMethod: order.payment_method === 'virtual' ? '가상계좌' :
                order.payment_method === 'transfer' ? '무통장입금' :
                order.payment_method === 'credit' ? '신용카드(저장)' :
                order.payment_method === 'general' ? '일반결제(신용카드)' :
                order.payment_method === 'split' ? '카드분할결제' :
                order.payment_method === 'partial_card' ? '카드일부결제' :
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
                method: order.payment_method === 'virtual' ? '가상계좌' :
                    order.payment_method === 'transfer' ? '무통장입금' :
                    order.payment_method === 'credit' ? '신용카드(저장)' :
                    order.payment_method === 'general' ? '일반결제(신용카드)' :
                    order.payment_method === 'split' ? '카드분할결제' :
                    order.payment_method === 'partial_card' ? '카드일부결제' :
                    order.payment_method
            },
            // Keep original dates for sorting if needed
            orderedAt: order.ordered_at,
            vactName: order.vact_name
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
                    product:products(name),
                    shipped_selected_indices
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

        // 5. 포인트 및 크레딧 사용 내역 조회
        const { data: pointData } = await supabase.from('point_transactions').select('amount').eq('order_id', orderId).eq('type', 'use');
        const pointsUsed = pointData?.reduce((sum, row) => sum + Math.abs(row.amount), 0) || orderData.points_used || 0;

        const { data: creditData } = await supabase.from('credit_transactions').select('amount').eq('order_id', orderId).eq('type', 'use');
        const creditsUsed = creditData?.reduce((sum, row) => sum + Math.abs(row.amount), 0) || 0;

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
                method: orderData.payment_method === 'virtual' ? '가상계좌' :
                    orderData.payment_method === 'transfer' ? '무통장입금' :
                    orderData.payment_method === 'credit' ? '신용카드(저장)' :
                    orderData.payment_method === 'general' ? '일반결제(신용카드)' :
                    orderData.payment_method === 'split' ? '카드분할결제' :
                    orderData.payment_method === 'partial_card' ? '카드일부결제' :
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
                status: shipment.status || 'SHIPPED',
                shippingInfo: shipment.shipping_info || null,
                label: shipment.label || '',
                items: shipment.items?.map((item: any) => ({
                    productName: item.product?.name || 'Unknown',
                    productId: item.product_id,
                    quantity: item.quantity,
                    shippedSelectedIndices: item.shipped_selected_indices || [],
                    bonusItems: bonusItemsByProductId[item.product_id] || []
                })) || [],
                bonusItems: shipment.bonus_items || [],
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
            claimInfo: orderData.claim_info ? {
                type: orderData.claim_info.type,
                reason: orderData.claim_info.reason,
                requestedAt: orderData.claim_info.requested_at,
                processedAt: orderData.claim_info.processed_at,
                rejectedReason: orderData.claim_info.rejected_reason,
                returnTrackingNumber: orderData.claim_info.return_tracking_number,
                exchangeTrackingNumber: orderData.claim_info.exchange_tracking_number,
                refundBank: orderData.claim_info.refundBank,
                refundAccount: orderData.claim_info.refundAccount,
                refundHolder: orderData.claim_info.refundHolder
            } : undefined,
            pointsUsed,
            creditsUsed
        };
    },
    async registerLogenInvoice(order: any, boxCount: number = 1, overrideAddress?: {
        recipient?: string;
        phone: string;
        zipCode: string;
        address: string;
        addressDetail?: string;
    }) {
        const secretKey = import.meta.env.VITE_LOGEN_SECRET_KEY || "NwhVa2AZi4O1A-bpkiJZURqL3btC-LR8UjjjL_ET7_A";
        const userId = import.meta.env.VITE_LOGEN_USER_ID || "24457087";
        const custCd = import.meta.env.VITE_LOGEN_CUST_CD || "jeisysmall";
        
        let rcvBranCd = "244"; // 테스트 배송점코드
        let fareTy = "030"; // 신용 처리

        const today = new Date();
        const takeDt = today.toISOString().slice(0, 10).replace(/-/g, '');

        // 1. 거래처 계약 정보 조회 (contractTotalInfo)
        try {
            const contractResponse = await fetch('/logenApi/edi/contractTotalInfo', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "secretKey": secretKey
                },
                body: JSON.stringify({
                    userId,
                    data: [{ custCd }]
                })
            });

            if (contractResponse.ok) {
                const contractResult = await contractResponse.json();
                console.log("Logen contractTotalInfo Response:", contractResult);
                if (contractResult.sttsCd === "SUCCESS" && contractResult.data && contractResult.data.length > 0) {
                    const cInfo = contractResult.data[0];
                    if (cInfo.fareTy && cInfo.useYn === "Y") {
                        fareTy = cInfo.fareTy;
                    }
                }
            }
        } catch (err) {
            console.error("Failed to query Logen contractTotalInfo:", err);
        }

        // 2. 송장 출력정보 통합조회 (integratedInquiry)
        let printInfoResult: any = null;
        const targetAddress = overrideAddress?.address || order.shippingInfo?.address || order.user?.address || "";
        if (targetAddress) {
            try {
                const inquiryResponse = await fetch('/logenApi/edi/integratedInquiry', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "secretKey": secretKey
                    },
                    body: JSON.stringify({
                        userId,
                        data: [{
                            custCd,
                            addr: targetAddress
                        }]
                    })
                });

                if (inquiryResponse.ok) {
                    const inquiryResult = await inquiryResponse.json();
                    console.log("Logen integratedInquiry Response:", inquiryResult);
                    if (inquiryResult.sttsCd === "SUCCESS" && inquiryResult.data && inquiryResult.data.length > 0) {
                        printInfoResult = inquiryResult.data[0];
                        if (printInfoResult.branCd) {
                            rcvBranCd = printInfoResult.branCd;
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to query Logen integratedInquiry:", err);
            }
        }

        const slipNos: string[] = [];
        const fallbackSlipNos: string[] = [];

        // 임시 대비용 fallback 생성
        for (let i = 0; i < boxCount; i++) {
            const randomSuffix = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
            fallbackSlipNos.push(`9${randomSuffix}`);
        }

        // 3. 로젠 API(getSlipNo)를 통해 실시간 송장 채번 시도
        try {
            const slipNoResponse = await fetch('/logenApi/edi/getSlipNo', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "secretKey": secretKey
                },
                body: JSON.stringify({
                    userId,
                    data: [{ slipQty: boxCount }]
                })
            });

            if (slipNoResponse.ok) {
                const slipNoResult = await slipNoResponse.json();
                console.log("Logen getSlipNo Response:", slipNoResult);
                
                if (slipNoResult.sttsCd === "SUCCESS" && slipNoResult.data && slipNoResult.data.length > 0) {
                    slipNoResult.data.forEach((row: any) => {
                        if (row.slipNo) slipNos.push(row.slipNo);
                    });
                } else if (slipNoResult.startSlipNo && slipNoResult.closeSlipNo) {
                    const startNum = BigInt(slipNoResult.startSlipNo);
                    for (let i = 0; i < boxCount; i++) {
                        slipNos.push((startNum + BigInt(i)).toString());
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch real slip numbers from Logen:", err);
        }

        // 채번 실패 시 fallback 사용
        const finalSlipNos = slipNos.length === boxCount ? slipNos : fallbackSlipNos;

        const payloadData = [];
        for (let i = 0; i < boxCount; i++) {
            const slipNo = finalSlipNos[i];
            payloadData.push({
                printYn: "Y",
                slipNo,
                slipTy: "100",
                custCd,
                sndCustNm: "제이시스메디칼",
                sndTelNo: "02-3651-3300",
                sndCustAddr1: "서울 특별시 금천구 가산디지털1로 131",
                sndCustAddr2: "",
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
                takeDt,
                jejuAmt: printInfoResult?.jejuRegYn === "Y" ? 3000 : 0,
                shipFare: printInfoResult?.shipYn === "Y" ? 3000 : 0,
                montFare: printInfoResult?.montYn === "Y" ? 3000 : 0
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
            const response = await fetch('/logenApi/edi/slipPrintM', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "secretKey": secretKey
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn("Logen API Fetch Error:", response.statusText);
            } else {
                const data = await response.json();
                console.log("Logen API Response:", data);
            }
        } catch (e: any) {
            console.error("Logen API Integration Failed:", e);
        }

        return {
            trackingNumber: finalSlipNos.join(", "),
            classCd: printInfoResult?.classCd || "",
            salesNm: printInfoResult?.salesNm || "",
            tmlNm: printInfoResult?.tmlNm || "",
            branCd: printInfoResult?.branCd || "",
            jejuRegYn: printInfoResult?.jejuRegYn || "N",
            shipYn: printInfoResult?.shipYn || "N",
            montYn: printInfoResult?.montYn || "N"
        };
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

    /** 배송 번들(계획) 생성 */
    async createShippingBundle(params: {
        orderId: string;
        label?: string;
        shippingInfo: { recipient: string; phone: string; zipCode: string; address: string; addressDetail?: string };
        items: {
            orderItemId: string;
            productId: string;
            shipQty: number;
            shippedSelectedIndices?: number[];
        }[];
        bonusItems?: {
            productId: string;
            productName: string;
            quantity: number;
        }[];
    }) {
        const { orderId, label, shippingInfo, items, bonusItems } = params;

        // 1. shipments 레코드 생성 (PLANNED 상태)
        const { data: shipment, error: shipErr } = await supabase
            .from('shipments')
            .insert({
                order_id: orderId,
                status: 'PLANNED',
                label: label || '분할 배송 번들',
                shipping_info: shippingInfo,
                bonus_items: bonusItems || [],
                is_partial: true,
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (shipErr) throw shipErr;

        // 2. shipment_items 생성
        for (const item of items) {
            const { error: itemErr } = await supabase.from('shipment_items').insert({
                shipment_id: shipment.id,
                order_item_id: item.orderItemId,
                product_id: item.productId,
                shipped_quantity: item.shipQty,
                shipped_selected_indices: item.shippedSelectedIndices || []
            });
            if (itemErr) throw itemErr;
        }

        return shipment;
    },

    /** 기존 번들 기반 부분 발송 처리 (로젠 API 연동) */
    async shipBundle(shipmentId: string) {
        // 1. 번들 정보 및 주문 정보 로드
        const { data: shipment, error: shipErr } = await supabase
            .from('shipments')
            .select(`
                *,
                order:orders(
                    *,
                    user:users(name, phone)
                ),
                items:shipment_items(*)
            `)
            .eq('id', shipmentId)
            .single();

        if (shipErr || !shipment) throw new Error('번들 정보를 찾을 수 없습니다.');
        if (shipment.status === 'SHIPPED') throw new Error('이미 발송된 번들입니다.');

        // 2. 로젠 API 호출하여 송장 발급
        // registerLogenInvoice는 order 객체와 overrideAddress를 받음
        const orderForLogen = {
            customerName: shipment.shipping_info?.recipient || shipment.order?.user?.name,
            orderItems: shipment.items.map((i: any) => ({ productName: '의료기기 소모품' })), // 간략화
            shippingInfo: shipment.shipping_info
        };

        const logenResult = await this.registerLogenInvoice(orderForLogen, 1, shipment.shipping_info);
        const trackingNumber = typeof logenResult === 'string' ? logenResult : logenResult.trackingNumber;
        
        const updatedShippingInfo = {
            ...(shipment.shipping_info || {}),
            ...(typeof logenResult === 'object' ? {
                classCd: logenResult.classCd,
                salesNm: logenResult.salesNm,
                tmlNm: logenResult.tmlNm,
                branCd: logenResult.branCd,
                jejuRegYn: logenResult.jejuRegYn,
                shipYn: logenResult.shipYn,
                montYn: logenResult.montYn,
            } : {})
        };

        // 3. shipment 상태 업데이트
        const { error: updateShipErr } = await supabase
            .from('shipments')
            .update({
                tracking_number: trackingNumber,
                status: 'SHIPPED',
                shipped_at: new Date().toISOString(),
                shipping_info: updatedShippingInfo
            })
            .eq('id', shipmentId);

        if (updateShipErr) throw updateShipErr;

        // 4. order_items 수량 및 인덱스 업데이트
        for (const item of shipment.items) {
            const { data: currentItem } = await supabase
                .from('order_items')
                .select('shipped_quantity, shipped_selected_indices')
                .eq('id', item.order_item_id)
                .single();

            const newShippedQty = (currentItem?.shipped_quantity || 0) + item.shipped_quantity;
            let newIndices = currentItem?.shipped_selected_indices || [];
            if (item.shipped_selected_indices && item.shipped_selected_indices.length > 0) {
                newIndices = [...newIndices, ...item.shipped_selected_indices];
            }

            await supabase
                .from('order_items')
                .update({
                    shipped_quantity: newShippedQty,
                    shipped_selected_indices: newIndices
                })
                .eq('id', item.order_item_id);
            
            // 재고 차감
            if (item.product_id) {
                const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                if (product && product.stock !== null) {
                    await supabase.from('products').update({ stock: Math.max(0, product.stock - item.shipped_quantity) }).eq('id', item.product_id);
                }
            }
        }

        // 5. 전체 발송 여부 판단 및 주문 상태 업데이트
        const { data: allItems } = await supabase
            .from('order_items')
            .select('quantity, shipped_quantity, selected_product_ids')
            .eq('order_id', shipment.order_id);

        const allShipped = allItems?.every(i => {
            const isBundle = i.selected_product_ids && i.selected_product_ids.length > 0;
            const targetQty = isBundle ? i.quantity * i.selected_product_ids.length : i.quantity;
            return (i.shipped_quantity || 0) >= targetQty;
        });

        const newOrderStatus = allShipped ? 'shipped' : 'partially_shipped';
        await supabase.from('orders').update({
            status: newOrderStatus,
            tracking_number: trackingNumber, // 마지막 발급된 송장 저장
            ...(allShipped ? { shipped_at: new Date().toISOString() } : {})
        }).eq('id', shipment.order_id);

        // 히스토리 기록
        await this.logOrderHistory(shipment.order_id, newOrderStatus, 
            allShipped ? '전체 배송 시작 (번들)' : '부분 배송 시작 (번들)', 
            `송장번호: ${trackingNumber} / 번들: ${shipment.label}`
        );

        return { trackingNumber, status: newOrderStatus };
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
                memberType: user.member_type || null,
                approvedAt: user.approved_at || null,
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

    async updateMemberType(id: string, updates: Partial<{ name: string; color: string; partial_shipment: boolean }>) {
        const { data, error } = await supabase
            .from('member_types')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteMemberType(id: string) {
        // 1. 삭제할 타입의 이름을 가져옴
        const { data: typeToDelete } = await supabase.from('member_types').select('name').eq('id', id).single();
        if (!typeToDelete) return;

        const typeName = typeToDelete.name;

        // 2. 해당 타입을 포함하고 있는 사용자가 있는지 확인
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .like('member_type', `%${typeName}%`);

        if (countError) throw countError;

        if (count && count > 0) {
            // 사용 중인 회원이 있다면 에러 발생
            const error = new Error(`현재 '${typeName}' 분류를 사용 중인 회원이 ${count}명 있습니다. 먼저 해당 회원들의 분류를 수정한 후 삭제해주세요.`);
            (error as any).code = 'IN_USE';
            throw error;
        }

        // 3. 타입 삭제
        const { error } = await supabase.from('member_types').delete().eq('id', id);
        if (error) throw error;
    },

    async updateUser(userId: string, data: any) {
        console.log(`Updating member ${userId} with data:`, data);
        const { error } = await supabase.rpc('admin_update_user_fields', {
            p_user_id: userId,
            p_update_data: {
                name: data.name,
                hospital_name: data.hospitalName,
                business_number: data.businessNumber,
                phone: data.phone,
                mobile: data.mobile,
                zip_code: data.zipCode,
                address: data.address,
                address_detail: data.addressDetail,
                region: data.region,
                hospital_email: data.hospitalEmail,
                tax_email: data.taxEmail,
                role: data.role,
                member_type: data.memberType,
            }
        });

        if (error) {
            console.error('Update user error:', error);
            throw error;
        }
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

        const { data: currentOrder } = await supabase.from('orders').select('status, claim_info').eq('id', orderId).single();

        if (action === 'APPROVE') {
            switch (claimType) {
                case 'CANCEL': newStatus = 'cancelled'; break;
                case 'RETURN': newStatus = 'returned'; break;
                case 'EXCHANGE': newStatus = 'shipped'; break; // 교환 출고 시 다시 배송중으로
            }
        } else {
            // 거절 시 이전 상태로 복구하여 취소/교환/환불 리스트에서 사라지게 함
            const { data: historyData } = await supabase
                .from('order_status_history')
                .select('after_status')
                .eq('order_id', orderId)
                .neq('after_status', 'cancel_requested')
                .neq('after_status', 'return_requested')
                .neq('after_status', 'exchange_requested')
                .order('created_at', { ascending: false })
                .limit(1);

            if (historyData && historyData.length > 0 && historyData[0].after_status) {
                newStatus = historyData[0].after_status;
            } else {
                newStatus = 'paid'; // Fallback
            }
        }

        const updatedClaimInfo = {
            ...(currentOrder?.claim_info || {}),
            processed_at: new Date().toISOString()
        };

        if (action === 'REJECT') {
            updatedClaimInfo.rejected_reason = reason;
        }

        const updateData: any = {
            status: newStatus,
            claim_info: updatedClaimInfo
        };

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
        const { error } = await supabase.rpc('admin_set_user_approval', {
            p_user_id: userId,
            p_status: status   // DB ENUM은 대문자: APPROVED, PENDING, REJECTED
        });

        if (error) throw error;
    },

    /** 무통장입금 엑셀 일괄 매칭 확인 처리 */
    async bulkConfirmDeposits(orderIds: string[]) {
        if (!orderIds || orderIds.length === 0) return;

        // 1. 주문 상태 일괄 변경
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .in('id', orderIds);

        if (updateError) throw updateError;

        // 2. 각 주문에 대한 Payment History 및 Order History 추가
        for (const orderId of orderIds) {
            // 주문 정보 가져오기 (금액 확인용)
            const { data: orderData } = await supabase
                .from('orders')
                .select('total_amount, payment_method')
                .eq('id', orderId)
                .single();

            if (orderData) {
                // payment_history 추가
                await supabase.from('payment_history').insert({
                    order_id: orderId,
                    transaction_type: 'PAYMENT',
                    amount: orderData.total_amount,
                    status: 'SUCCESS',
                    method: orderData.payment_method,
                    reason: '무통장입금 엑셀 일괄 승인'
                });
            }

            // 히스토리 기록
            await this.logOrderHistory(orderId, 'paid', '무통장입금 입금 확인 (엑셀 일괄)', '관리자 엑셀 업로드로 입금 확인됨');
        }
    },

    // ──────────────────────────────────────────────────────────────
    // 관리자 계정 관리 (Admin Users)
    // ──────────────────────────────────────────────────────────────

    // 모든 관리자 목록 조회
    async getAdmins(): Promise<AdminUser[]> {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, admin_role, permissions, created_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admins:', error);
        throw error;
      }

      return (data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.admin_role || 'staff',
        permissions: user.permissions || [],
        createdDate: new Date(user.created_at).toISOString().split('T')[0],
        lastLogin: '-', // Auth 로그인이 별도 로깅되지 않으면 '-'
      }));
    },

    // 관리자 생성 (Edge Function 호출)
    async createAdmin(adminData: { name: string; email: string; password?: string; role: string; permissions: string[] }) {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: adminData,
      });

      if (error) {
        console.error('Error creating admin:', error);
        throw error;
      }
      return data;
    },

    // 관리자 수정 (DB 정보만 업데이트, 비밀번호 수정은 미포함)
    async updateAdmin(id: string, updates: { name: string; role: string; permissions: string[] }) {
      const { error } = await supabase.rpc('admin_update_user_fields', {
        p_user_id: id,
        p_update_data: {
          name: updates.name,
          admin_role: updates.role,
          permissions: updates.role === 'super' ? ['all'] : updates.permissions,
        }
      });

      if (error) {
        console.error('Error updating admin:', error);
        throw error;
      }
    },

    // 관리자 삭제
    async deleteAdmin(id: string) {
      // 실제 운영 환경에서는 soft delete를 하거나 Auth 테이블에서도 삭제해야 할 수 있습니다.
      // 여기서는 Edge Function 없이 간단히 DB에서만 삭제(또는 권한 박탈)하는 로직입니다.
      const { error } = await supabase.rpc('admin_update_user_fields', {
        p_user_id: id,
        p_update_data: { role: 'user', admin_role: null, permissions: [] }
      });

      if (error) {
        console.error('Error deleting admin:', error);
        throw error;
      }
    },

    // ──────────────────────────────────────────────────────────────
    // 매출 분석 통계 (Sales Analytics Stats)
    // ──────────────────────────────────────────────────────────────

    // 날짜 범위 및 매출 상태 정의 헬퍼
    _getSalesRangeAndStatuses(dateRange: string) {
        const now = new Date();
        let startDate = new Date();
        let endDateIso = new Date().toISOString();

        if (dateRange && dateRange.startsWith('custom:')) {
            const [_, rangeStr] = dateRange.split(':');
            const [startStr, endStr] = rangeStr.split('_');

            const sDate = new Date(startStr);
            sDate.setHours(0, 0, 0, 0);

            const eDate = new Date(endStr);
            eDate.setHours(23, 59, 59, 999);

            return {
                startDateIso: sDate.toISOString(),
                endDateIso: eDate.toISOString(),
                statuses: ['paid', 'processing', 'shipped', 'delivered']
            };
        }

        switch (dateRange) {
            case '7days':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(now.getDate() - 30);
                break;
            case '3months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 6);
        }
        return {
            startDateIso: startDate.toISOString(),
            endDateIso: endDateIso,
            statuses: ['paid', 'processing', 'shipped', 'delivered']
        };
    },

    // 1-1. getSalesOverviewStats
    async getSalesOverviewStats(dateRange: string, period: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);
        
        // 1. 기간 내 매출 조건에 맞는 주문 데이터 조회
        const { data: orders, error } = await supabase
            .from('orders')
            .select('ordered_at, total_amount, user_id')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso)
            .order('ordered_at', { ascending: true });

        if (error) throw error;

        // 요약 데이터 계산
        const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const totalOrders = orders.length;
        const customerSet = new Set(orders.map(o => o.user_id).filter(Boolean));
        const totalCustomers = customerSet.size;
        const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

        // 전월 요약 데이터를 비교하기 위해 이전 기간 데이터 조회
        const start = new Date(startDateIso);
        const end = new Date(endDateIso);
        const durationMs = end.getTime() - start.getTime();
        const prevStartDateIso = new Date(start.getTime() - durationMs).toISOString();

        const { data: prevOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .in('status', statuses)
            .gte('ordered_at', prevStartDateIso)
            .lt('ordered_at', startDateIso);

        const prevSales = (prevOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
        const salesGrowth = prevSales > 0 ? Number((((totalSales - prevSales) / prevSales) * 100).toFixed(1)) : 0;

        const prevOrderCount = (prevOrders || []).length;
        const orderGrowth = prevOrderCount > 0 ? Number((((totalOrders - prevOrderCount) / prevOrderCount) * 100).toFixed(1)) : 0;

        // 기간별(일별, 주별, 월별) 그룹화
        const chartDataMap: Record<string, { sales: number; orders: number; customers: Set<string> }> = {};

        orders.forEach(order => {
            const date = new Date(order.ordered_at);
            let key = '';

            if (period === 'day') {
                // MM/DD 포맷
                key = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            } else if (period === 'week') {
                // YYYY-Www 포맷 (주별)
                const oneJan = new Date(date.getFullYear(), 0, 1);
                const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
                const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
                key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
            } else if (period === 'quarter') {
                // YYYY-Qn 포맷 (분기별)
                const q = Math.floor(date.getMonth() / 3) + 1;
                key = `${date.getFullYear()}-Q${q}`;
            } else if (period === 'half') {
                // YYYY-Hn 포맷 (반기별)
                const h = Math.floor(date.getMonth() / 6) + 1;
                key = `${date.getFullYear()}-H${h}`;
            } else {
                // YYYY-MM 포맷 (월별)
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!chartDataMap[key]) {
                chartDataMap[key] = { sales: 0, orders: 0, customers: new Set() };
            }

            chartDataMap[key].sales += Number(order.total_amount);
            chartDataMap[key].orders += 1;
            if (order.user_id) {
                chartDataMap[key].customers.add(order.user_id);
            }
        });

        const chartData = Object.entries(chartDataMap).map(([label, d]) => ({
            label,
            sales: d.sales,
            orders: d.orders,
            customers: d.customers.size
        }));

        return {
            summary: {
                totalSales,
                totalOrders,
                totalCustomers,
                avgOrder,
                salesGrowth,
                orderGrowth
            },
            chartData
        };
    },

    // 1-1-extra. getPeriodSalesStats (기간별 매출현황 - daily/weekly/monthly/yearly)
    async getPeriodSalesStats(viewMode: 'daily' | 'weekly' | 'monthly' | 'yearly', year?: number, month?: number, startDate?: Date, endDate?: Date) {
        const statuses = ['paid', 'processing', 'shipped', 'delivered'];
        let startDateIso: string;
        let endDateIso: string;

        const now = new Date();

        // 외부에서 날짜 범위를 직접 주입한 경우 우선 사용
        if (startDate && endDate) {
            const s = new Date(startDate); s.setHours(0, 0, 0, 0);
            const e = new Date(endDate); e.setHours(23, 59, 59, 999);
            startDateIso = s.toISOString();
            endDateIso = e.toISOString();
        } else if (viewMode === 'daily') {
            const y = year || now.getFullYear();
            const m = month || (now.getMonth() + 1);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            startDateIso = start.toISOString();
            endDateIso = end.toISOString();
        } else if (viewMode === 'weekly') {
            const y = year || now.getFullYear();
            const m = month || (now.getMonth() + 1);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            startDateIso = start.toISOString();
            endDateIso = end.toISOString();
        } else if (viewMode === 'monthly') {
            const y = year || now.getFullYear();
            const start = new Date(y, 0, 1);
            const end = new Date(y, 11, 31, 23, 59, 59, 999);
            startDateIso = start.toISOString();
            endDateIso = end.toISOString();
        } else {
            // yearly: 최근 5년
            const start = new Date(now.getFullYear() - 4, 0, 1);
            startDateIso = start.toISOString();
            endDateIso = now.toISOString();
        }

        function getLocalMonday(d: Date): Date {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            date.setDate(diff);
            return date;
        }

        function getISOWeek(d: Date): number {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
            const week1 = new Date(date.getFullYear(), 0, 4);
            return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select('ordered_at, total_amount')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso)
            .order('ordered_at', { ascending: true });

        if (error) throw error;

        const groupMap: Record<string, { sales: number; orders: number }> = {};

        (orders || []).forEach(order => {
            const date = new Date(order.ordered_at);
            let key = '';

            if (viewMode === 'daily') {
                key = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            } else if (viewMode === 'weekly') {
                const mon = getLocalMonday(date);
                const w = getISOWeek(mon);
                key = `${mon.getFullYear()}-W${String(w).padStart(2, '0')}`;
            } else if (viewMode === 'monthly') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else {
                key = `${date.getFullYear()}`;
            }

            if (!groupMap[key]) groupMap[key] = { sales: 0, orders: 0 };
            groupMap[key].sales += Number(order.total_amount);
            groupMap[key].orders += 1;
        });

        // 기간 내 모든 단위 레이블을 생성하고 데이터가 없는 구간은 0으로 채움
        const periods: { label: string; dateText: string }[] = [];
        const rangeStart = new Date(startDateIso);
        const rangeEnd = new Date(endDateIso);
        const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        if (viewMode === 'daily') {
            const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
            const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
            while (cur <= last) {
                const label = `${String(cur.getMonth() + 1).padStart(2, '0')}/${String(cur.getDate()).padStart(2, '0')}`;
                periods.push({
                    label,
                    dateText: formatDate(cur)
                });
                cur.setDate(cur.getDate() + 1);
            }
        } else if (viewMode === 'weekly') {
            const cur = getLocalMonday(rangeStart);
            const last = getLocalMonday(rangeEnd);
            while (cur <= last) {
                const sunday = new Date(cur);
                sunday.setDate(cur.getDate() + 6);
                const w = getISOWeek(cur);
                const wKey = `${cur.getFullYear()}-W${String(w).padStart(2, '0')}`;
                periods.push({
                    label: wKey,
                    dateText: `${formatDate(cur)} ~ ${formatDate(sunday)}`
                });
                cur.setDate(cur.getDate() + 7);
            }
        } else if (viewMode === 'monthly') {
            const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
            const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
            while (cur <= last) {
                const label = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
                const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
                periods.push({
                    label,
                    dateText: `${formatDate(cur)} ~ ${formatDate(lastDay)}`
                });
                cur.setMonth(cur.getMonth() + 1);
            }
        } else {
            for (let y = rangeStart.getFullYear(); y <= rangeEnd.getFullYear(); y++) {
                periods.push({
                    label: `${y}`,
                    dateText: `${y}-01-01 ~ ${y}-12-31`
                });
            }
        }

        const rows = periods.map(p => {
            const d = groupMap[p.label] ?? { sales: 0, orders: 0 };
            return {
                label: p.label,
                dateText: p.dateText,
                sales: d.sales,
                orders: d.orders,
                avgOrder: d.orders > 0 ? Math.round(d.sales / d.orders) : 0,
            };
        });

        const totalSales = rows.reduce((s, r) => s + r.sales, 0);
        const totalOrders = rows.reduce((s, r) => s + r.orders, 0);

        return { rows, totalSales, totalOrders };
    },


    async getSalesCategoryStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        // 주문과 주문 품목 조인하여 가져옴
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id,
                ordered_at,
                order_items (
                    quantity,
                    unit_price,
                    total_price,
                    product:products (
                        id,
                        name,
                        category
                    )
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const categoryMap: Record<string, { 
            sales: number; 
            ordersCount: Set<string>; 
            itemsCount: number; 
            products: Record<string, { name: string; sales: number; qty: number }>;
            trend: Record<string, number>;
        }> = {};

        (orders || []).forEach(order => {
            const date = new Date(order.ordered_at);
            // Determine grouping key based on dateRange
            let dateKey = '';
            if (dateRange === '7days' || dateRange === '30days') {
                dateKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            } else if (dateRange === '3months') {
                const oneJan = new Date(date.getFullYear(), 0, 1);
                const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
                const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
                dateKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
            } else {
                dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            (order.order_items || []).forEach((item: any) => {
                const category = item.product?.category || '기타소모품';
                const revenue = Number(item.total_price || (item.unit_price * item.quantity));
                const prodId = item.product?.id || 'unknown';
                const prodName = item.product?.name || '기타 상품';

                if (!categoryMap[category]) {
                    categoryMap[category] = { sales: 0, ordersCount: new Set(), itemsCount: 0, products: {}, trend: {} };
                }

                categoryMap[category].sales += revenue;
                categoryMap[category].ordersCount.add(order.id);
                categoryMap[category].itemsCount += item.quantity;
                categoryMap[category].trend[dateKey] = (categoryMap[category].trend[dateKey] || 0) + revenue;

                if (!categoryMap[category].products[prodId]) {
                    categoryMap[category].products[prodId] = { name: prodName, sales: 0, qty: 0 };
                }
                categoryMap[category].products[prodId].sales += revenue;
                categoryMap[category].products[prodId].qty += item.quantity;
            });
        });

        const totalRevenue = Object.values(categoryMap).reduce((sum, c) => sum + c.sales, 0);

        const categoryStats = Object.entries(categoryMap).map(([name, data]) => {
            const productContribution = Object.entries(data.products).map(([id, p]) => ({
                id,
                name: p.name,
                sales: p.sales,
                quantity: p.qty,
                percentage: data.sales > 0 ? Number(((p.sales / data.sales) * 100).toFixed(1)) : 0
            })).sort((a, b) => b.sales - a.sales);

            const trendData = Object.entries(data.trend).map(([label, sales]) => ({
                label,
                sales
            })).sort((a, b) => a.label.localeCompare(b.label));

            return {
                category: name,
                sales: data.sales,
                orders: data.ordersCount.size,
                percentage: totalRevenue > 0 ? Number(((data.sales / totalRevenue) * 100).toFixed(1)) : 0,
                avgOrder: data.ordersCount.size > 0 ? Math.round(data.sales / data.ordersCount.size) : 0,
                growth: 12.5, 
                products: productContribution,
                trendData
            };
        }).sort((a, b) => b.sales - a.sales);

        return categoryStats;
    },

    // 1-3. getSalesPaymentStats
    async getSalesPaymentStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, total_amount, payment_method, ordered_at')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const paymentMap: Record<string, { amount: number; count: number }> = {};
        const methodMapping: Record<string, string> = {
            'virtual': '가상계좌',
            'transfer': '무통장입금',
            'credit': '신용카드(저장)',
            'general': '일반결제(신용카드)',
            'split': '카드분할결제',
            'partial_card': '카드일부결제'
        };

        let totalAmount = 0;

        (orders || []).forEach(o => {
            const rawMethod = o.payment_method || 'transfer';
            const method = methodMapping[rawMethod] || rawMethod;
            const amt = Number(o.total_amount);

            if (!paymentMap[method]) {
                paymentMap[method] = { amount: 0, count: 0 };
            }

            paymentMap[method].amount += amt;
            paymentMap[method].count += 1;
            totalAmount += amt;
        });

        const paymentStats = Object.entries(paymentMap).map(([method, d]) => ({
            method,
            amount: d.amount,
            count: d.count,
            percentage: totalAmount > 0 ? Number(((d.amount / totalAmount) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.amount - a.amount);

        // 월별/주별 결제수단 변화 트렌드 데이터
        const trendMap: Record<string, Record<string, number>> = {};
        (orders || []).forEach(o => {
            const date = new Date(o.ordered_at);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const rawMethod = o.payment_method || 'transfer';
            const method = methodMapping[rawMethod] || rawMethod;
            const amt = Number(o.total_amount);

            if (!trendMap[monthStr]) {
                trendMap[monthStr] = {};
            }
            trendMap[monthStr][method] = (trendMap[monthStr][method] || 0) + amt;
        });

        const trendData = Object.entries(trendMap).map(([label, methods]) => ({
            label,
            ...methods
        })).sort((a, b) => a.label.localeCompare(b.label));

        return {
            paymentStats,
            trendData
        };
    },

    // 1-4. getSalesCustomerStats
    async getSalesCustomerStats(dateRange: string, page: number, limit: number, search: string, memberType?: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: users, error: userErr } = await supabase
            .from('users')
            .select('id, name, hospital_name, member_type');
        
        if (userErr) throw userErr;

        const userMap = (users || []).reduce((acc: any, u) => {
            acc[u.id] = { name: u.name, hospitalName: u.hospital_name || '일반고객', memberType: u.member_type || '미지정' };
            return acc;
        }, {});

        // 주문 데이터 조회
        const { data: orders, error } = await supabase
            .from('orders')
            .select('user_id, total_amount')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const customerSalesMap: Record<string, { totalSales: number; ordersCount: number }> = {};

        (orders || []).forEach(o => {
            const uId = o.user_id || 'guest';
            if (!customerSalesMap[uId]) {
                customerSalesMap[uId] = { totalSales: 0, ordersCount: 0 };
            }
            customerSalesMap[uId].totalSales += Number(o.total_amount);
            customerSalesMap[uId].ordersCount += 1;
        });

        let customerStats = Object.entries(customerSalesMap).map(([uId, d]) => {
            const uInfo = userMap[uId] || { name: '비회원', hospitalName: '-', memberType: '-' };
            return {
                userId: uId,
                name: uInfo.name,
                hospitalName: uInfo.hospitalName,
                memberType: uInfo.memberType,
                totalSales: d.totalSales,
                orders: d.ordersCount,
                avgOrder: d.ordersCount > 0 ? Math.round(d.totalSales / d.ordersCount) : 0
            };
        });

        // 검색어 필터링
        if (search) {
            const sLower = search.toLowerCase();
            customerStats = customerStats.filter(c => 
                c.name.toLowerCase().includes(sLower) || 
                c.hospitalName.toLowerCase().includes(sLower) ||
                c.memberType.toLowerCase().includes(sLower)
            );
        }

        // 고객분류 필터링 (정렬 및 순위 매기기 전)
        if (memberType && memberType !== 'all') {
            customerStats = customerStats.filter(c => c.memberType === memberType);
        }

        // 정렬: 매출 기준 내림차순
        customerStats.sort((a, b) => b.totalSales - a.totalSales);

        // 순위 매기기
        customerStats = customerStats.map((c, index) => ({
            rank: index + 1,
            ...c
        }));

        const totalCount = customerStats.length;

        // 페이징 처리
        const startIndex = (page - 1) * limit;
        const paginatedData = customerStats.slice(startIndex, startIndex + limit);

        return {
            data: paginatedData,
            totalCount
        };
    },

    // 1-4-extra. getSalesCustomerTypeStats
    async getSalesCustomerTypeStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: users, error: userErr } = await supabase
            .from('users')
            .select('id, member_type');
        
        if (userErr) throw userErr;

        const userMap = (users || []).reduce((acc: any, u) => {
            acc[u.id] = u.member_type || '미지정';
            return acc;
        }, {});

        // 주문 데이터 조회
        const { data: orders, error } = await supabase
            .from('orders')
            .select('user_id, total_amount')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const typeSalesMap: Record<string, { totalSales: number; ordersCount: number; customerSet: Set<string> }> = {};

        (orders || []).forEach(o => {
            const uId = o.user_id || 'guest';
            const mType = userMap[uId] || '미지정';
            if (!typeSalesMap[mType]) {
                typeSalesMap[mType] = { totalSales: 0, ordersCount: 0, customerSet: new Set() };
            }
            typeSalesMap[mType].totalSales += Number(o.total_amount);
            typeSalesMap[mType].ordersCount += 1;
            if (o.user_id) {
                typeSalesMap[mType].customerSet.add(o.user_id);
            }
        });

        const totalRevenue = Object.values(typeSalesMap).reduce((sum, d) => sum + d.totalSales, 0);

        const stats = Object.entries(typeSalesMap).map(([type, d]) => ({
            memberType: type,
            totalSales: d.totalSales,
            orders: d.ordersCount,
            customers: d.customerSet.size,
            percentage: totalRevenue > 0 ? Number(((d.totalSales / totalRevenue) * 100).toFixed(1)) : 0,
            avgOrder: d.ordersCount > 0 ? Math.round(d.totalSales / d.ordersCount) : 0
        })).sort((a, b) => b.totalSales - a.totalSales)
           .map((item, index) => ({
               rank: index + 1,
               ...item
           }));

        return stats;
    },

    // 1-5. getSalesProductPaymentStats
    async getSalesProductPaymentStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                id,
                payment_method,
                order_items (
                    quantity,
                    unit_price,
                    total_price,
                    product:products (
                        name
                    )
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const methodMapping: Record<string, string> = {
            'virtual': '가상계좌',
            'transfer': '무통장입금',
            'credit': '신용카드(저장)',
            'general': '일반결제(신용카드)',
            'split': '카드분할결제',
            'partial_card': '카드일부결제'
        };

        const productPaymentMap: Record<string, { totalSales: number; payments: Record<string, number> }> = {};

        (orders || []).forEach(order => {
            const rawMethod = order.payment_method || 'transfer';
            const method = methodMapping[rawMethod] || rawMethod;

            (order.order_items || []).forEach((item: any) => {
                const prodName = item.product?.name || 'Unknown Product';
                const revenue = Number(item.total_price || (item.unit_price * item.quantity));

                if (!productPaymentMap[prodName]) {
                    productPaymentMap[prodName] = { totalSales: 0, payments: {} };
                }

                productPaymentMap[prodName].totalSales += revenue;
                productPaymentMap[prodName].payments[method] = (productPaymentMap[prodName].payments[method] || 0) + revenue;
            });
        });

        const productPaymentStats = Object.entries(productPaymentMap).map(([name, data]) => {
            const paymentsFormatted: Record<string, number> = {};
            Object.entries(data.payments).forEach(([method, amt]) => {
                paymentsFormatted[method] = amt;
            });

            return {
                productName: name,
                totalSales: data.totalSales,
                payments: paymentsFormatted
            };
        }).sort((a, b) => b.totalSales - a.totalSales);

        return productPaymentStats;
    },

    // 1-6. getSalesOfficeStats
    async getSalesOfficeStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: users, error: userErr } = await supabase
            .from('users')
            .select('id, region');

        if (userErr) throw userErr;

        const userRegionMap = (users || []).reduce((acc: any, u) => {
            acc[u.id] = u.region || '기타';
            return acc;
        }, {});

        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, total_amount, user_id')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const regionSalesMap: Record<string, { totalSales: number; ordersCount: number }> = {};
        let grandTotal = 0;

        (orders || []).forEach(o => {
            const uId = o.user_id || 'guest';
            const region = userRegionMap[uId] || '기타';
            const amt = Number(o.total_amount);

            if (!regionSalesMap[region]) {
                regionSalesMap[region] = { totalSales: 0, ordersCount: 0 };
            }
            regionSalesMap[region].totalSales += amt;
            regionSalesMap[region].ordersCount += 1;
            grandTotal += amt;
        });

        // B2B 영업소 지역 매핑 데이터
        const staticOffices = [
            { officeCode: 'SEOUL01', name: '서울본사', region: '서울/경기', manager: '김영업' },
            { officeCode: 'BUSAN01', name: '부산지점', region: '부산/경남', manager: '이지점' },
            { officeCode: 'DAEGU01', name: '대구지점', region: '대구/경북', manager: '박대구' },
            { officeCode: 'GWANGJU01', name: '광주지점', region: '광주/전라', manager: '최광주' },
        ];

        const officeStats = staticOffices.map(office => {
            const salesData = regionSalesMap[office.region] || { totalSales: 0, ordersCount: 0 };
            return {
                officeName: office.name,
                officeCode: office.officeCode,
                region: office.region,
                manager: office.manager,
                sales: salesData.totalSales,
                orders: salesData.ordersCount,
                percentage: grandTotal > 0 ? Number(((salesData.totalSales / grandTotal) * 100).toFixed(1)) : 0
            };
        });

        // 매핑되지 않은 기타 매출이 있을 경우 추가
        const mappedRegions = new Set(staticOffices.map(o => o.region));
        let remainingSales = 0;
        let remainingOrders = 0;
        Object.entries(regionSalesMap).forEach(([reg, d]) => {
            if (!mappedRegions.has(reg)) {
                remainingSales += d.totalSales;
                remainingOrders += d.ordersCount;
            }
        });

        if (remainingSales > 0) {
            officeStats.push({
                officeName: '기타/비회원',
                officeCode: 'ETC01',
                region: '기타',
                manager: '-',
                sales: remainingSales,
                orders: remainingOrders,
                percentage: grandTotal > 0 ? Number(((remainingSales / grandTotal) * 100).toFixed(1)) : 0
            });
        }

        officeStats.sort((a, b) => b.sales - a.sales);

        return officeStats;
    },

    // 1-7. getSalesTrendStats
    async getSalesTrendStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('ordered_at, total_amount')
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        // 요일별 초기화
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayStatsMap = days.reduce((acc: any, d) => {
            acc[d] = { sales: 0, orders: 0 };
            return acc;
        }, {});

        // 시간대별 초기화 (0 ~ 23시)
        const hourStatsMap: Record<number, { sales: number; orders: number }> = {};
        for (let i = 0; i < 24; i++) {
            hourStatsMap[i] = { sales: 0, orders: 0 };
        }

        (orders || []).forEach(o => {
            const date = new Date(o.ordered_at);
            const amt = Number(o.total_amount);
            
            // 요일
            const dayName = days[date.getDay()];
            dayStatsMap[dayName].sales += amt;
            dayStatsMap[dayName].orders += 1;

            // 시간
            const hr = date.getHours();
            hourStatsMap[hr].sales += amt;
            hourStatsMap[hr].orders += 1;
        });

        const dayStats = days.map(d => ({
            label: d,
            sales: dayStatsMap[d].sales,
            orders: dayStatsMap[d].orders
        }));

        const hourStats = Object.entries(hourStatsMap).map(([hr, d]) => ({
            label: `${hr}시`,
            sales: d.sales,
            orders: d.orders
        }));

        return {
            dayStats,
            hourStats
        };
    },

    // ──────────────────────────────────────────────────────────────
    // 상품 분석 통계 (Product Analytics Stats)
    // ──────────────────────────────────────────────────────────────

    // 1-1. getProductOverviewStats
    async getProductOverviewStats(dateRange: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        // 1. 전체 상품 수 & 활성 상품 수
        const { data: allProducts, error: prodErr } = await supabase
            .from('products')
            .select('id, is_active, stock');
        if (prodErr) throw prodErr;

        const totalProducts = allProducts?.length || 0;
        const activeProducts = allProducts?.filter(p => p.is_active).length || 0;
        const lowStockCount = allProducts?.filter(p => (p.stock || 0) < 10).length || 0;

        // 2. 지정 기간 내 판매 주문의 총 아이템 판매량 집계
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`
                ordered_at,
                order_items (
                    quantity,
                    product:products (
                        category
                    )
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (orderErr) throw orderErr;

        let totalQtySold = 0;

        // dateRange에 따라 그루핑 단위 결정 (매출분석 카테고리별 차트와 동일한 로직)
        const categoryDateSalesMap: Record<string, Record<string, number>> = {};

        (orders || []).forEach(order => {
            const date = new Date(order.ordered_at);
            let dateKey = '';
            if (dateRange === '7days' || dateRange === '30days') {
                // 일별: MM/DD
                dateKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            } else if (dateRange === '3months') {
                // 주별: YYYY-Www
                const oneJan = new Date(date.getFullYear(), 0, 1);
                const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
                const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
                dateKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
            } else {
                // 월별: YYYY-MM
                dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            (order.order_items || []).forEach((item: any) => {
                const qty = Number(item.quantity || 0);
                totalQtySold += qty;

                const category = item.product?.category || '기타소모품';
                if (!categoryDateSalesMap[dateKey]) {
                    categoryDateSalesMap[dateKey] = {};
                }
                categoryDateSalesMap[dateKey][category] = (categoryDateSalesMap[dateKey][category] || 0) + qty;
            });
        });

        // dateRange에 따라 X축 레이블 목록 생성
        const activeKeys: string[] = [];
        const rangeStart = new Date(startDateIso);
        const rangeEnd = new Date(endDateIso);

        if (dateRange === '7days' || dateRange === '30days') {
            // 일별: startDate ~ endDate 순회
            let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
            while (cur <= rangeEnd) {
                activeKeys.push(`${String(cur.getMonth() + 1).padStart(2, '0')}/${String(cur.getDate()).padStart(2, '0')}`);
                cur.setDate(cur.getDate() + 1);
            }
        } else if (dateRange === '3months') {
            // 주별: 범위 내 주차 목록 생성
            const weekSet = new Set<string>();
            let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
            while (cur <= rangeEnd) {
                const oneJan = new Date(cur.getFullYear(), 0, 1);
                const numberOfDays = Math.floor((cur.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
                const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
                weekSet.add(`${cur.getFullYear()}-W${String(weekNum).padStart(2, '0')}`);
                cur.setDate(cur.getDate() + 1);
            }
            activeKeys.push(...Array.from(weekSet).sort());
        } else {
            // 월별: startMonth ~ endMonth 순회
            let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
            const last = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
            while (cur <= last) {
                activeKeys.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
                cur.setMonth(cur.getMonth() + 1);
            }
        }

        const categoryTrendData = activeKeys.map(key => {
            const categoriesData = categoryDateSalesMap[key] || {};
            // X축 레이블: 월별인 경우 "YY.MM", 나머지는 그대로
            let label = key;
            if (dateRange !== '7days' && dateRange !== '30days' && dateRange !== '3months') {
                const [y, m] = key.split('-');
                label = `${y.slice(2)}.${m}`;
            }
            return {
                month: label,
                ...categoriesData
            };
        });

        // 3. 전월 대비 판매량 성장률 계산
        const start = new Date(startDateIso);
        const end = new Date(endDateIso);
        const durationMs = end.getTime() - start.getTime();
        const prevStartDateIso = new Date(start.getTime() - durationMs).toISOString();

        const { data: prevOrders } = await supabase
            .from('orders')
            .select(`
                order_items (
                    quantity
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', prevStartDateIso)
            .lt('ordered_at', startDateIso);

        let prevQtySold = 0;
        (prevOrders || []).forEach(o => {
            (o.order_items || []).forEach((item: any) => {
                prevQtySold += Number(item.quantity || 0);
            });
        });

        const growth = prevQtySold > 0 ? Number((((totalQtySold - prevQtySold) / prevQtySold) * 100).toFixed(1)) : 0;

        return {
            summary: {
                totalProducts,
                activeProducts,
                totalQtySold,
                lowStockCount,
                growth
            },
            categoryTrendData
        };
    },

    // 1-1.5. getProductCategoryTrendStats
    async getProductCategoryTrendStats(dateRange: string, category: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        // 1. 전체 상품 조회 (자식/옵션 상품 제외, 단가 조회를 위해 price 필드 추가)
        const { data: allProducts, error: prodErr } = await supabase
            .from('products')
            .select('id, name, category, stock, is_active, base_product_id, price');
        if (prodErr) throw prodErr;

        const baseProducts = (allProducts || []).filter(p => !p.base_product_id);

        // Categories list
        const categoriesSet = new Set<string>();
        baseProducts.forEach(p => {
            if (p.category) {
                categoriesSet.add(p.category);
            }
        });
        const categories = Array.from(categoriesSet);

        // 2. Filter products by selected category
        const selectedCategory = category || categories[0] || '의료기기 장비';
        const targetProducts = baseProducts.filter(p => p.category === selectedCategory);
        const targetProductIds = targetProducts.map(p => p.id);

        // 2-1. 구성품 매핑 관계 데이터 병렬 조회 (세트상품/복합상품/패키지/사은품 구성 해소용)
        const [
            { data: pkgItems },
            { data: bonusItems },
            { data: promoItems }
        ] = await Promise.all([
            supabase.from('package_items').select('package_id, product_id'),
            supabase.from('product_bonus_items').select('parent_product_id, bonus_product_id, quantity'),
            supabase.from('product_promotion_items').select('parent_product_id, product_id')
        ]);

        const packageMap: Record<string, string[]> = {};
        (pkgItems || []).forEach((item: any) => {
            if (!packageMap[item.package_id]) packageMap[item.package_id] = [];
            packageMap[item.package_id].push(item.product_id);
        });

        const bonusMap: Record<string, Array<{ id: string; qty: number }>> = {};
        (bonusItems || []).forEach((item: any) => {
            if (!bonusMap[item.parent_product_id]) bonusMap[item.parent_product_id] = [];
            bonusMap[item.parent_product_id].push({
                id: item.bonus_product_id,
                qty: Number(item.quantity || 1)
            });
        });

        const promoMap: Record<string, string[]> = {};
        (promoItems || []).forEach((item: any) => {
            if (!promoMap[item.parent_product_id]) promoMap[item.parent_product_id] = [];
            promoMap[item.parent_product_id].push(item.product_id);
        });

        // 3. Fetch orders in range (selected_product_ids 포함)
        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`
                ordered_at,
                order_items (
                    quantity,
                    total_price,
                    unit_price,
                    product_id,
                    selected_product_ids
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (orderErr) throw orderErr;

        // product-specific totals and trends
        const productTrendsMap: Record<string, Record<string, number>> = {}; // productId -> { month: qty }
        const productStatsMap: Record<string, { totalQty: number; totalRevenue: number }> = {};

        // Initialize maps
        targetProductIds.forEach(id => {
            productTrendsMap[id] = {};
            productStatsMap[id] = { totalQty: 0, totalRevenue: 0 };
        });

        (orders || []).forEach(order => {
            const date = new Date(order.ordered_at);
            const monthStr = `${date.getMonth() + 1}월`;

            (order.order_items || []).forEach((item: any) => {
                const parentId = item.product_id;
                if (!parentId) return;

                const qty = Number(item.quantity || 0);

                // 구성 상품 해소 배열
                const resolvedItems: Array<{ id: string; qty: number }> = [];

                // A. 선택된 제품 구성 리스트가 존재하는 경우 (복합/패키지 번들 선택)
                if (item.selected_product_ids && item.selected_product_ids.length > 0) {
                    item.selected_product_ids.forEach((id: string) => {
                        resolvedItems.push({ id, qty: qty });
                    });
                } else {
                    // B. 고정 구성 패키지 아이템인 경우
                    if (packageMap[parentId]) {
                        packageMap[parentId].forEach((prodId: string) => {
                            resolvedItems.push({ id: prodId, qty: qty });
                        });
                    }
                    // C. 프로모션 묶음 상품인 경우
                    else if (promoMap[parentId]) {
                        promoMap[parentId].forEach((prodId: string) => {
                            resolvedItems.push({ id: prodId, qty: qty });
                        });
                    }
                    // D. 단일 상품인 경우
                    else {
                        resolvedItems.push({ id: parentId, qty: qty });
                    }
                }

                // E. 부속 사은품(Bonus)이 있는 경우 추가 해소
                if (bonusMap[parentId]) {
                    bonusMap[parentId].forEach((bonus: any) => {
                        resolvedItems.push({ id: bonus.id, qty: qty * bonus.qty });
                    });
                }

                // 매핑된 구성 상품 중, 현재 조회 카테고리에 속한 본 상품들만 누적 집계
                resolvedItems.forEach(resolved => {
                    const prodId = resolved.id;
                    const resolvedQty = resolved.qty;

                    if (!targetProductIds.includes(prodId)) return;

                    productTrendsMap[prodId][monthStr] = (productTrendsMap[prodId][monthStr] || 0) + resolvedQty;
                    productStatsMap[prodId].totalQty += resolvedQty;

                    // 단가 x 판매수량으로 매출액 누적 계산
                    const prodPrice = allProducts.find(p => p.id === prodId)?.price || 0;
                    productStatsMap[prodId].totalRevenue += (resolvedQty * Number(prodPrice));
                });
            });
        });

        // Determine months to display
        const start = new Date(startDateIso);
        const end = new Date(endDateIso);
        const activeMonths: string[] = [];
        let cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cur <= last) {
            activeMonths.push(`${cur.getMonth() + 1}월`);
            cur.setMonth(cur.getMonth() + 1);
        }
        if (activeMonths.length === 0) {
            // Fallback to last 6 months
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                activeMonths.push(`${d.getMonth() + 1}월`);
            }
        }

        // Format trendData: Array of { month: string, [productId]: qty }
        const trendData = activeMonths.map(month => {
            const row: Record<string, any> = { month };
            targetProducts.forEach(p => {
                row[p.id] = productTrendsMap[p.id]?.[month] || 0;
            });
            return row;
        });

        // Product list for table
        const productsList = targetProducts.map(p => {
            const stats = productStatsMap[p.id] || { totalQty: 0, totalRevenue: 0 };
            return {
                id: p.id,
                name: p.name,
                category: p.category,
                stock: p.stock || 0,
                is_active: p.is_active,
                totalQty: stats.totalQty,
                totalRevenue: stats.totalRevenue
            };
        });

        return {
            categories,
            selectedCategory,
            products: productsList,
            trendData
        };
    },

    // 1-2. getProductBestsellerStats
    async getProductBestsellerStats(dateRange: string, page: number, limit: number, category: string, sortBy: string) {
        const { startDateIso, endDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                order_items (
                    quantity,
                    unit_price,
                    total_price,
                    product_id
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso)
            .lte('ordered_at', endDateIso);

        if (error) throw error;

        const productAggregateMap: Record<string, { sales: number; revenue: number }> = {};
        (orders || []).forEach(order => {
            (order.order_items || []).forEach((item: any) => {
                const prodId = item.product_id;
                if (!prodId) return;

                const qty = Number(item.quantity || 0);
                const rev = Number(item.total_price || (item.unit_price * qty));

                if (!productAggregateMap[prodId]) {
                    productAggregateMap[prodId] = { sales: 0, revenue: 0 };
                }
                productAggregateMap[prodId].sales += qty;
                productAggregateMap[prodId].revenue += rev;
            });
        });

        const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, name, category, stock');

        if (prodErr) throw prodErr;

        let bestsellerList = (products || []).map(p => {
            const agg = productAggregateMap[p.id] || { sales: 0, revenue: 0 };
            return {
                id: p.id,
                name: p.name,
                category: p.category || '기타소모품',
                sales: agg.sales,
                revenue: agg.revenue,
                stock: p.stock || 0,
                growth: agg.sales > 0 ? Number((Math.random() * 20 - 5).toFixed(1)) : 0
            };
        });

        if (category && category !== 'all') {
            bestsellerList = bestsellerList.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }

        if (sortBy === 'sales') {
            bestsellerList.sort((a, b) => b.sales - a.sales);
        } else if (sortBy === 'revenue') {
            bestsellerList.sort((a, b) => b.revenue - a.revenue);
        } else if (sortBy === 'growth') {
            bestsellerList.sort((a, b) => b.growth - a.growth);
        }

        bestsellerList = bestsellerList.map((p, idx) => ({
            rank: idx + 1,
            ...p
        }));

        const totalCount = bestsellerList.length;

        const startIndex = (page - 1) * limit;
        const paginatedData = bestsellerList.slice(startIndex, startIndex + limit);

        return {
            data: paginatedData,
            totalCount
        };
    },

    // 1-3. getProductStockStats
    async getProductStockStats(page: number, limit: number) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`
                order_items (
                    quantity,
                    product_id
                )
            `)
            .in('status', ['paid', 'processing', 'shipped', 'delivered'])
            .gte('ordered_at', thirtyDaysAgo.toISOString());

        if (orderErr) throw orderErr;

        const productSalesMap: Record<string, number> = {};
        (orders || []).forEach(o => {
            (o.order_items || []).forEach((item: any) => {
                if (item.product_id) {
                    productSalesMap[item.product_id] = (productSalesMap[item.product_id] || 0) + Number(item.quantity || 0);
                }
            });
        });

        const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, name, category, stock')
            .order('stock', { ascending: true });

        if (prodErr) throw prodErr;

        const stockStatsList = (products || []).map(p => {
            const totalSales30Days = productSalesMap[p.id] || 0;
            const dailyVelocity = totalSales30Days / 30;
            
            let daysToOutOfStock = 999;
            if (dailyVelocity > 0) {
                daysToOutOfStock = Math.round((p.stock || 0) / dailyVelocity);
            }

            return {
                id: p.id,
                name: p.name,
                category: p.category || '기타소모품',
                stock: p.stock || 0,
                minStock: 50,
                sales30Days: totalSales30Days,
                daysToOutOfStock: p.stock === 0 ? 0 : daysToOutOfStock
            };
        });

        stockStatsList.sort((a, b) => {
            const aWarn = a.stock < a.minStock;
            const bWarn = b.stock < b.minStock;
            if (aWarn && !bWarn) return -1;
            if (!aWarn && bWarn) return 1;
            return a.stock - b.stock;
        });

        const totalCount = stockStatsList.length;

        const startIndex = (page - 1) * limit;
        const paginatedData = stockStatsList.slice(startIndex, startIndex + limit);

        const lowStockAlerts = stockStatsList.filter(s => s.stock < s.minStock).slice(0, 10);

        return {
            data: paginatedData,
            totalCount,
            lowStockAlerts
        };
    },

    // 1-4. getProductConversionStats
    async getProductConversionStats(dateRange: string, page: number, limit: number) {
        const { startDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: orders, error: orderErr } = await supabase
            .from('orders')
            .select(`
                order_items (
                    quantity,
                    product_id
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso);

        if (orderErr) throw orderErr;

        const purchaseMap: Record<string, number> = {};
        (orders || []).forEach(o => {
            (o.order_items || []).forEach((item: any) => {
                if (item.product_id) {
                    purchaseMap[item.product_id] = (purchaseMap[item.product_id] || 0) + Number(item.quantity || 0);
                }
            });
        });

        const { data: cartItems, error: cartErr } = await supabase
            .from('cart_items')
            .select('product_id, quantity')
            .gte('created_at', startDateIso);

        if (cartErr) throw cartErr;

        const cartMap: Record<string, number> = {};
        (cartItems || []).forEach(c => {
            if (c.product_id) {
                cartMap[c.product_id] = (cartMap[c.product_id] || 0) + Number(c.quantity || 0);
            }
        });

        const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, name, category');

        if (prodErr) throw prodErr;

        const conversionList = (products || []).map(p => {
            const purchases = purchaseMap[p.id] || 0;
            const carts = Math.max(cartMap[p.id] || 0, Math.round(purchases * 1.5) + Math.floor(Math.random() * 5));
            const views = Math.max(carts * 5, Math.round(purchases * 8) + Math.floor(Math.random() * 20) + 10);
            const conversionRate = views > 0 ? Number(((purchases / views) * 100).toFixed(1)) : 0;

            return {
                id: p.id,
                name: p.name,
                category: p.category || '기타소모품',
                views,
                carts,
                purchases,
                conversionRate
            };
        }).sort((a, b) => b.conversionRate - a.conversionRate);

        const totalCount = conversionList.length;

        const startIndex = (page - 1) * limit;
        const paginatedData = conversionList.slice(startIndex, startIndex + limit);

        const top5Funnel = conversionList.slice(0, 5);

        return {
            data: paginatedData,
            totalCount,
            top5Funnel
        };
    },

    // 1-5. getProductLowPerformingStats
    async getProductLowPerformingStats(dateRange: string, page: number, limit: number) {
        const { startDateIso, statuses } = this._getSalesRangeAndStatuses(dateRange);

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                order_items (
                    quantity,
                    product_id
                )
            `)
            .in('status', statuses)
            .gte('ordered_at', startDateIso);

        if (error) throw error;

        const productSalesMap: Record<string, number> = {};
        (orders || []).forEach(order => {
            (order.order_items || []).forEach((item: any) => {
                if (item.product_id) {
                    productSalesMap[item.product_id] = (productSalesMap[item.product_id] || 0) + Number(item.quantity || 0);
                }
            });
        });

        const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, name, category, stock, price');

        if (prodErr) throw prodErr;

        const lowPerformingList = (products || []).map(p => {
            const sales = productSalesMap[p.id] || 0;
            return {
                id: p.id,
                name: p.name,
                category: p.category || '기타소모품',
                sales,
                stock: p.stock || 0,
                price: p.price || 0,
                deadStockValue: (p.stock || 0) * (p.price || 0)
            };
        });

        lowPerformingList.sort((a, b) => {
            if (a.sales !== b.sales) {
                return a.sales - b.sales;
            }
            return b.stock - a.stock;
        });

        const totalCount = lowPerformingList.length;

        const startIndex = (page - 1) * limit;
        const paginatedData = lowPerformingList.slice(startIndex, startIndex + limit);

        return {
            data: paginatedData,
            totalCount
        };
    },

    // ──────────────────────────────────────────────────────────────
    // 크레딧 분석 통계 (Credit Analytics Stats)
    // ──────────────────────────────────────────────────────────────

    // 1-1. getCreditOverviewStats
    async getCreditOverviewStats(dateRange: string) {
        const { startDateIso, endDateIso } = this._getSalesRangeAndStatuses(dateRange);

        // 1. 거래 내역 조회
        const { data: txs, error: txErr } = await supabase
            .from('credit_transactions')
            .select('amount, type, created_at')
            .gte('created_at', startDateIso)
            .lte('created_at', endDateIso);

        if (txErr) throw txErr;

        let issued = 0;
        let used = 0;
        let expired = 0;

        const monthlyMap: Record<string, { issue: number; use: number }> = {};

        (txs || []).forEach(tx => {
            const amt = Number(tx.amount || 0);
            const type = tx.type;
            if (type === 'issue') issued += amt;
            else if (type === 'use') used += amt;
            else if (type === 'expire') expired += amt;

            const date = new Date(tx.created_at);
            const monthStr = `${date.getMonth() + 1}월`;
            if (!monthlyMap[monthStr]) {
                monthlyMap[monthStr] = { issue: 0, use: 0 };
            }
            if (type === 'issue') monthlyMap[monthStr].issue += amt;
            if (type === 'use') monthlyMap[monthStr].use += amt;
        });

        // 2. 현재 잔액 및 장비별 분포 (user_credits 조회)
        const { data: credits, error: credErr } = await supabase
            .from('user_credits')
            .select('equipment_type, amount, used_amount, status, expiry_date');

        if (credErr) throw credErr;

        let totalRemaining = 0;
        const equipmentMap: Record<string, number> = {};

        const nowIso = new Date().toISOString();

        (credits || []).forEach(c => {
            const amt = Number(c.amount || 0);
            const usedAmt = Number(c.used_amount || 0);
            const remaining = amt - usedAmt;
            const isExpired = c.status === 'expired' || c.expiry_date < nowIso;

            if (!isExpired && remaining > 0) {
                totalRemaining += remaining;
                const eq = c.equipment_type || '기타';
                equipmentMap[eq] = (equipmentMap[eq] || 0) + remaining;
            }
        });

        // 장비별 분포 포맷팅
        const equipmentDistribution = Object.entries(equipmentMap).map(([name, value]) => ({
            name,
            value
        }));

        // 최근 6개월 월 목록 추출
        const now = new Date();
        const activeMonths: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            activeMonths.push(`${d.getMonth() + 1}월`);
        }

        const monthlyTrend = activeMonths.map(month => {
            const data = monthlyMap[month] || { issue: 0, use: 0 };
            return {
                month,
                발행액: data.issue,
                사용액: data.use
            };
        });

        return {
            summary: {
                totalIssued: issued,
                totalUsed: used,
                totalRemaining,
                totalExpired: expired
            },
            equipmentDistribution,
            monthlyTrend
        };
    },

    // 1-2. getCreditEquipmentStats
    async getCreditEquipmentStats(dateRange: string) {
        // 1. 장비별 누적 통계
        const { data: credits, error: credErr } = await supabase
            .from('user_credits')
            .select('equipment_type, amount, used_amount, status, expiry_date');

        if (credErr) throw credErr;

        const equipmentStatsMap: Record<string, { issued: number; used: number; remaining: number; activeCount: number }> = {};
        const nowIso = new Date().toISOString();

        (credits || []).forEach(c => {
            const eq = c.equipment_type || '기타';
            const amt = Number(c.amount || 0);
            const usedAmt = Number(c.used_amount || 0);
            const remaining = amt - usedAmt;
            const isExpired = c.status === 'expired' || c.expiry_date < nowIso;

            if (!equipmentStatsMap[eq]) {
                equipmentStatsMap[eq] = { issued: 0, used: 0, remaining: 0, activeCount: 0 };
            }

            equipmentStatsMap[eq].issued += amt;
            equipmentStatsMap[eq].used += usedAmt;

            if (!isExpired && remaining > 0) {
                equipmentStatsMap[eq].remaining += remaining;
                equipmentStatsMap[eq].activeCount += 1;
            }
        });

        const equipmentList = Object.entries(equipmentStatsMap).map(([name, d]) => {
            const total = d.issued;
            const usageRate = total > 0 ? Number(((d.used / total) * 100).toFixed(1)) : 0;
            return {
                equipmentType: name,
                issued: d.issued,
                used: d.used,
                remaining: d.remaining,
                usageRate,
                activeCount: d.activeCount
            };
        });

        // 2. 장비별 고객(병원) 보유 랭킹
        // user_credits와 users 테이블 조인
        const { data: userCreditsWithUser, error: joinErr } = await supabase
            .from('user_credits')
            .select(`
                equipment_type,
                amount,
                used_amount,
                status,
                expiry_date,
                user:users!user_id (
                    id,
                    name,
                    hospital_name
                )
            `);

        if (joinErr) throw joinErr;

        const hospitalMap: Record<string, Record<string, { remaining: number; hospitalName: string; userName: string }>> = {};

        (userCreditsWithUser || []).forEach((c: any) => {
            const eq = c.equipment_type || '기타';
            const amt = Number(c.amount || 0);
            const usedAmt = Number(c.used_amount || 0);
            const remaining = amt - usedAmt;
            const isExpired = c.status === 'expired' || c.expiry_date < nowIso;
            const userInfo = c.user;

            if (userInfo && !isExpired && remaining > 0) {
                const uId = userInfo.id;
                if (!hospitalMap[eq]) {
                    hospitalMap[eq] = {};
                }
                if (!hospitalMap[eq][uId]) {
                    hospitalMap[eq][uId] = {
                        remaining: 0,
                        hospitalName: userInfo.hospital_name || '일반고객',
                        userName: userInfo.name
                    };
                }
                hospitalMap[eq][uId].remaining += remaining;
            }
        });

        const topHospitals: Record<string, any[]> = {};
        Object.entries(hospitalMap).forEach(([eq, list]) => {
            const sortedList = Object.entries(list).map(([userId, h]) => ({
                userId,
                hospitalName: h.hospitalName,
                userName: h.userName,
                remaining: h.remaining
            })).sort((a, b) => b.remaining - a.remaining); // 전체 리스트 (프론트에서 페이징)

            topHospitals[eq] = sortedList;
        });

        return {
            equipmentList,
            topHospitals
        };
    },

    // 1-3. getCreditExpiryStats
    async getCreditExpiryStats() {
        const now = new Date();
        const nowIso = now.toISOString();

        // 30일, 60일, 90일 후 날짜 계산
        const date30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const date60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
        const date90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

        // user_credits 테이블에서 잔액이 있는 데이터 가져오기
        const { data: credits, error: credErr } = await supabase
            .from('user_credits')
            .select(`
                id,
                equipment_type,
                amount,
                used_amount,
                status,
                expiry_date,
                memo,
                user:users!user_id (
                    name,
                    hospital_name,
                    phone
                )
            `);

        if (credErr) throw credErr;

        let exp30Amt = 0;
        let exp30Count = 0;
        const exp30Hospitals = new Set<string>();

        let exp60Amt = 0;
        let exp60Count = 0;
        const exp60Hospitals = new Set<string>();

        let exp90Amt = 0;
        let exp90Count = 0;
        const exp90Hospitals = new Set<string>();

        const detailedList: any[] = [];

        (credits || []).forEach((c: any) => {
            const amt = Number(c.amount || 0);
            const usedAmt = Number(c.used_amount || 0);
            const remaining = amt - usedAmt;
            const isExpired = c.status === 'expired' || c.expiry_date < nowIso;

            if (!isExpired && remaining > 0) {
                const expiry = c.expiry_date;
                const hospitalId = c.user?.hospital_name || '일반';

                const expDateObj = new Date(expiry);
                const diffTime = expDateObj.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (expiry <= date30) {
                    exp30Amt += remaining;
                    exp30Count += 1;
                    exp30Hospitals.add(hospitalId);
                }
                if (expiry <= date60) {
                    exp60Amt += remaining;
                    exp60Count += 1;
                    exp60Hospitals.add(hospitalId);
                }
                if (expiry <= date90) {
                    exp90Amt += remaining;
                    exp90Count += 1;
                    exp90Hospitals.add(hospitalId);

                    // 90일 이내의 모든 만료 데이터를 상세 리스트에 저장
                    detailedList.push({
                        id: c.id,
                        hospitalName: c.user?.hospital_name || '일반고객',
                        userName: c.user?.name || '비회원',
                        equipmentType: c.equipment_type,
                        remaining,
                        expiryDate: expiry.split('T')[0],
                        phone: c.user?.phone || '-',
                        daysRemaining: diffDays
                    });
                }
            }
        });

        // 만료일 기준 오름차순 정렬 (가장 먼저 만료되는 것부터)
        detailedList.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

        return {
            summary: {
                exp30: { amount: exp30Amt, count: exp30Count, hospitalCount: exp30Hospitals.size },
                exp60: { amount: exp60Amt, count: exp60Count, hospitalCount: exp60Hospitals.size },
                exp90: { amount: exp90Amt, count: exp90Count, hospitalCount: exp90Hospitals.size }
            },
            detailedList
        };
    },

    // 1-4. getCreditTransactionStats
    async getCreditTransactionStats(dateRange: string) {
        const { startDateIso } = this._getSalesRangeAndStatuses(dateRange);

        // 전체 트랜잭션 조회
        const { data: txs, error: txErr } = await supabase
            .from('credit_transactions')
            .select(`
                amount,
                type,
                created_at,
                user:users!user_id (
                    hospital_name
                )
            `)
            .gte('created_at', startDateIso);

        if (txErr) throw txErr;

        const typeMap: Record<string, { amount: number; count: number }> = {
            issue: { amount: 0, count: 0 },
            use: { amount: 0, count: 0 },
            refund: { amount: 0, count: 0 },
            revoke: { amount: 0, count: 0 },
            expire: { amount: 0, count: 0 }
        };

        const dailyMap: Record<string, Record<string, number>> = {};

        (txs || []).forEach(tx => {
            const amt = Number(tx.amount || 0);
            const type = tx.type;
            if (typeMap[type]) {
                typeMap[type].amount += amt;
                typeMap[type].count += 1;
            }

            const date = new Date(tx.created_at);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

            if (!dailyMap[dateStr]) {
                dailyMap[dateStr] = { issue: 0, use: 0, refund: 0, expire: 0, revoke: 0 };
            }
            if (dailyMap[dateStr][type] !== undefined) {
                dailyMap[dateStr][type] += amt;
            }
        });

        // 최근 15일 일별 날짜 리스트 생성
        const now = new Date();
        const activeDays: string[] = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            activeDays.push(`${d.getMonth() + 1}/${d.getDate()}`);
        }

        const trendData = activeDays.map(day => {
            const data = dailyMap[day] || { issue: 0, use: 0, refund: 0, expire: 0, revoke: 0 };
            return {
                day,
                발행액: data.issue,
                사용액: data.use,
                환불액: data.refund,
                만료액: data.expire,
                회수액: data.revoke
            };
        });

        return {
            typeSummary: {
                issue: typeMap.issue,
                use: typeMap.use,
                refund: typeMap.refund,
                revoke: typeMap.revoke,
                expire: typeMap.expire
            },
            trendData,
            leadTimeAnalysis: {
                avgUseDays: 12.4,
                avgExhaustDays: 45.2
            }
        };
    },

    // =========================================================
    // 교육 일정 관리 (education_schedules 테이블)
    // =========================================================

    /** 교육 일정 목록 조회 */
    async getEducationSchedules() {
        const { data, error } = await supabase
            .from('education_schedules')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id as string,
            date: row.date as string,
            equipment: row.equipment as string,
            time: row.time as string,
            location: row.location as string,
            capacity: Number(row.capacity),
            enrolled: Number(row.enrolled),
            instructor: row.instructor as string,
            status: row.status as 'scheduled' | 'completed' | 'cancelled',
            type: row.type as 'education' | 'seminar',
            description: (row.description || '') as string,
        }));
    },

    /** 교육 일정 등록 */
    async createEducationSchedule(data: {
        date: string;
        equipment: string;
        time: string;
        location: string;
        capacity: number;
        enrolled: number;
        instructor: string;
        status: 'scheduled' | 'completed' | 'cancelled';
        type: 'education' | 'seminar';
        description?: string;
    }) {
        const { data: inserted, error } = await supabase
            .from('education_schedules')
            .insert(data)
            .select('*')
            .single();

        if (error) throw error;
        return inserted;
    },

    /** 교육 일정 수정 */
    async updateEducationSchedule(
        id: string,
        data: Partial<{
            date: string;
            equipment: string;
            time: string;
            location: string;
            capacity: number;
            enrolled: number;
            instructor: string;
            status: 'scheduled' | 'completed' | 'cancelled';
            type: 'education' | 'seminar';
            description: string;
        }>
    ) {
        const { error } = await supabase
            .from('education_schedules')
            .update(data)
            .eq('id', id);

        if (error) throw error;
    },

    /** 교육 일정 삭제 */
    async deleteEducationSchedule(id: string) {
        const { error } = await supabase
            .from('education_schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // =========================================================
    // 교육 신청 내역 관리 (education_requests 테이블)
    // =========================================================

    /** 내 교육 신청 내역 조회 (로그인 유저 기준) */
    async getMyEducationRequests() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('education_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id as string,
            equipment: row.equipment as string,
            requestDate: (row.created_at as string).split('T')[0],
            preferredDate: row.preferred_date as string | null,
            scheduledDate: row.scheduled_date as string | undefined,
            content: row.content as string,
            status: row.status as 'pending' | 'scheduled' | 'completed' | 'cancelled',
        }));
    },

    /** 교육 신청 등록 */
    async createEducationRequest(data: {
        schedule_id: string;
        equipment: string;
        preferred_date?: string;
        content: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        // 동일 일정 중복 신청 방지
        const { data: existing } = await supabase
            .from('education_requests')
            .select('id')
            .eq('user_id', user.id)
            .eq('schedule_id', data.schedule_id)
            .neq('status', 'cancelled')
            .limit(1);

        if (existing && existing.length > 0) {
            throw new Error('이미 신청한 일정입니다.');
        }

        const { error } = await supabase
            .from('education_requests')
            .insert({
                user_id: user.id,
                schedule_id: data.schedule_id,
                equipment: data.equipment,
                preferred_date: data.preferred_date || null,
                content: data.content,
                status: 'pending',
            });

        if (error) throw error;
    },

    /** [관리자] 전체 교육 신청 내역 조회 */
    async getAllEducationRequests() {
        const { data, error } = await supabase
            .from('education_requests')
            .select(`
                *,
                user:users (
                    name,
                    hospital_name,
                    phone
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id as string,
            equipment: row.equipment as string,
            requestDate: (row.created_at as string).split('T')[0],
            preferredDate: row.preferred_date as string | null,
            scheduledDate: row.scheduled_date as string | undefined,
            content: row.content as string,
            status: row.status as 'pending' | 'scheduled' | 'completed' | 'cancelled',
            user: row.user ? {
                name: row.user.name as string,
                hospitalName: row.user.hospital_name as string,
                phone: row.user.phone as string,
            } : null,
        }));
    },

    /** [관리자] 교육 신청 상태 업데이트 */
    async updateEducationRequestStatus(
        id: string,
        status: 'pending' | 'scheduled' | 'completed' | 'cancelled',
        scheduledDate?: string
    ) {
        const { error } = await supabase
            .from('education_requests')
            .update({
                status,
                scheduled_date: scheduledDate || null,
            })
            .eq('id', id);

        if (error) throw error;
    },

    /** [관리자] 전체 크레딧 거래 내역 조회 (페이징, 검색, 필터 포함) */
    async getAllCreditTransactions(page: number, limit: number, search: string, type: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from('credit_transactions')
            .select(`
                *,
                user:users!user_id (
                    id,
                    name,
                    hospital_name,
                    email,
                    login_id
                ),
                order:orders!order_id (
                    id,
                    order_number
                ),
                credit:user_credits!credit_id (
                    equipment_type
                )
            `, { count: 'exact' });

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        if (startDate) {
            const sDate = new Date(`${startDate}T00:00:00`);
            query = query.gte('created_at', sDate.toISOString());
        }
        if (endDate) {
            const eDate = new Date(`${endDate}T23:59:59.999`);
            query = query.lte('created_at', eDate.toISOString());
        }

        // 검색어 필터링
        if (search) {
            const { data: matchedUsers, error: userErr } = await supabase
                .from('users')
                .select('id')
                .or(`name.ilike.%${search}%,hospital_name.ilike.%${search}%,email.ilike.%${search}%,login_id.ilike.%${search}%`);

            if (userErr) throw userErr;

            const userIds = (matchedUsers || []).map(u => u.id);
            if (userIds.length > 0) {
                query = query.in('user_id', userIds);
            } else {
                return { data: [], total: 0 };
            }
        }

        let finalQuery = query.order('created_at', { ascending: false });
        if (page > 0) {
            const startRange = (page - 1) * limit;
            const endRange = page * limit - 1;
            finalQuery = finalQuery.range(startRange, endRange);
        }

        const { data, count, error } = await finalQuery;
        if (error) throw error;

        return {
            data: data || [],
            total: count || 0
        };
    },

    /** [관리자] 전체 포인트 거래 내역 조회 (페이징, 검색, 필터 포함) */
    async getAllPointTransactions(page: number, limit: number, search: string, type: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from('point_transactions')
            .select(`
                *,
                user:users!user_id (
                    id,
                    name,
                    hospital_name,
                    email,
                    login_id
                ),
                order:orders!order_id (
                    id,
                    order_number
                )
            `, { count: 'exact' });

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        if (startDate) {
            const sDate = new Date(`${startDate}T00:00:00`);
            query = query.gte('created_at', sDate.toISOString());
        }
        if (endDate) {
            const eDate = new Date(`${endDate}T23:59:59.999`);
            query = query.lte('created_at', eDate.toISOString());
        }

        // 검색어 필터링
        if (search) {
            const { data: matchedUsers, error: userErr } = await supabase
                .from('users')
                .select('id')
                .or(`name.ilike.%${search}%,hospital_name.ilike.%${search}%,email.ilike.%${search}%,login_id.ilike.%${search}%`);

            if (userErr) throw userErr;

            const userIds = (matchedUsers || []).map(u => u.id);
            if (userIds.length > 0) {
                query = query.in('user_id', userIds);
            } else {
                return { data: [], total: 0 };
            }
        }

        let finalQuery = query.order('created_at', { ascending: false });
        if (page > 0) {
            const startRange = (page - 1) * limit;
            const endRange = page * limit - 1;
            finalQuery = finalQuery.range(startRange, endRange);
        }

        const { data, count, error } = await finalQuery;
        if (error) throw error;

        return {
            data: data || [],
            total: count || 0
        };
    },
};

