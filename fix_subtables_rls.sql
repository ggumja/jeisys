-- ============================================
-- FIX: Enable Selection for Product Sub-Tables
-- ============================================

-- 1. Product Images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_product_images" ON public.product_images;
CREATE POLICY "public_view_product_images" ON public.product_images
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_product_images" ON public.product_images;
CREATE POLICY "admin_manage_product_images" ON public.product_images
FOR ALL TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 2. Product Pricing Tiers
ALTER TABLE public.product_pricing_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_product_pricing_tiers" ON public.product_pricing_tiers;
CREATE POLICY "public_view_product_pricing_tiers" ON public.product_pricing_tiers
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_product_pricing_tiers" ON public.product_pricing_tiers;
CREATE POLICY "admin_manage_product_pricing_tiers" ON public.product_pricing_tiers
FOR ALL TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 3. Product Compatibility
ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_view_product_compatibility" ON public.product_compatibility;
CREATE POLICY "public_view_product_compatibility" ON public.product_compatibility
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_product_compatibility" ON public.product_compatibility;
CREATE POLICY "admin_manage_product_compatibility" ON public.product_compatibility
FOR ALL TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

SELECT '✅ RLS Policies for sub-tables fixed!' as result;
