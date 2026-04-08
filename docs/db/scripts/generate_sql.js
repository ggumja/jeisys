const fs = require('fs');

function generateSQL() {
  const csvPath = '/Users/daniel/Documents/jeisys/docs/wc-product-export-7-4-2026-1775542269995.csv';
  const content = fs.readFileSync(csvPath, 'utf8');

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
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

  const products = rows.slice(1);
  let sql = '-- Product Import SQL\n';
  sql += 'INSERT INTO public.products (sku, name, description, price, category, subcategory, stock, is_active, is_package) VALUES\n';

  const values = [];
  for (const row of products) {
    if (row.length < 2) continue;

    const [skuRaw, nameRaw, descriptionRaw, priceRaw, categoryRaw] = row;
    
    const sku = skuRaw || `PROD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const name = nameRaw.replace(/'/g, "''");
    const description = (descriptionRaw || '').replace(/'/g, "''");
    const price = parseFloat(priceRaw.replace(/,/g, '')) || 0;
    
    let category = (categoryRaw || 'Uncategorized').replace(/'/g, "''");
    let subcategory = null;
    
    if (category.includes('>')) {
      const parts = category.split('>').map(p => p.trim());
      category = parts[0];
      subcategory = `'${parts[1].replace(/'/g, "''")}'`;
    } else if (category.includes(',')) {
      const parts = category.split(',').map(p => p.trim());
      category = parts[0];
    }
    
    const isPackage = name.toLowerCase().includes('패키지') || name.toLowerCase().includes('package');
    
    values.push(`('${sku}', '${name}', '${description}', ${price}, '${category}', ${subcategory}, 100, true, ${isPackage})`);
  }

  sql += values.join(',\n') + ';\n';
  fs.writeFileSync('/Users/daniel/Documents/jeisys/import_products.sql', sql);
  console.log('SQL generated: import_products.sql');
}

generateSQL();
