-- 구독 테이블에 배송지 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

COMMENT ON COLUMN public.subscriptions.delivery_address IS '구독 배송지 주소';
