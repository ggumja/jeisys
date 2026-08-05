-- ============================================================
-- 구독번호 2607210001 건을 2회차 진행(결제완료) 상태로 업데이트하는 SQL
-- ============================================================

DO $$
DECLARE
  v_sub_id UUID;
BEGIN
  -- 1. 구독 ID 조회 (구독번호 2607210001)
  SELECT id INTO v_sub_id
  FROM subscriptions
  WHERE subscription_no = '2607210001'
  LIMIT 1;

  IF v_sub_id IS NOT NULL THEN
    -- 2. subscriptions 테이블의 current_round를 2회차로 변경
    UPDATE subscriptions
    SET current_round = 2,
        updated_at = NOW()
    WHERE id = v_sub_id;

    -- 3. 1회차 스케줄: 출고완료 (shipped)
    UPDATE subscription_shipments
    SET status = 'shipped',
        updated_at = NOW()
    WHERE subscription_id = v_sub_id
      AND round_no = 1;

    -- 4. 2회차 스케줄: 결제완료 (paid)
    UPDATE subscription_shipments
    SET status = 'paid',
        updated_at = NOW()
    WHERE subscription_id = v_sub_id
      AND round_no = 2;

    -- 5. 3회차 이상 스케줄: 예정 (pending)
    UPDATE subscription_shipments
    SET status = 'pending',
        updated_at = NOW()
    WHERE subscription_id = v_sub_id
      AND round_no > 3;

    RAISE NOTICE '구독번호 2607210001 데이터가 2회차 진행 상태로 성공적으로 업데이트되었습니다.';
  ELSE
    RAISE NOTICE '구독번호 2607210001을 찾을 수 없습니다.';
  END IF;
END $$;
