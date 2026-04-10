
const { createClient } = require('@supabase/supabase-js');

const URL = 'https://xbtnhnkwlioufpyeuyyg.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk';

const supabase = createClient(URL, KEY);

async function cleanup() {
  console.log('Fetching categories with supabase-js...');
  const { data: categories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name');
    
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  
  const targets = categories.filter(c => c.name.includes('프로모션'));
  console.log('Found targets:', targets);

  for (const cat of targets) {
    let newName = cat.name.replace(' 프로모션', '').trim();
    console.log(`Updating ID ${cat.id} (${cat.name}) to "${newName}"...`);
    
    const { data, error } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', cat.id)
      .select();
      
    if (error) {
      console.error(`Error updating ID ${cat.id}:`, error.message);
    } else {
      console.log(`Successfully updated ID ${cat.id}. Result:`, data);
    }
  }
  
  console.log('Cleanup complete.');
}

cleanup().catch(console.error);
