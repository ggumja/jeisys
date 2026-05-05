-- ============================================================
-- 주문 결제 시 포인트 차감 및 롤백 연동을 위한 스키마 업데이트
-- ============================================================

-- 1. orders 테이블에 사용된 포인트 기록 컬럼 추가
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;

-- 2. point_transactions 테이블에 해당 포인트가 사용/환불된 주문과 연결하는 컬럼 추가
ALTER TABLE public.point_transactions 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- 3. 주문 내역 연동 조회를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_point_transactions_order_id ON public.point_transactions(order_id);
