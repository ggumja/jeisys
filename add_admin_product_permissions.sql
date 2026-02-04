-- ============================================
-- Add Admin Write Permissions for Products
-- ============================================
-- This allows admins to create, update, and delete products
-- ============================================

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "products_admin_write_policy" ON public.products;

-- Create comprehensive admin policy for all operations
CREATE POLICY "products_admin_write_policy" 
ON public.products 
FOR ALL 
TO authenticated 
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Also add policies for pricing tiers
DROP POLICY IF EXISTS "pricing_tiers_admin_policy" ON public.product_pricing_tiers;

CREATE POLICY "pricing_tiers_admin_policy" 
ON public.product_pricing_tiers 
FOR ALL 
TO authenticated 
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Verify policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'product_pricing_tiers')
ORDER BY tablename, policyname;

SELECT '✅ Admin write permissions added successfully!' as status;
