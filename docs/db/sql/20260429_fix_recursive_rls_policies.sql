-- ============================================================
-- RLS 재귀 정책 일괄 교체
-- EXISTS (SELECT 1 FROM users WHERE role='admin') 패턴을
-- check_is_admin() (SECURITY DEFINER) 함수로 교체
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 작성일: 2026-04-29
-- ============================================================

-- ── categories ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin Full Access" ON public.categories;
CREATE POLICY "Admin Full Access" ON public.categories
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── demo_requests ───────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all demo requests" ON public.demo_requests;
CREATE POLICY "Admins can manage all demo requests" ON public.demo_requests
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── faq_categories ──────────────────────────────────────────
DROP POLICY IF EXISTS "Admin Full Access" ON public.faq_categories;
CREATE POLICY "Admin Full Access" ON public.faq_categories
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── inquiries ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all inquiries" ON public.inquiries;
CREATE POLICY "Admins can manage all inquiries" ON public.inquiries
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
CREATE POLICY "Admins can view all inquiries" ON public.inquiries
FOR SELECT TO authenticated
USING (check_is_admin());

DROP POLICY IF EXISTS "Users can view inquiries" ON public.inquiries;
CREATE POLICY "Users can view inquiries" ON public.inquiries
FOR SELECT TO authenticated
USING (
  (is_secret = false)
  OR (auth.uid() = user_id)
  OR check_is_admin()
);

-- ── order_status_history ────────────────────────────────────
DROP POLICY IF EXISTS "Admins can do everything on order_status_history" ON public.order_status_history;
CREATE POLICY "Admins can do everything on order_status_history" ON public.order_status_history
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── package_items ───────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage package items" ON public.package_items;
CREATE POLICY "Admins can manage package items" ON public.package_items
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── posts ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;
CREATE POLICY "Admins can manage posts" ON public.posts
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── product_compatibility ───────────────────────────────────
DROP POLICY IF EXISTS "Allow admin all on product_compatibility" ON public.product_compatibility;
CREATE POLICY "Allow admin all on product_compatibility" ON public.product_compatibility
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── product_images ──────────────────────────────────────────
DROP POLICY IF EXISTS "Allow admin all on product_images" ON public.product_images;
CREATE POLICY "Allow admin all on product_images" ON public.product_images
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── product_pricing_tiers ───────────────────────────────────
DROP POLICY IF EXISTS "Allow admin all on product_pricing_tiers" ON public.product_pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_admin_policy" ON public.product_pricing_tiers;
CREATE POLICY "Allow admin all on product_pricing_tiers" ON public.product_pricing_tiers
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── products ────────────────────────────────────────────────
DROP POLICY IF EXISTS "admins_can_manage_products" ON public.products;
CREATE POLICY "admins_can_manage_products" ON public.products
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── shipping_addresses ──────────────────────────────────────
DROP POLICY IF EXISTS "addresses_admin_all" ON public.shipping_addresses;
CREATE POLICY "addresses_admin_all" ON public.shipping_addresses
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── shop_settings ───────────────────────────────────────────
DROP POLICY IF EXISTS "관리자 쓰기" ON public.shop_settings;
CREATE POLICY "관리자 쓰기" ON public.shop_settings
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── sms_refusal ─────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_sms_refusal" ON public.sms_refusal;
CREATE POLICY "admin_all_sms_refusal" ON public.sms_refusal
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── sms_send_history ────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_sms_send_history" ON public.sms_send_history;
CREATE POLICY "admin_all_sms_send_history" ON public.sms_send_history
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── sms_template_groups ─────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_sms_template_groups" ON public.sms_template_groups;
CREATE POLICY "admin_all_sms_template_groups" ON public.sms_template_groups
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── sms_templates ───────────────────────────────────────────
DROP POLICY IF EXISTS "admin_all_sms_templates" ON public.sms_templates;
CREATE POLICY "admin_all_sms_templates" ON public.sms_templates
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── users (이미 auth.jwt() 포함이지만 단순화) ──────────────
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
FOR ALL TO authenticated
USING (check_is_admin()) WITH CHECK (check_is_admin());

-- ── 검증: 재귀 패턴이 남아있는지 확인 ──────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE qual LIKE '%FROM users%role%admin%'
   OR qual LIKE '%FROM users%admin%role%'
ORDER BY tablename;
-- 결과가 0건이면 완료!
