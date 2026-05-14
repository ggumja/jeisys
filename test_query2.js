import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
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
    console.log(error);
    console.log(data ? data.length : null);
}
test();
