-- ============================================================
-- 추가 구성 상품 스키마: product_add_on_items
-- 실행 위치: Supabase > SQL Editor
-- 작성일: 2026-06-09
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_add_on_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    add_on_product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order      INT NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_add_on_items_parent_addon_unique UNIQUE (parent_product_id, add_on_product_id)
);

-- RLS 활성화
ALTER TABLE public.product_add_on_items ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "Anyone can read product add on items" ON public.product_add_on_items;
DROP POLICY IF EXISTS "Authenticated can manage product add on items" ON public.product_add_on_items;

-- 읽기 정책 (누구나 조회 가능)
CREATE POLICY "Anyone can read product add on items"
  ON public.product_add_on_items FOR SELECT USING (true);

-- 쓰기 정책 (로그인된 사용자라면 INSERT/UPDATE/DELETE 허용)
CREATE POLICY "Authenticated can manage product add on items"
  ON public.product_add_on_items
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
