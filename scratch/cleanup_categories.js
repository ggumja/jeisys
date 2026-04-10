
const URL = 'https://xbtnhnkwlioufpyeuyyg.supabase.co/rest/v1/categories';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk';

async function cleanup() {
  console.log('Fetching categories...');
  const res = await fetch(`${URL}?select=id,name`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  const categories = await res.json();
  
  const targets = categories.filter(c => c.name.includes('프로모션'));
  console.log('Found targets:', targets);

  for (const cat of targets) {
    let newName = cat.name.replace(' 프로모션', '').trim();
    console.log(`Updating ${cat.name} (${cat.id}) to ${newName}...`);
    
    const patchRes = await fetch(`${URL}?id=eq.${cat.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ name: newName })
    });
    
    const result = await patchRes.json();
    console.log('Result:', result);
  }
  
  console.log('Cleanup complete.');
}

cleanup().catch(console.error);
