-- 🗓️ 날짜: 2026-04-09
-- 🎯 목적: cart_items 테이블에 옵션 정보를 기록하기 위한 컬럼 추가

-- 1. option_id 컬럼 추가 (상품 수량 옵션 ID)
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS option_id TEXT;

-- 2. option_name 컬럼 추가 (상품 수량 옵션명)
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS option_name TEXT;

-- 💡 도움말: 컬럼 추가 후 앱에서 즉시 반영되도록 Supabase/PostgREST 스키마 캐시를 갱신합니다.
NOTIFY pgrst, 'reload schema';
