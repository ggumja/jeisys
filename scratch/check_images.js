import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbtnhnkwlioufpyeuyyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCount() {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total Products Count:', count);
  }
}

checkCount();
