const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(urlMatch[1], keyMatch[1]);

async function main() {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('order_number', 'ORD-1778554226200-777')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated:', data);
  }
}

main();
