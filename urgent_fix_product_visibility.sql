-- ============================================
-- URGENT FIX: Enable Product Visibility
-- ============================================
-- This fixes the RLS policies so products show up
-- ============================================

-- Step 1: Drop all existing conflicting policies
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_admin_write_policy" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated read on products" ON public.products;
DROP POLICY IF EXISTS "Allow admin all on products" ON public.products;

-- Step 2: Create simple, working policies
-- Allow ALL authenticated users to SELECT products
CREATE POLICY "authenticated_users_can_view_products" 
ON public.products 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to do everything (INSERT, UPDATE, DELETE)
CREATE POLICY "admins_can_manage_products" 
ON public.products 
FOR ALL 
TO authenticated 
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Step 3: Verify policies are created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'products';

-- Step 4: Test query
SELECT 
    'Products now visible:' as status,
    COUNT(*) as count
FROM public.products;

SELECT '✅ Products should now be visible!' as result;
