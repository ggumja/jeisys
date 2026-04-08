-- ============================================
-- Complete RLS Fix - Remove All Recursion
-- ============================================
-- This fixes the infinite recursion by fixing
-- BOTH users table AND products table policies
-- ============================================

-- STEP 1: Fix USERS table policies (root cause)
-- ============================================

-- Drop all existing policies on users
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create simple, non-recursive policies for users
-- Allow users to view their own data
CREATE POLICY "Users can view own data" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" 
ON public.users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- STEP 2: Fix PRODUCTS and related tables
-- ============================================

-- Disable RLS temporarily
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compatibility DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_tiers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated read on products" ON public.products;
DROP POLICY IF EXISTS "Allow admin all on products" ON public.products;

DROP POLICY IF EXISTS "Authenticated users can view equipments" ON public.equipments;
DROP POLICY IF EXISTS "Allow authenticated read on equipments" ON public.equipments;

DROP POLICY IF EXISTS "Authenticated users can view compatibility" ON public.product_compatibility;
DROP POLICY IF EXISTS "Allow authenticated read on compatibility" ON public.product_compatibility;

DROP POLICY IF EXISTS "Authenticated users can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated read on product_images" ON public.product_images;

DROP POLICY IF EXISTS "Authenticated users can view pricing tiers" ON public.product_pricing_tiers;
DROP POLICY IF EXISTS "Allow authenticated read on pricing_tiers" ON public.product_pricing_tiers;

-- Re-enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Create simple policies - READ ONLY for authenticated users
CREATE POLICY "products_select_policy" 
ON public.products FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "equipments_select_policy" 
ON public.equipments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "compatibility_select_policy" 
ON public.product_compatibility FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "product_images_select_policy" 
ON public.product_images FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "pricing_tiers_select_policy" 
ON public.product_pricing_tiers FOR SELECT 
TO authenticated 
USING (true);

-- STEP 3: Verify
-- ============================================
SELECT 'Users table policies:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

SELECT 'Products table policies:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products';

SELECT '✅ RLS policies fixed successfully!' as status;
