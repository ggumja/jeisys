-- =============================================================
-- 정기구독 상품 옵션 테이블 + products 테이블 product_type 컬럼
-- 2026-07-21 (멱등성 버전 - 재실행 안전)
-- =============================================================

-- 1. products 테이블에 product_type 컬럼 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type VARCHAR DEFAULT 'single';

-- CHECK 제약조건 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_product_type_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_product_type_check
      CHECK (product_type IN ('single', 'set', 'package', 'promotion', 'subscription'));
  END IF;
END $$;

-- 기존 is_subscription_product = true 인 상품 마이그레이션
UPDATE public.products
  SET product_type = 'subscription'
  WHERE is_subscription_product = true
    AND (product_type IS NULL OR product_type = 'single');

-- 2. 정기구독 상품 옵션 테이블
CREATE TABLE IF NOT EXISTS public.subscription_product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  option_label VARCHAR NOT NULL,
  total_quantity INTEGER NOT NULL,
  discount_rate NUMERIC(5,2) DEFAULT 0,
  round_combinations JSONB DEFAULT '[]'::jsonb NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sub_product_options_product
  ON public.subscription_product_options(product_id);

-- 3. RLS 활성화
ALTER TABLE public.subscription_product_options ENABLE ROW LEVEL SECURITY;

-- 4. 정책 (DROP 후 재생성 → 재실행 안전)
DROP POLICY IF EXISTS "Anyone can view active subscription options" ON public.subscription_product_options;
CREATE POLICY "Anyone can view active subscription options"
  ON public.subscription_product_options FOR SELECT
  USING (is_active = true);

-- 어드민 쓰기 정책 (인증된 사용자 전체 권한)
DROP POLICY IF EXISTS "Authenticated users can manage subscription options" ON public.subscription_product_options;
CREATE POLICY "Authenticated users can manage subscription options"
  ON public.subscription_product_options
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
