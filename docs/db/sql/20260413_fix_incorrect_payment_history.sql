-- 기존 히스토리 데이터 중 신용카드 주문임에도 '가상계좌'로 잘못 기록된 환불 내역을 '신용카드'로 일괄 보정하는 SQL

-- 1. 보정 대상 데이터 확인 (조회용)
SELECT 
    ph.id, 
    ph.order_id, 
    o.order_number, 
    o.payment_method as original_method, 
    ph.method as recorded_method, 
    ph.transaction_type, 
    ph.created_at
FROM payment_history ph
JOIN orders o ON ph.order_id = o.id
WHERE ph.transaction_type IN ('REFUND', 'PARTIAL_REFUND')
  AND ph.method = 'virtual'
  AND o.payment_method = 'credit';

-- 2. 실제 데이터 업데이트 실행
UPDATE payment_history ph
SET method = 'credit'
FROM orders o
WHERE ph.order_id = o.id
  AND ph.transaction_type IN ('REFUND', 'PARTIAL_REFUND')
  AND ph.method = 'virtual'
  AND o.payment_method = 'credit';

-- 3. 통합 히스토리(Audit Log) 설명 문구 보정 (기존 데이터)
-- '주문이 생성되었습니다. (결제수단: credit)' -> '(결제수단: 신용카드)'
UPDATE order_status_history
SET action_description = REPLACE(action_description, '(결제수단: credit)', '(결제수단: 신용카드)')
WHERE action_description LIKE '%(결제수단: credit)%';

-- '주문이 생성되었습니다. (결제수단: virtual)' -> '(결제수단: 가상계좌)'
UPDATE order_status_history
SET action_description = REPLACE(action_description, '(결제수단: virtual)', '(결제수단: 가상계좌)')
WHERE action_description LIKE '%(결제수단: virtual)%';
