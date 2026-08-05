-- ============================================================
-- 구독번호 2607210001 건을 2회차 결제완료 상태로 삽입/업데이트하는 SQL 스크립트
-- Supabase SQL Editor (https://app.supabase.com/project/xbtnhnkwlioufpyeuyyg/sql)에서 실행해 주세요.
-- ============================================================

DO $$
DECLARE
  v_user_id     UUID;
  v_product_id  UUID;
  v_sub_id      UUID;
  v_sub_no      TEXT := '2607210001';
BEGIN
  -- 1. 사용자 ID 조회 (admin@jeisys.com 또는 첫 번째 사용자)
  SELECT id INTO v_user_id
  FROM public.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '사용자를 찾을 수 없습니다.';
  END IF;

  -- 2. 알파팁 상품 ID 조회 (없으면 첫 번째 상품)
  SELECT id INTO v_product_id
  FROM public.products
  WHERE name ILIKE '%알파팁%'
  LIMIT 1;

  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id
    FROM public.products
    LIMIT 1;
  END IF;

  -- 3. 기존 구독 조회 (subscription_no = '2607210001')
  SELECT id INTO v_sub_id
  FROM public.subscriptions
  WHERE subscription_no = v_sub_no
  LIMIT 1;

  IF v_sub_id IS NULL THEN
    v_sub_id := gen_random_uuid();
    -- 신규 구독 데이터 생성 (2회차 진행 중)
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
      v_sub_no,
      v_user_id,
      v_product_id,
      'active',
      60,
      2,
      200,
      5,
      40,
      40,
      2, -- ★ 2회차 진행 완료/결제완료
      23100000,
      25000000,
      10,
      '2026-11-21',
      '2026-09-21',
      '2026-07-21 00:00:00+09',
      NOW()
    );
  ELSE
    -- 기존 구독 데이터 2회차로 업데이트
    UPDATE public.subscriptions
    SET current_round = 2,
        status = 'active',
        unit_price = 23100000,
        total_quantity = 200,
        qty_per_round = 40,
        total_rounds = 5,
        updated_at = NOW()
    WHERE id = v_sub_id;
  END IF;

  -- 4. 기존 회차 스케줄 삭제 후 2회차 결제완료 스케줄 재구성
  DELETE FROM public.subscription_shipments
  WHERE subscription_id = v_sub_id;

  -- 1회차: 출고완료 (shipped) 또는 결제완료 (paid)
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, status, quantity, amount, created_at
  ) VALUES (
    v_sub_id, 1, '2026-07-21', 'shipped', 40, 23100000, NOW()
  );

  -- 2회차: 결제완료 (paid)
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, status, quantity, amount, created_at
  ) VALUES (
    v_sub_id, 2, '2026-09-21', 'paid', 40, 23100000, NOW()
  );

  -- 3~5회차: 예정 (pending)
  INSERT INTO public.subscription_shipments (
    subscription_id, round_no, scheduled_date, status, quantity, amount, created_at
  ) VALUES
    (v_sub_id, 3, '2026-11-21', 'pending', 40, 23100000, NOW()),
    (v_sub_id, 4, '2027-01-21', 'pending', 40, 23100000, NOW()),
    (v_sub_id, 5, '2027-03-21', 'pending', 40, 23100000, NOW());

  RAISE NOTICE '구독번호 2607210001 (알파팁 200개 / 2개월) 2회차 결제완료 데이터 구성 완료!';
END $$;
