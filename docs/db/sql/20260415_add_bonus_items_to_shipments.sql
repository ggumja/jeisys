-- ============================================================
-- 20260415: shipments 테이블에 bonus_items JSONB 컬럼 추가
-- 발송 시 실제로 발송된 증정품 수량을 저장하기 위함
-- 형식: [{productId, productName, quantity}]
-- ============================================================
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS bonus_items JSONB DEFAULT '[]'::jsonb;
