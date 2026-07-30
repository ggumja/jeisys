-- ============================================================
-- 포인트 이력 테스트 데이터 삭제
-- No.4 (사용, 2026-06-15) / No.5 (취소환불, 2026-07-01)
-- Supabase Dashboard > SQL Editor 에서 실행
-- ============================================================

-- 1단계: 삭제 대상 확인
SELECT id, type, amount, description, created_at
FROM point_transactions
WHERE 
  (description LIKE '%주문번호: 2026061501%' AND type = 'use')
  OR
  (description LIKE '%만료포인트 30일 연장%' AND type = 'refund')
ORDER BY created_at;

-- 2단계: 삭제 실행
-- (1단계 결과 확인 후 실행하세요)
DELETE FROM point_transactions
WHERE 
  (description LIKE '%주문번호: 2026061501%' AND type = 'use')
  OR
  (description LIKE '%만료포인트 30일 연장%' AND type = 'refund');
