-- ================================================
-- order_items 테이블 RLS 정책 추가
-- Admin이 모든 주문 상품을 조회할 수 있도록 허용
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. 현재 RLS 정책 확인 (먼저 실행해서 확인)
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'order_items';

-- 2. Admin 전체 조회 허용 정책 추가
CREATE POLICY "Allow full access to order_items for authenticated users"
ON public.order_items
FOR SELECT
USING (true);

-- 3. 정책이 이미 있어서 오류가 난다면 아래 실행
-- DROP POLICY IF EXISTS "Allow full access to order_items for authenticated users" ON public.order_items;
-- 그리고 다시 위의 CREATE POLICY 실행
