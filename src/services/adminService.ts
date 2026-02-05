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

        return {
            monthSales,
            monthOrderCount,
            totalUsers: userCount || 0,
            newUsers: 0,
            pendingUsers: pendingUserCount || 0,
            lowStockProducts: lowStockCount || 0,
            totalProducts: totalProducts || 0
        };
    },

    // Orders
    async getOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        user:users(name, hospital_name, phone),
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

    async updateOrderStatus(orderId: string, status: string) {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);

        if (error) throw error;
    },

    // Users
    async getUsers() {
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;

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

        return users.map((user: any) => {
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
                grade: grade,
                status: user.approval_status === 'APPROVED' ? 'active' : (user.approval_status === 'PENDING' ? 'pending' : 'suspended'),
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
