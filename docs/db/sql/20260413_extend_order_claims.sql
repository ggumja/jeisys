-- 1. order_status enum 타입 확장
-- PostgreSQL 12 이상에서는 IF NOT EXISTS 를 사용하여 안전하게 추가할 수 있습니다.
-- 이 명령은 트랜잭션 블록 외부에서 실행되어야 할 수도 있으므로, 오류 발생 시 한 줄씩 실행해 주세요.

-- enum 타입이 존재할 경우에만 실행 (오류 방지를 위해 개별 실행 권장)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancel_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returning';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'exchange_requested';

-- 2. VARCHAR 버전 대응 (schema.sql 기준 체크 제약 조건)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- status가 varchar인 경우에만 체크 제약 조건을 다시 겁니다.
-- status가 enum인 경우, 위에서 확장했으므로 이 제약 조건은 varchar 타입일 때만 작동합니다.
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'status' 
        AND data_type IN ('character varying', 'text')
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN (
          'pending', 'paid', 'processing', 'shipped', 'delivered', 
          'cancel_requested', 'return_requested', 'returning', 'returned', 'exchange_requested', 
          'cancelled'
        ));
    END IF;
END $$;

-- 2. 클레임(취소/반품/교환) 상세 필드 추가
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claim_type VARCHAR; -- 'CANCEL', 'RETURN', 'EXCHANGE'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claim_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claim_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claim_processed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS claim_rejected_reason TEXT;

-- 3. 반품/교환 상세 (수거 정보 등)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS return_tracking_number VARCHAR;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS exchange_tracking_number VARCHAR;

-- 기존 취소/환불 필드가 없는 경우를 대비해 추가
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;

COMMENT ON COLUMN public.orders.status IS '주문 상태 (pending, paid, processing, shipped, delivered, cancel_requested, return_requested, returning, returned, exchange_requested, cancelled)';
