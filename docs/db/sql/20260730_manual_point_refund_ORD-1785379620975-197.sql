-- ============================================================
-- 수동 포인트 환불: ORD-1785379620975-197
-- 실행 방법: Supabase 대시보드 > SQL Editor 에서 순서대로 실행
-- ============================================================

-- 1단계: 주문 정보 확인
SELECT 
  id, 
  order_number, 
  status, 
  points_used,
  user_id,
  updated_at
FROM orders 
WHERE order_number = 'ORD-1785379620975-197';

-- 2단계: 해당 주문에 연결된 포인트 사용 내역 확인
SELECT 
  pt.id,
  pt.user_id,
  pt.amount,
  pt.type,
  pt.order_id,
  pt.description,
  pt.created_at
FROM point_transactions pt
JOIN orders o ON pt.order_id = o.id
WHERE o.order_number = 'ORD-1785379620975-197'
ORDER BY pt.created_at;

-- 3단계: 이미 refund 처리가 되었는지 확인 (있으면 중복 처리 금지)
SELECT 
  pt.id,
  pt.type,
  pt.amount,
  pt.created_at
FROM point_transactions pt
JOIN orders o ON pt.order_id = o.id
WHERE o.order_number = 'ORD-1785379620975-197'
  AND pt.type = 'refund';

-- ============================================================
-- 4단계: refund가 없을 경우에만 아래 INSERT 실행
-- (3단계 결과가 비어 있을 때만 실행하세요!)
-- ============================================================
DO $$
DECLARE
  v_order_id UUID;
  v_user_id UUID;
  v_total_used NUMERIC := 0;
  v_refund_exists INTEGER := 0;
BEGIN
  -- 주문 ID / 유저 ID 조회
  SELECT id, user_id INTO v_order_id, v_user_id
  FROM orders
  WHERE order_number = 'ORD-1785379620975-197';

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION '주문을 찾을 수 없습니다: ORD-1785379620975-197';
  END IF;

  -- 이미 환불 처리 여부 확인
  SELECT COUNT(*) INTO v_refund_exists
  FROM point_transactions
  WHERE order_id = v_order_id AND type = 'refund';

  IF v_refund_exists > 0 THEN
    RAISE NOTICE '이미 포인트 환불이 처리된 주문입니다. 중복 실행을 건너뜁니다.';
    RETURN;
  END IF;

  -- 사용된 포인트 합산
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_used
  FROM point_transactions
  WHERE order_id = v_order_id AND type = 'use';

  IF v_total_used = 0 THEN
    RAISE NOTICE '사용된 포인트가 없습니다. 환불 처리를 건너뜁니다.';
    RETURN;
  END IF;

  -- 포인트 환불 트랜잭션 인서트
  INSERT INTO point_transactions (user_id, amount, type, order_id, description)
  VALUES (
    v_user_id,
    v_total_used,
    'refund',
    v_order_id,
    '주문 취소에 따른 포인트 수동 환불 (ORD-1785379620975-197)'
  );

  RAISE NOTICE '포인트 환불 완료: % P', v_total_used;
END;
$$;

-- ============================================================
-- 5단계: 처리 결과 최종 확인
-- ============================================================
SELECT 
  pt.type,
  pt.amount,
  pt.description,
  pt.created_at
FROM point_transactions pt
JOIN orders o ON pt.order_id = o.id
WHERE o.order_number = 'ORD-1785379620975-197'
ORDER BY pt.created_at;
