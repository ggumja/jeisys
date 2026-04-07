const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Config from .env (since I can't use process.env directly in simple node run without dotenv)
const supabaseUrl = 'https://xbtnhnkwlioufpyeuyyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCSV() {
  const csvPath = '/Users/daniel/Documents/jeisys/docs/wc-product-export-7-4-2026-1775542269995.csv';
  const content = fs.readFileSync(csvPath, 'utf8');

  // Simple CSV parser for quoted fields with newlines
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quote inside quotes
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentField += char;
    }
  }
  
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  // Skip header
  const header = rows[0];
  const products = rows.slice(1);

  console.log(`Found ${products.length} products to import.`);

  let successCount = 0;
  let errorCount = 0;

  for (const row of products) {
    if (row.length < 2) continue;

    const [skuRaw, name, description, priceRaw, categoryRaw] = row;
    
    // Auto-generate SKU if empty: PROD-Name Hash
    const sku = skuRaw || `PROD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const price = parseFloat(priceRaw.replace(/,/g, '')) || 0;
    
    // Handle category/subcategory
    let category = categoryRaw || 'Uncategorized';
    let subcategory = null;
    
    if (category.includes('>')) {
      const parts = category.split('>').map(p => p.trim());
      category = parts[0];
      subcategory = parts[1];
    } else if (category.includes(',')) {
      // Use first one as main category
      const parts = category.split(',').map(p => p.trim());
      category = parts[0];
      // Keep others? Maybe just use first for now as per previous logic
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          sku,
          name,
          description,
          price,
          category,
          subcategory,
          stock: 100, // Default stock
          is_active: true,
          is_package: name.toLowerCase().includes('패키지') || name.toLowerCase().includes('package')
        })
        .select();

      if (error) {
        console.error(`Error importing ${name} (${sku}):`, error.message);
        errorCount++;
      } else {
        console.log(`Imported: ${name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception importing ${name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`--- Import Finished ---`);
  console.log(`Success: ${successCount}`);
  console.log(`Error: ${errorCount}`);
}

importCSV();
