
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBonusItems() {
  const productId = 'f4829e92-1bb0-4001-9d5c-74d88808a86f';
  
  const { data, error } = await supabase
    .from('product_bonus_items')
    .select('*, product:products!bonus_product_id(*)')
    .eq('parent_product_id', productId);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Bonus Items for', productId, ':', JSON.stringify(data, null, 2));
}

checkBonusItems();
