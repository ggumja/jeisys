-- 2회차 결제완료 후 3회차에서 고객 카드 문제로 결제실패된 정기공급 가상 데이터 삽입 스크립트

DO $$
DECLARE
  v_user_id UUID;
  v_product_id UUID;
  v_sub_id UUID := gen_random_uuid();
  v_unit_price NUMERIC := 450000;
  v_total_qty INT := 100;
  v_total_rounds INT := 10;
  v_qty_per_round INT := 10;
  v_cycle_months INT := 1;
BEGIN
  -- 1. 샘플 회원 1명 선택 (없으면 종료)
  SELECT id INTO v_user_id FROM public.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE '사용자가 존재하지 않아 스크립트를 중단합니다.';
    RETURN;
  END IF;

  -- 2. 샘플 정기공급 가능 상품 선택
  SELECT id INTO v_product_id FROM public.products LIMIT 1;

  -- 3. 정기공급 메인 테이블 데이터 삽입 (current_round: 3회차 시도 중 실패)
  INSERT INTO public.subscriptions (
    id,
    subscription_no,
    user_id,
    product_id,
    status,
    cycle_days,
    cycle_months,
    total_quantity,
    total_rounds,
    qty_per_round,
    last_round_qty,
    current_round,
    unit_price,
    regular_unit_price,
    discount_rate,
    next_billing_date,
    last_billing_date,
    created_at,
    updated_at
  ) VALUES (
    v_sub_id,
    'SUB' || FLOOR(EXTRACT(EPOCH FROM NOW())),
    v_user_id,
    v_product_id,
    'active',
    30,
    v_cycle_months,
    v_total_qty,
    v_total_rounds,
    v_qty_per_round,
    v_qty_per_round,
    3, -- 3회차에서 결제 실패 발생
    v_unit_price,
    500000,
    10,
    CURRENT_DATE + INTERVAL '1 month',
    CURRENT_DATE - INTERVAL '1 month',
    NOW() - INTERVAL '2 months',
    NOW()
  );

  -- 4. 10회차 스케줄 생성 (1, 2회차 결제완료, 3회차 결제실패, 4~10회차 대기)
  -- 1회차: 결제완료
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, quantity, amount, status, executed_at, created_at
  ) VALUES (
    v_sub_id, 1, CURRENT_DATE - INTERVAL '2 months', 10, v_unit_price, 'paid', NOW() - INTERVAL '2 months', NOW()
  );

  -- 2회차: 결제완료
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, quantity, amount, status, executed_at, created_at
  ) VALUES (
    v_sub_id, 2, CURRENT_DATE - INTERVAL '1 month', 10, v_unit_price, 'paid', NOW() - INTERVAL '1 month', NOW()
  );

  -- 3회차: 고객 카드 문제로 결제 실패!
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, quantity, amount, status, executed_at, created_at
  ) VALUES (
    v_sub_id, 3, CURRENT_DATE, 10, v_unit_price, 'failed', NOW(), NOW()
  );

  -- 4~10회차: 대기(pending)
  FOR r IN 4..10 LOOP
    INSERT INTO public.subscription_shipments (
      subscription_id, round_no, scheduled_date, quantity, amount, status, created_at
    ) VALUES (
      v_sub_id, r, CURRENT_DATE + (INTERVAL '1 month' * (r - 3)), 10, v_unit_price, 'pending', NOW()
    );
  END LOOP;

  RAISE NOTICE '2회차 결제완료, 3회차 결제실패 샘플 가상데이터 생성 완료 (Sub ID: %)', v_sub_id;
END $$;
