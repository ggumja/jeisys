-- order_items 테이블에 원가 및 할인율 컬럼 추가
-- 주문 생성 시 저장 → 상품 가격 변동과 무관하게 주문 당시 할인 정보 보존

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS original_unit_price DECIMAL(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_rate       NUMERIC(5,2)  DEFAULT 0;

COMMENT ON COLUMN public.order_items.original_unit_price IS '할인 전 단가 (정가 또는 구간 정가)';
COMMENT ON COLUMN public.order_items.discount_rate       IS '총 할인율 (%, 예: 8.0 = 8%)';
