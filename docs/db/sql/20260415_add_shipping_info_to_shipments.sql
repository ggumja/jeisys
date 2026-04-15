-- ============================================================
-- 20260415: shipments 테이블에 shipping_info JSONB 컬럼 추가
-- 발송 시 실제로 발송된 배송지 정보를 저장하기 위함
-- 형식: { recipient, phone, zipCode, address, addressDetail }
-- ============================================================
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT NULL;
