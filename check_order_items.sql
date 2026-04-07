-- ================================================
-- DUM-799066 주문 상품 내역 직접 삽입 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- Step 1: 현재 상태 확인 (실행 전 체크)
SELECT 
  o.id as order_id,
  o.order_number,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'DUM-799066'
GROUP BY o.id, o.order_number;

-- Step 2: 사용 가능한 상품 목록 확인
SELECT id, name, price FROM products LIMIT 5;
