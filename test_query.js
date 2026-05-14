import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data, error } = await supabase
        .from('order_items')
        .select(`
            quantity, unit_price,
            order:orders!inner(status, ordered_at),
            product:products(name, category)
        `)
        .gte('order.ordered_at', startOfMonth)
        .neq('order.status', 'cancelled');
    
    console.log(error);
    console.log(data ? data.slice(0, 2) : null);
}
test();
