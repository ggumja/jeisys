import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkOrder(orderNumber: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        product:products (name)
      )
    `)
    .eq('order_number', orderNumber)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return;
  }

  console.log('Order Data:', JSON.stringify(data, null, 2));
}

checkOrder('DUM-799066');
