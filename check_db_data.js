import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
  const productId = '153b7500-8110-4bc9-958d-9b9b414e07ad';
  
  console.log('--- Product Options ---');
  const { data: options } = await supabase
    .from('product_quantity_options')
    .select('*')
    .eq('product_id', productId);
  console.log(options);

  console.log('--- Bonus Items ---');
  const { data: bonusItems } = await supabase
    .from('product_bonus_items')
    .select('*')
    .eq('parent_product_id', productId);
  console.log(bonusItems);
}

checkData();
