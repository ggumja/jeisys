-- ============================================
-- Check Product Registration
-- ============================================
-- This script checks if products were created
-- and verifies RLS policies
-- ============================================

-- 1. Check if products exist in database
SELECT 'Total Products in DB:' as info, COUNT(*) as count FROM public.products;

-- 2. Show recently created products
SELECT 
    id,
    sku,
    name,
    category,
    price,
    stock,
    is_active,
    created_at
FROM public.products
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check RLS policies on products table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'products'
ORDER BY policyname;

-- 4. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'products';

-- 5. Test query as authenticated user would see
-- (This simulates what the frontend sees)
SELECT 
    'Products visible to authenticated users:' as info,
    COUNT(*) as count
FROM public.products
WHERE is_active = true;
