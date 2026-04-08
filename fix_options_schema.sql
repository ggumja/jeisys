-- ============================================================
-- 단일상품 세트 옵션(수량/명칭 지정 및 개별 증정상품 맵핑)용 스키마 확장
-- ============================================================

-- 1. 새로운 옵션 테이블 생성 (product_quantity_options)
CREATE TABLE IF NOT EXISTS public.product_quantity_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  discount_rate NUMERIC DEFAULT 0,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책 설정
ALTER TABLE public.product_quantity_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select product_quantity_options" ON public.product_quantity_options;
CREATE POLICY "Allow select product_quantity_options" ON public.product_quantity_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert product_quantity_options" ON public.product_quantity_options;
CREATE POLICY "Allow insert product_quantity_options" ON public.product_quantity_options FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update product_quantity_options" ON public.product_quantity_options;
CREATE POLICY "Allow update product_quantity_options" ON public.product_quantity_options FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete product_quantity_options" ON public.product_quantity_options;
CREATE POLICY "Allow delete product_quantity_options" ON public.product_quantity_options FOR DELETE USING (true);

-- 2. product_bonus_items 에 option_id 필드 추가
-- 옵션 전용 보너스 상품일 경우 option_id를 매핑함. 기본 보너스는 null
ALTER TABLE public.product_bonus_items 
ADD COLUMN IF NOT EXISTS option_id UUID REFERENCES public.product_quantity_options(id) ON DELETE CASCADE;

-- 3. cart_items와 order_items 에 옵션 식별 필드 추가
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS option_id UUID REFERENCES public.product_quantity_options(id) ON DELETE SET NULL;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS option_id UUID,
ADD COLUMN IF NOT EXISTS option_name TEXT;

SELECT 'Set Options Schema Update Completed!' AS result;
