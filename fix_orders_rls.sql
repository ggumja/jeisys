-- =============================================
-- orders 테이블 UPDATE RLS 정책 수정
-- Supabase SQL Editor에서 실행해주세요
-- =============================================

-- 1. 현재 orders 테이블의 RLS 정책 확인
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders';

-- 2. 기존 UPDATE 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "Allow admin update orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- 3. 관리자(인증된 사용자) UPDATE 정책 추가
-- 방법 A: 인증된 모든 사용자가 모든 주문 UPDATE 가능 (관리자 전용 앱인 경우)
CREATE POLICY "Allow authenticated users to update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 방법 B: 만약 위 방법이 안 되면, RLS 자체를 비활성화 (내부 관리자 툴)
-- ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 4. 확인
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY cmd;
