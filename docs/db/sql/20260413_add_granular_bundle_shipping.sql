-- ============================================================
-- 프로모션 번들 개별 품목 부분 발송 지원을 위한 스키마 확장
-- ============================================================

-- 1. order_items 테이블에 발송 완료된 구성품 인덱스 배열 추가
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS shipped_selected_indices INT[] DEFAULT '{}';

COMMENT ON COLUMN public.order_items.shipped_selected_indices IS 'Array of indices from selected_product_ids that have been shipped';

-- 2. shipment_items 테이블에 해당 발송 건에 포함된 구성품 인덱스 배열 추가
ALTER TABLE public.shipment_items 
ADD COLUMN IF NOT EXISTS shipped_selected_indices INT[] DEFAULT '{}';

COMMENT ON COLUMN public.shipment_items.shipped_selected_indices IS 'Array of indices from selected_product_ids included in this specific shipment';
