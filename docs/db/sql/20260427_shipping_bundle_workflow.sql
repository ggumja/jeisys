-- ============================================================
-- 배송 번들(Shipping Bundle) 워크플로우를 위한 스키마 확장
-- ============================================================

-- 1. shipments 테이블에 상태 및 배송지 정보 컬럼 추가
ALTER TABLE public.shipments 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SHIPPED', -- 'PLANNED' (대기), 'SHIPPED' (발송완료)
  ADD COLUMN IF NOT EXISTS shipping_info JSONB,          -- 번들 전용 배송지 정보 (recipient, phone, zip_code, address, detail)
  ADD COLUMN IF NOT EXISTS label TEXT;                  -- 번들 별칭 (예: "병동 배송분", "창고 배송분")

-- 2. 기존 데이터 보정: 기존 발송 내역은 모두 'SHIPPED' 상태로 설정 (DEFAULT가 이미 SHIPPED임)
COMMENT ON COLUMN public.shipments.status IS 'Status of the shipment bundle: PLANNED or SHIPPED';
COMMENT ON COLUMN public.shipments.shipping_info IS 'Specific shipping address information for this bundle';

-- 3. shipment_items에 인덱스 정보가 이미 20260413_add_granular_bundle_shipping.sql에서 추가되었는지 확인
-- 만약 없다면 추가 (중복 방지 위해 IF NOT EXISTS 사용)
ALTER TABLE public.shipment_items 
  ADD COLUMN IF NOT EXISTS shipped_selected_indices INT[] DEFAULT '{}';
