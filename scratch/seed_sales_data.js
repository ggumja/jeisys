import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://xbtnhnkwlioufpyeuyyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidG5obmt3bGlvdWZweWV1eXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTMxMjQsImV4cCI6MjA4NTc2OTEyNH0.S-QtJpDDv096gs6u4rjGaMQvFD7LhAyZHAo8RL0L9fk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('=== Starting Sales Seeding Process ===');
    const adminEmail = 'admin@jeisys.com';
    const adminPassword = 'adminpassword123';
    let userId = null;

    // 1. Sign Up or Sign In Admin
    try {
        const uniqueId = 'admin_' + Math.random().toString(36).substring(2, 7);
        const adminEmail = `${uniqueId}@jeisys.com`;
        const adminPassword = 'adminpassword123!';

        console.log('Registering unique Admin user:', adminEmail);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
                data: {
                    name: '최고관리자',
                    hospital_name: '제이시스 본사',
                    login_id: uniqueId
                }
            }
        });

        if (signUpError) {
            throw new Error('Admin registration failed: ' + signUpError.message);
        }
        userId = signUpData.user?.id;
        console.log('Admin Registered Successfully! ID:', userId);

        // Establish Session by signing in
        const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
        });
        if (sessionErr) throw sessionErr;
        console.log('Admin Logged In successfully.');

        // Create Admin profile in public.users table
        console.log('Creating Admin profile in public.users...');
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: userId,
                login_id: uniqueId,
                email: adminEmail,
                name: '최고관리자',
                hospital_name: '제이시스 본사',
                role: 'admin'
            });
        if (profileError) throw profileError;
        console.log('Admin profile created with role admin.');

    } catch (err) {
        console.error('Error authenticating admin:', err);
        return;
    }

    // 2. Import products from CSV
    const productIds = [];
    try {
        const csvPath = '/Users/daniel/Documents/jeisys/docs/wc-product-export-7-4-2026-1775542269995.csv';
        if (!fs.existsSync(csvPath)) {
            throw new Error('Product CSV file not found.');
        }

        console.log('Reading CSV products...');
        const content = fs.readFileSync(csvPath, 'utf8');

        // Parse CSV rows
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

        const csvProducts = rows.slice(1);
        console.log(`Found ${csvProducts.length} products to upsert.`);

        for (const row of csvProducts) {
            if (row.length < 2) continue;
            const [skuRaw, name, description, priceRaw, categoryRaw] = row;
            const sku = skuRaw || `PROD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
            const price = parseFloat(priceRaw.replace(/,/g, '')) || 50000; // Default price
            
            let category = categoryRaw || '소모품';
            let subcategory = null;
            if (category.includes('>')) {
                const parts = category.split('>').map(p => p.trim());
                category = parts[0];
                subcategory = parts[1];
            } else if (category.includes(',')) {
                category = category.split(',')[0].trim();
            }

            // Check if product exists by SKU
            const { data: existingProd } = await supabase.from('products').select('id').eq('sku', sku).maybeSingle();
            if (existingProd) {
                productIds.push(existingProd.id);
            } else {
                const { data: newProd, error: prodErr } = await supabase
                    .from('products')
                    .insert({
                        sku,
                        name,
                        description,
                        price,
                        category,
                        subcategory,
                        stock: 200,
                        is_active: true
                    })
                    .select()
                    .single();

                if (prodErr) {
                    console.error(`Error inserting product ${name}:`, prodErr.message);
                } else if (newProd) {
                    productIds.push(newProd.id);
                    console.log(`Created product: ${name} (${sku})`);
                }
            }
        }
    } catch (err) {
        console.error('Error seeding products:', err);
        return;
    }

    if (productIds.length === 0) {
        console.error('No products available for generating orders.');
        return;
    }

    // 3. Clean up existing test orders
    try {
        console.log('Cleaning up old test orders...');
        const { data: oldOrders } = await supabase.from('orders').select('id').like('order_number', 'ORD-%');
        if (oldOrders && oldOrders.length > 0) {
            const oldOrderIds = oldOrders.map(o => o.id);
            // Delete order items first (cascade should work, but to be safe)
            await supabase.from('order_items').delete().in('order_id', oldOrderIds);
            await supabase.from('orders').delete().in('id', oldOrderIds);
            console.log(`Deleted ${oldOrders.length} old test orders.`);
        }
    } catch (err) {
        console.warn('Cleanup warning:', err);
    }

    // 4. Generate ~120 Mock Orders distributed across the last 6 months
    console.log('Generating mock order transactions...');
    const now = new Date();
    const paymentMethods = ['virtual', 'transfer', 'credit', 'general', 'split', 'partial_card'];
    const statuses = ['paid', 'processing', 'shipped', 'delivered'];
    
    // Define probability distribution for payment methods to make charts look realistic
    // 0: virtual (가상계좌) - 15%
    // 1: transfer (무통장입금) - 20%
    // 2: credit (신용카드 저장) - 30%
    // 3: general (일반 신용카드) - 20%
    // 4: split (카드분할) - 10%
    // 5: partial_card (일부카드) - 5%
    const getWeightedPaymentMethod = () => {
        const rand = Math.random();
        if (rand < 0.15) return 'virtual';
        if (rand < 0.35) return 'transfer';
        if (rand < 0.65) return 'credit';
        if (rand < 0.85) return 'general';
        if (rand < 0.95) return 'split';
        return 'partial_card';
    };

    let createdOrdersCount = 0;
    const totalOrdersToGenerate = 120;

    for (let i = 0; i < totalOrdersToGenerate; i++) {
        // Distribute dates over last 180 days
        const daysAgo = Math.floor(Math.random() * 180);
        const orderDate = new Date();
        orderDate.setDate(now.getDate() - daysAgo);

        // Realistic hours: highly active between 09:00 - 18:00
        let hour = 9 + Math.floor(Math.random() * 9); // default office hours
        if (Math.random() < 0.2) {
            hour = Math.floor(Math.random() * 24); // off hours
        }
        orderDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

        const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(i).padStart(4, '0')}`;
        
        // Randomly pick 1 to 3 items
        const numItems = 1 + Math.floor(Math.random() * 3);
        const selectedItems = [];
        let orderTotalAmount = 0;

        for (let k = 0; k < numItems; k++) {
            const randomProdId = productIds[Math.floor(Math.random() * productIds.length)];
            // Fetch product price (we need a realistic price, so we mock it or fetch it)
            // To make it simple, we query local cache or just fetch a random sample price
            // Let's assume average product price is around 80,000 - 1,200,000 won
            const prices = [80000, 150000, 350000, 600000, 1200000];
            const price = prices[Math.floor(Math.random() * prices.length)];
            const quantity = 1 + Math.floor(Math.random() * 4);
            const itemTotal = price * quantity;

            selectedItems.push({
                product_id: randomProdId,
                quantity,
                unit_price: price,
                total_price: itemTotal
            });
            orderTotalAmount += itemTotal;
        }

        // Insert Order
        const paymentMethod = getWeightedPaymentMethod();
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const { data: newOrder, error: orderErr } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                order_number: orderNumber,
                status,
                total_amount: orderTotalAmount,
                payment_method: paymentMethod,
                delivery_address: '서울특별시 강남구 테헤란로 123 제이시스타워 10층',
                ordered_at: orderDate.toISOString(),
                updated_at: orderDate.toISOString()
            })
            .select()
            .single();

        if (orderErr) {
            console.error(`Failed to insert order ${orderNumber}:`, orderErr.message);
            continue;
        }

        if (newOrder) {
            // Insert Order Items
            const itemsToInsert = selectedItems.map(item => ({
                order_id: newOrder.id,
                ...item
            }));

            const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
            if (itemsErr) {
                console.error(`Failed to insert items for order ${orderNumber}:`, itemsErr.message);
            } else {
                createdOrdersCount++;
            }
        }
    }

    console.log(`=== Seeding Completed ===`);
    console.log(`Total orders successfully seeded: ${createdOrdersCount} / ${totalOrdersToGenerate}`);
}

seed();
