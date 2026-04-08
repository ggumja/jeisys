-- ============================================
-- Fix Infinite Recursion in RLS Policies
-- ============================================
-- This script removes the circular reference
-- in RLS policies that's causing infinite recursion
-- ============================================

-- 1. Disable RLS temporarily on products to allow access
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compatibility DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_tiers DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on products and related tables
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

DROP POLICY IF EXISTS "Authenticated users can view equipments" ON public.equipments;
DROP POLICY IF EXISTS "Authenticated users can view compatibility" ON public.product_compatibility;
DROP POLICY IF EXISTS "Authenticated users can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can view pricing tiers" ON public.product_pricing_tiers;

-- 3. Re-enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- 4. Create simple policies without recursion
-- Products: Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated read on products" 
ON public.products FOR SELECT 
TO authenticated 
USING (true);

-- Products: Allow admins to do everything
CREATE POLICY "Allow admin all on products" 
ON public.products FOR ALL 
TO authenticated 
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Equipments: Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated read on equipments" 
ON public.equipments FOR SELECT 
TO authenticated 
USING (true);

-- Product Compatibility: Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated read on compatibility" 
ON public.product_compatibility FOR SELECT 
TO authenticated 
USING (true);

-- Product Images: Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated read on product_images" 
ON public.product_images FOR SELECT 
TO authenticated 
USING (true);

-- Product Pricing Tiers: Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated read on pricing_tiers" 
ON public.product_pricing_tiers FOR SELECT 
TO authenticated 
USING (true);

-- 5. Verify policies
SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'equipments', 'product_compatibility', 'product_images', 'product_pricing_tiers')
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies fixed successfully!' as status;
