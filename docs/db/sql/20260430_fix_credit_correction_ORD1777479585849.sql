-- ============================================================
-- 크레딧 잘못 차감 수동 정정
-- 주문: ORD-1777479585849-717
-- 문제: Density에서 4,015,000 차감 (실제로는 Density 385,000 + POTENZA 165,000)
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

DO $$
DECLARE
  v_order_id         UUID;
  v_bad_tx           RECORD;
  v_density_credit   RECORD;
  v_potenza_credit   RECORD;
  v_user_id          UUID;
  v_density_amount   NUMERIC := 385000;
  v_potenza_amount   NUMERIC := 165000;
BEGIN
  -- 1. 주문 UUID 조회
  SELECT id, user_id INTO v_order_id, v_user_id
  FROM public.orders
  WHERE order_number = 'ORD-1777479585849-717'
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION '주문을 찾을 수 없습니다.';
  END IF;

  RAISE NOTICE '주문 ID: %', v_order_id;

  -- 2. 기존 잘못된 'use' 트랜잭션 확인 후 역전 처리
  FOR v_bad_tx IN
    SELECT ct.id AS tx_id, ct.credit_id, ct.amount, uc.equipment_type
    FROM public.credit_transactions ct
    JOIN public.user_credits uc ON ct.credit_id = uc.id
    WHERE ct.order_id = v_order_id
      AND ct.type = 'use'
  LOOP
    RAISE NOTICE '잘못된 차감 발견: % % % 원', v_bad_tx.equipment_type, v_bad_tx.credit_id, v_bad_tx.amount;

    -- used_amount 복원
    UPDATE public.user_credits
    SET used_amount = GREATEST(0, used_amount - v_bad_tx.amount),
        status = CASE WHEN status = 'exhausted' THEN 'active' ELSE status END
    WHERE id = v_bad_tx.credit_id;

    -- 정정 기록 (refund 타입으로 이력 남김)
    INSERT INTO public.credit_transactions
      (credit_id, user_id, amount, type, order_id, description)
    VALUES
      (v_bad_tx.credit_id, v_user_id, v_bad_tx.amount, 'refund', v_order_id, '오차감 수동 정정 (역전)');
  END LOOP;

  -- 3. Density 385,000 올바르게 차감
  SELECT id, (amount - used_amount) AS balance
  INTO v_density_credit
  FROM public.user_credits
  WHERE user_id = v_user_id
    AND equipment_type = 'Density'
    AND status = 'active'
    AND expiry_date >= CURRENT_DATE
    AND (amount - used_amount) >= v_density_amount
  ORDER BY expiry_date ASC, created_at ASC
  LIMIT 1;

  IF v_density_credit.id IS NULL THEN
    RAISE EXCEPTION 'Density 크레딧 잔액 부족 (필요: %)', v_density_amount;
  END IF;

  UPDATE public.user_credits
  SET used_amount = used_amount + v_density_amount,
      status = CASE WHEN (amount - used_amount - v_density_amount) <= 0 THEN 'exhausted' ELSE 'active' END
  WHERE id = v_density_credit.id;

  INSERT INTO public.credit_transactions
    (credit_id, user_id, amount, type, order_id, description)
  VALUES
    (v_density_credit.id, v_user_id, v_density_amount, 'use', v_order_id, 'Density 크레딧 사용 (수동 정정)');

  RAISE NOTICE 'Density 차감 완료: % 원', v_density_amount;

  -- 4. POTENZA 165,000 올바르게 차감
  SELECT id, (amount - used_amount) AS balance
  INTO v_potenza_credit
  FROM public.user_credits
  WHERE user_id = v_user_id
    AND equipment_type = 'POTENZA'
    AND status = 'active'
    AND expiry_date >= CURRENT_DATE
    AND (amount - used_amount) >= v_potenza_amount
  ORDER BY expiry_date ASC, created_at ASC
  LIMIT 1;

  IF v_potenza_credit.id IS NULL THEN
    RAISE EXCEPTION 'POTENZA 크레딧 잔액 부족 (필요: %)', v_potenza_amount;
  END IF;

  UPDATE public.user_credits
  SET used_amount = used_amount + v_potenza_amount,
      status = CASE WHEN (amount - used_amount - v_potenza_amount) <= 0 THEN 'exhausted' ELSE 'active' END
  WHERE id = v_potenza_credit.id;

  INSERT INTO public.credit_transactions
    (credit_id, user_id, amount, type, order_id, description)
  VALUES
    (v_potenza_credit.id, v_user_id, v_potenza_amount, 'use', v_order_id, 'POTENZA 크레딧 사용 (수동 정정)');

  RAISE NOTICE 'POTENZA 차감 완료: % 원', v_potenza_amount;
  RAISE NOTICE '정정 완료 ✓ Density -%, POTENZA -%', v_density_amount, v_potenza_amount;

END $$;
