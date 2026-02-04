const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper to generate UUID
const uuidv4 = () => crypto.randomUUID();

// --- 1. Master Data: Equipment Models ---
// Derived from mockEquipment and inferred knowledge
const equipmentModels = [
    { id: uuidv4(), name: 'ULTRAcel Q+', code: 'ULTRACEL-Q', category: 'HIFU', imageUrl: 'ultracelQPlus' },
    { id: uuidv4(), name: 'POTENZA', code: 'POTENZA', category: 'RF Microneedling', imageUrl: 'potenza' },
    { id: uuidv4(), name: 'INTRAcel', code: 'INTRACEL', category: 'RF Needle', imageUrl: 'intracel' },
    { id: uuidv4(), name: 'DLiv', code: 'DLIV', category: 'Infusion', imageUrl: 'dliv' },
    { id: uuidv4(), name: 'LinearZ', code: 'LINEARZ', category: 'HIFU', imageUrl: 'linearz' }, // Added for completeness based on productImages
];

// Helper to find equipment ID by name or partial match
const findEquipId = (search) => {
    if (!search) return null;
    const eq = equipmentModels.find(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        (search.includes('ULTRACEL') && e.code === 'ULTRACEL-Q')
    );
    return eq ? eq.id : null;
};

// --- 2. Products Data (from mockData.ts) ---
const productsData = [
    {
        sku: "CART-ULTRA-1.5MM",
        name: "ULTRAcel 카트리지 1.5mm",
        category: "Density",
        subcategory: "클래식팁 프로모션",
        compatibleWith: ["ULTRACEL-Q"],
        price: 85000,
        stock: 25,
        description: "ULTRAcel 전용 1.5mm 카트리지. 표피층 타겟팅",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 85000 },
            { quantity: 3, unitPrice: 82000 },
            { quantity: 5, unitPrice: 80000 },
        ]
    },
    {
        sku: "CART-ULTRA-3.0MM",
        name: "ULTRAcel 카트리지 3.0mm",
        category: "Density",
        subcategory: "하이팁 프로모션",
        compatibleWith: ["ULTRACEL-Q"],
        price: 88000,
        stock: 30,
        description: "ULTRAcel 전용 3.0mm 카트리지. 진피층 타겟팅",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 88000 },
            { quantity: 3, unitPrice: 85000 },
            { quantity: 5, unitPrice: 83000 },
        ]
    },
    {
        sku: "CART-ULTRA-4.5MM",
        name: "ULTRAcel 카트리지 4.5mm",
        category: "Density",
        subcategory: "클래식/하이 페이스팁 300샷 프로모션",
        compatibleWith: ["ULTRACEL-Q"],
        price: 92000,
        stock: 28,
        description: "ULTRAcel 전용 4.5mm 카트리지. SMAS층 리프팅",
        imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 92000 },
            { quantity: 3, unitPrice: 89000 },
            { quantity: 5, unitPrice: 87000 },
        ]
    },
    {
        sku: "DLIV-INJECTOR-20",
        name: "DLiv 전용 인젝터 20 SET",
        category: "DLiv",
        compatibleWith: ["DLIV"],
        price: 198000,
        stock: 40,
        description: "DLiv 전용 인젝터 20개 세트. 주사기 및 각종 부속품 포함",
        imageUrl: "https://images.unsplash.com/photo-1585828922344-f5a0c8c56a9d?w=400", // Placeholder
        tierPricing: [
            { quantity: 1, unitPrice: 198000 },
            { quantity: 5, unitPrice: 195000 },
            { quantity: 10, unitPrice: 190000 },
        ]
    },
    {
        sku: "DLIV-PUMPING-16",
        name: "DLiv 전용 PUMPING 16 팁 10SET",
        category: "DLiv",
        compatibleWith: ["DLIV"],
        price: 250000,
        stock: 35,
        description: "DLiv PUMPING-16 10개 세트. 펌핑 헤드 및 주사기 포함",
        imageUrl: "https://images.unsplash.com/photo-1585828922344-f5a0c8c56a9d?w=400", // Placeholder
        tierPricing: [
            { quantity: 1, unitPrice: 250000 },
            { quantity: 5, unitPrice: 245000 },
            { quantity: 10, unitPrice: 240000 },
        ]
    },
    {
        sku: "DLIV-PUMPING-25",
        name: "DLiv 전용 PUMPING 25 팁 10SET",
        category: "DLiv",
        compatibleWith: ["DLIV"],
        price: 250000,
        stock: 30,
        description: "DLiv PUMPING-25 10개 세트. 대용량 펌핑 헤드 및 주사기 포함",
        imageUrl: "https://images.unsplash.com/photo-1585828922344-f5a0c8c56a9d?w=400", // Placeholder
        tierPricing: [
            { quantity: 1, unitPrice: 250000 },
            { quantity: 5, unitPrice: 245000 },
            { quantity: 10, unitPrice: 240000 },
        ]
    },
    {
        sku: "PTZ-DIAMOND",
        name: "POTENZA Diamond tip",
        category: "POTENZA",
        compatibleWith: ["POTENZA"],
        price: 95000,
        stock: 30,
        description: "한샷에 모노폴라와 바이폴라, 교차 조사 • Monopola + Bipolar",
        imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400", // Placeholder
        tierPricing: [
            { quantity: 1, unitPrice: 95000 },
            { quantity: 5, unitPrice: 92000 },
            { quantity: 10, unitPrice: 90000 },
        ]
    },
    {
        sku: "PTZ-DDR",
        name: "POTENZA DDR tip",
        category: "POTENZA",
        compatibleWith: ["POTENZA"],
        price: 88000,
        stock: 35,
        description: "Multiple pulse를 이용한 Dermal Heating • Bipolar / 2MHz",
        imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 88000 },
            { quantity: 5, unitPrice: 85000 },
            { quantity: 10, unitPrice: 83000 },
        ]
    },
    {
        sku: "PTZ-SFA",
        name: "POTENZA SFA tip",
        category: "POTENZA",
        compatibleWith: ["POTENZA"],
        price: 92000,
        stock: 28,
        description: "한샷에 모노폴라와 바이폴라, 교차 조사 • Monopola + Bipolar",
        imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 92000 },
            { quantity: 5, unitPrice: 89000 },
            { quantity: 10, unitPrice: 87000 },
        ]
    },
    {
        sku: "TIP-INTRACEL-49P",
        name: "INTRAcel 49핀 팁",
        category: "INTRAcel",
        compatibleWith: ["INTRACEL"],
        price: 78000,
        stock: 32,
        description: "INTRAcel 49핀 팁. 여드름 흉터 치료",
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 78000 },
            { quantity: 5, unitPrice: 75000 },
            { quantity: 10, unitPrice: 73000 },
        ]
    },
    // Common items (Compatible with multiple or none specifically)
    {
        sku: "GEL-ULTRA-500",
        name: "초음파 전용 젤 500ml",
        category: "기타소모품",
        compatibleWith: ["ULTRACEL-Q", "POTENZA", "INTRACEL"],
        price: 35000,
        stock: 200,
        description: "HIFU 장비 전용 고품질 초음파 젤",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 35000 },
            { quantity: 10, unitPrice: 33000 },
            { quantity: 20, unitPrice: 31000 },
        ]
    },
    {
        sku: "CLEAN-MULTI-200",
        name: "다목적 클리닝 솔루션 200ml",
        category: "기타소모품",
        compatibleWith: ["ULTRACEL-Q", "POTENZA", "INTRACEL"],
        price: 28000,
        stock: 150,
        description: "모든 의료 기기에 사용 가능한 전문 클리닝 제품",
        imageUrl: "https://images.unsplash.com/photo-1585828922344-f5a0c8c56a9d?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 28000 },
            { quantity: 10, unitPrice: 26000 },
            { quantity: 20, unitPrice: 24000 },
        ]
    },
    {
        sku: "MASK-RECOVERY-10",
        name: "시술 후 진정 마스크 (10매)",
        category: "기타소모품",
        compatibleWith: [],
        price: 45000,
        stock: 80,
        description: "시술 후 피부 진정 및 회복을 위한 전문 마스크팩",
        imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 45000 },
            { quantity: 5, unitPrice: 43000 },
            { quantity: 10, unitPrice: 40000 },
        ]
    },
    {
        sku: "NUMB-CREAM-30G",
        name: "마취 크림 30g",
        category: "기타소모품",
        compatibleWith: [],
        price: 55000,
        stock: 60,
        description: "시술 전 도포용 국소 마취 크림",
        imageUrl: "https://images.unsplash.com/photo-1631549576707-5d5428a0e3d5?w=400",
        tierPricing: [
            { quantity: 1, unitPrice: 55000 },
            { quantity: 5, unitPrice: 52000 },
            { quantity: 10, unitPrice: 50000 },
        ]
    }
];

// --- Generation Logic ---

let sql = `-- Seed data generated on ${new Date().toISOString()}\n\n`;

// 1. Equipments
sql += `-- 1. Equipments\n`;
equipmentModels.forEach(eq => {
    sql += `INSERT INTO public.equipments (id, model_name, code, category) VALUES ('${eq.id}', '${eq.name}', '${eq.code}', '${eq.category}');\n`;
});
sql += `\n`;

// 2. Products & Relations
sql += `-- 2. Products, Compatibilities, PricingTiers, Images\n`;

productsData.forEach(prod => {
    const prodId = uuidv4();

    // Product
    const descRaw = prod.description.replace(/'/g, "''"); // Escape single quotes
    sql += `INSERT INTO public.products (id, sku, name, category, subcategory, description, price, stock) VALUES ('${prodId}', '${prod.sku}', '${prod.name}', '${prod.category}', '${prod.subcategory || ''}', '${descRaw}', ${prod.price}, ${prod.stock});\n`;

    // Compatibility
    if (prod.compatibleWith && prod.compatibleWith.length > 0) {
        prod.compatibleWith.forEach(compName => {
            const eqId = findEquipId(compName);
            if (eqId) {
                sql += `INSERT INTO public.product_compatibility (product_id, equipment_id) VALUES ('${prodId}', '${eqId}');\n`;
            }
        });
    }

    // Pricing Tiers
    if (prod.tierPricing) {
        prod.tierPricing.forEach(tier => {
            sql += `INSERT INTO public.product_pricing_tiers (product_id, min_quantity, unit_price) VALUES ('${prodId}', ${tier.quantity}, ${tier.unitPrice});\n`;
        });
    }

    // Product Image (Main)
    if (prod.imageUrl) {
        sql += `INSERT INTO public.product_images (product_id, image_url, display_order) VALUES ('${prodId}', '${prod.imageUrl}', 0);\n`;
    }
});

// Output file
const outputPath = path.join(__dirname, '../supabase/seed.sql');
fs.writeFileSync(outputPath, sql);
console.log(`Seed file generated at: ${outputPath}`);
