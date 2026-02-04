-- ============================================
-- Verify Database Data
-- ============================================
-- This script checks if data exists in tables
-- ============================================

-- Check products
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products;

-- Check equipments
SELECT 'Equipments' as table_name, COUNT(*) as count FROM public.equipments;

-- Check product compatibility
SELECT 'Product Compatibility' as table_name, COUNT(*) as count FROM public.product_compatibility;

-- Check pricing tiers
SELECT 'Pricing Tiers' as table_name, COUNT(*) as count FROM public.product_pricing_tiers;

-- Check users
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users;

-- Show sample products
SELECT id, sku, name, category, price, stock, is_active 
FROM public.products 
LIMIT 5;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('products', 'equipments', 'users')
ORDER BY tablename;
