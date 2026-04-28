-- member_types 테이블에 분할배송 설정 컬럼 추가
ALTER TABLE member_types ADD COLUMN IF NOT EXISTS partial_shipment BOOLEAN DEFAULT FALSE;
