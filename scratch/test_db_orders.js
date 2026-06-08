import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbtnhnkwlioufpyeuyyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
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
            `);
            
        if (error) {
            console.error('Query Error:', error);
            return;
        }
        
        console.log('Total Orders fetched:', orders?.length);
        const itemSample = orders?.[0]?.order_items;
        console.log('Sample Order Items:', itemSample ? itemSample.slice(0, 2) : 'none');
        if (itemSample?.[0]) {
            console.log('Sample Product joined:', itemSample[0].product);
        }
        
        // Count categories
        const categoryMap = {};
        orders?.forEach(order => {
            order.order_items?.forEach(item => {
                const cat = item.product?.category || '기타소모품';
                categoryMap[cat] = (categoryMap[cat] || 0) + (item.total_price || (item.unit_price * item.quantity));
            });
        });
        console.log('Category Sales Distribution:', categoryMap);

    } catch (e) {
        console.error('Error:', e);
    }
}
test();
