const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xbtnhnkwlioufpyeuyyg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('orders').select('id, order_number, status').eq('order_number', 'DUM-799066');
  console.log('Order status:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

check();
