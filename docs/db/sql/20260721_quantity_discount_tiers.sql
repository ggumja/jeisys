-- ============================================================
-- 정기구독 수량 구간별 할인율 컬럼 추가
-- 2026-07-21
-- ============================================================

-- products 테이블에 quantity_discount_tiers JSONB 컬럼 추가
-- 구조: [{ "minQty": 0, "maxQty": 49, "discountRate": 0 }, ...]
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantity_discount_tiers JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.quantity_discount_tiers
  IS '수량 구간별 할인율 설정. 예: [{"minQty":0,"maxQty":49,"discountRate":0},{"minQty":50,"maxQty":99,"discountRate":10}]';
